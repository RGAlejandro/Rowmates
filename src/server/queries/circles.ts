import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { revealSummary } from "@/lib/screenings/reveal";

const filmCard = { select: { tmdbId: true, title: true, year: true, posterPath: true } } as const;
const person = { select: { id: true, username: true, displayName: true, avatarUrl: true } } as const;

export async function getMyCircles(viewerId: string) {
  return db.circle.findMany({
    where: { members: { some: { userId: viewerId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      kind: true,
      members: { orderBy: { joinedAt: "asc" }, take: 6, select: { user: person } },
      _count: { select: { members: true, screenings: { where: { status: "REVEALED" } } } },
    },
  });
}

/** The circle if the viewer belongs to it, otherwise null (treated as not found). */
export const getCircle = cache(async (circleId: string, viewerId: string) => {
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    select: {
      id: true,
      name: true,
      kind: true,
      createdAt: true,
      members: { orderBy: { joinedAt: "asc" }, select: { role: true, joinedAt: true, user: person } },
    },
  });
  if (!circle || !circle.members.some((m) => m.user.id === viewerId)) return null;
  return circle;
});

export async function getCircleUpNext(circleId: string) {
  const [screenings, picks] = await Promise.all([
    db.screening.findMany({
      where: { circleId, status: { in: ["PLANNED", "WATCHED"] } },
      orderBy: [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        location: true,
        venue: true,
        film: filmCard,
        attendees: { where: { rsvp: "GOING" }, select: { user: person } },
        logs: { select: { userId: true } },
      },
    }),
    db.pickSession.findMany({
      where: { circleId, status: "VOTING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, host: person, participants: { select: { userId: true, submittedAt: true } } },
    }),
  ]);
  return { screenings, picks };
}

export async function getCircleWatchlist(circleId: string) {
  return db.circleWatchlistItem.findMany({
    where: { circleId },
    orderBy: { addedAt: "desc" },
    select: { film: filmCard, addedBy: person },
  });
}

/** Revealed screenings with their group summary: the circle's shared diary. */
export async function getCircleDiary(circleId: string) {
  const screenings = await db.screening.findMany({
    where: { circleId, status: "REVEALED" },
    orderBy: { revealedAt: "desc" },
    take: 50,
    select: {
      id: true,
      revealedAt: true,
      watchedAt: true,
      film: filmCard,
      logs: { where: { rating: { not: null } }, select: { rating: true, user: person } },
    },
  });
  return screenings.map((s) => ({
    ...s,
    summary: revealSummary(s.logs.map((l) => ({ userId: l.user.id, rating: l.rating! }))),
  }));
}

export async function getCircleThreads(circleId: string, viewerId: string) {
  const threads = await db.thread.findMany({
    where: { circleId },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      lastActivityAt: true,
      film: filmCard,
      _count: { select: { comments: { where: { deletedAt: null } } } },
    },
  });
  const logged = await db.logEntry.findMany({
    where: { userId: viewerId, filmId: { in: threads.map((t) => t.film.tmdbId) } },
    select: { filmId: true },
    distinct: ["filmId"],
  });
  const unlocked = new Set(logged.map((l) => l.filmId));
  return threads.map((thread) => ({ ...thread, unlocked: unlocked.has(thread.film.tmdbId) }));
}

export async function getCircleStats(circleId: string) {
  const diary = await getCircleDiary(circleId);
  const rated = diary.filter((d) => d.logs.length >= 2);
  const average = rated.length ? rated.reduce((s, d) => s + d.summary.average, 0) / rated.length / 2 : null;
  const mostDivisive = [...rated].sort((a, b) => b.summary.spread - a.summary.spread)[0] ?? null;
  return { filmsTogether: diary.length, average, mostDivisive: mostDivisive && mostDivisive.summary.spread >= 2 ? mostDivisive.film : null };
}

export async function getThread(circleId: string, filmId: number) {
  return db.thread.findUnique({
    where: { circleId_filmId: { circleId, filmId } },
    select: {
      id: true,
      comments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, createdAt: true, deletedAt: true, author: person },
      },
      _count: { select: { comments: { where: { deletedAt: null } } } },
    },
  });
}
