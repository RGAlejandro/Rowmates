"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { t } from "@/i18n";
import { ensureFilm } from "@/server/films";
import { recomputeTasteProfile } from "@/server/taste";
import { assertMember } from "@/server/guards";
import { circleMemberIds, notify } from "@/server/notifications";
import { runAction, UserError } from "@/server/action";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const logSchema = z.object({
  tmdbId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).nullable(),
  liked: z.boolean(),
  watchedOn: dateSchema.nullable(),
  review: z.string().trim().max(5000).nullable(),
  hasSpoilers: z.boolean(),
  isRewatch: z.boolean(),
  /** "Watched together with" a circle: opens a screening so the others can join and rate blind. */
  circleId: z.string().nullable(),
});

export type LogInput = z.input<typeof logSchema>;

export async function logFilm(input: LogInput) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = logSchema.parse(input);
    const film = await ensureFilm(data.tmdbId);
    const watchedOn = data.watchedOn ? new Date(`${data.watchedOn}T00:00:00Z`) : null;

    let screeningId: string | null = null;
    if (data.circleId) {
      await assertMember(data.circleId, viewer.id);
      const circle = await db.circle.findUniqueOrThrow({ where: { id: data.circleId }, select: { name: true } });
      const screening = await db.screening.create({
        data: {
          circleId: data.circleId,
          filmId: film.tmdbId,
          hostId: viewer.id,
          status: "WATCHED",
          watchedAt: watchedOn ?? new Date(),
          attendees: { create: { userId: viewer.id, rsvp: "GOING" } },
        },
      });
      screeningId = screening.id;
      const members = await circleMemberIds(data.circleId);
      await notify(
        members,
        "SCREENING_LOGGED",
        { actorName: viewer.displayName, circleId: data.circleId, circleName: circle.name, filmTitle: film.title, screeningId },
        viewer.id,
      );
    }

    const log = await db.logEntry.create({
      data: {
        userId: viewer.id,
        filmId: film.tmdbId,
        rating: data.rating,
        liked: data.liked,
        watchedOn,
        review: data.review || null,
        hasSpoilers: data.hasSpoilers,
        isRewatch: data.isRewatch,
        screeningId,
      },
    });

    // A logged film can't stay on the watchlist.
    await db.watchlistItem.deleteMany({ where: { userId: viewer.id, filmId: film.tmdbId } });
    if (data.rating !== null) after(() => recomputeTasteProfile(viewer.id));
    refresh();
    return { id: log.id, screeningId };
  });
}

export async function deleteLog(id: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const log = await db.logEntry.findUnique({ where: { id }, select: { userId: true, rating: true } });
    if (!log || log.userId !== viewer.id) throw new UserError(t("errors.forbidden"));
    await db.logEntry.delete({ where: { id } });
    if (log.rating !== null) after(() => recomputeTasteProfile(viewer.id));
    refresh();
    return null;
  });
}

export async function setWatchlist(tmdbId: number, onWatchlist: boolean) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const filmId = z.number().int().positive().parse(tmdbId);
    if (onWatchlist) {
      await ensureFilm(filmId);
      await db.watchlistItem.upsert({
        where: { userId_filmId: { userId: viewer.id, filmId } },
        create: { userId: viewer.id, filmId },
        update: {},
      });
    } else {
      await db.watchlistItem.deleteMany({ where: { userId: viewer.id, filmId } });
    }
    refresh();
    return null;
  });
}

export async function setFavorites(tmdbIds: number[]) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const ids = z.array(z.number().int().positive()).max(4).parse([...new Set(tmdbIds)]);
    for (const id of ids) await ensureFilm(id);
    await db.$transaction([
      db.favoriteFilm.deleteMany({ where: { userId: viewer.id } }),
      db.favoriteFilm.createMany({ data: ids.map((filmId, i) => ({ userId: viewer.id, filmId, position: i + 1 })) }),
    ]);
    refresh();
    return null;
  });
}
