"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { canForceReveal, canRate } from "@/lib/screenings/reveal";
import { t } from "@/i18n";
import { ensureFilm } from "@/server/films";
import { assertMember } from "@/server/guards";
import { circleMemberIds, notify } from "@/server/notifications";
import { loadRevealState, maybeReveal, revealScreening } from "@/server/screenings";
import { recomputeTasteProfile } from "@/server/taste";
import { runAction, UserError } from "@/server/action";

const planSchema = z.object({
  circleId: z.string().min(1),
  tmdbId: z.number().int().positive(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable(),
  location: z.enum(["HOME", "CINEMA", "OTHER"]),
  venue: z.string().trim().max(120).nullable(),
});

export async function planScreening(input: z.input<typeof planSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = planSchema.parse(input);
    await assertMember(data.circleId, viewer.id);
    const film = await ensureFilm(data.tmdbId);
    const screening = await db.screening.create({
      data: {
        circleId: data.circleId,
        filmId: film.tmdbId,
        hostId: viewer.id,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        location: data.location,
        venue: data.venue || null,
        attendees: { create: { userId: viewer.id, rsvp: "GOING" } },
      },
      include: { circle: { select: { name: true } } },
    });
    await notify(
      await circleMemberIds(data.circleId),
      "SCREENING_PLANNED",
      { actorName: viewer.displayName, circleId: data.circleId, circleName: screening.circle.name, filmTitle: film.title, screeningId: screening.id },
      viewer.id,
    );
    return { screeningId: screening.id };
  });
}

async function screeningForMember(screeningId: string, userId: string) {
  const screening = await db.screening.findUnique({ where: { id: screeningId } });
  if (!screening) throw new UserError(t("common.notFound"));
  await assertMember(screening.circleId, userId);
  return screening;
}

export async function setRsvp(screeningId: string, rsvp: "GOING" | "MAYBE" | "DECLINED") {
  return runAction(async () => {
    const viewer = await requireViewer();
    await screeningForMember(screeningId, viewer.id);
    const value = z.enum(["GOING", "MAYBE", "DECLINED"]).parse(rsvp);
    await db.screeningAttendee.upsert({
      where: { screeningId_userId: { screeningId, userId: viewer.id } },
      create: { screeningId, userId: viewer.id, rsvp: value },
      update: { rsvp: value },
    });
    refresh();
    return null;
  });
}

export async function markWatched(screeningId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const screening = await screeningForMember(screeningId, viewer.id);
    if (screening.status !== "PLANNED") return null;
    await db.screening.update({ where: { id: screeningId }, data: { status: "WATCHED", watchedAt: new Date() } });
    await db.screeningAttendee.upsert({
      where: { screeningId_userId: { screeningId, userId: viewer.id } },
      create: { screeningId, userId: viewer.id, rsvp: "GOING" },
      update: { rsvp: "GOING" },
    });
    refresh();
    return null;
  });
}

const sealSchema = z.object({
  screeningId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  review: z.string().trim().max(5000).nullable(),
});

/** The secret rating. Stored as a normal diary entry, hidden from everyone else until the reveal. */
export async function sealRating(input: z.input<typeof sealSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = sealSchema.parse(input);
    const screening = await screeningForMember(data.screeningId, viewer.id);
    const loaded = await loadRevealState(data.screeningId);
    if (!loaded || !canRate(loaded.state, new Date())) throw new UserError(t("common.somethingWrong"));
    if (screening.status === "REVEALED" || screening.status === "CANCELLED") throw new UserError(t("common.somethingWrong"));

    if (screening.status === "PLANNED") {
      await db.screening.update({ where: { id: screening.id }, data: { status: "WATCHED", watchedAt: screening.scheduledAt ?? new Date() } });
    }
    await db.screeningAttendee.upsert({
      where: { screeningId_userId: { screeningId: screening.id, userId: viewer.id } },
      create: { screeningId: screening.id, userId: viewer.id, rsvp: "GOING" },
      update: { rsvp: "GOING" },
    });
    const watchedOn = new Date((screening.watchedAt ?? screening.scheduledAt ?? new Date()).toISOString().slice(0, 10));
    await db.logEntry.upsert({
      where: { userId_screeningId: { userId: viewer.id, screeningId: screening.id } },
      create: { userId: viewer.id, filmId: screening.filmId, screeningId: screening.id, rating: data.rating, review: data.review || null, watchedOn },
      update: { rating: data.rating, review: data.review || null },
    });
    await db.watchlistItem.deleteMany({ where: { userId: viewer.id, filmId: screening.filmId } });
    await maybeReveal(screening.id);
    after(() => recomputeTasteProfile(viewer.id));
    refresh();
    return null;
  });
}

export async function forceReveal(screeningId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const screening = await screeningForMember(screeningId, viewer.id);
    const loaded = await loadRevealState(screeningId);
    if (!loaded || !canForceReveal(loaded.state, viewer.id, screening.hostId)) throw new UserError(t("errors.forbidden"));
    await revealScreening(screeningId);
    refresh();
    return null;
  });
}

export async function cancelScreening(screeningId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const screening = await screeningForMember(screeningId, viewer.id);
    if (screening.hostId !== viewer.id) throw new UserError(t("errors.forbidden"));
    // Any sealed ratings become ordinary diary entries instead of staying hidden forever.
    await db.$transaction([
      db.logEntry.updateMany({ where: { screeningId }, data: { screeningId: null } }),
      db.screening.update({ where: { id: screeningId }, data: { status: "CANCELLED" } }),
    ]);
    refresh();
    return null;
  });
}
