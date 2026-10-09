import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { visibleLogsWhere } from "@/lib/visibility";

/** Per-request memoized: the film page asks for it from several sections. */
export const getViewerFilmState = cache(async (viewerId: string, filmId: number) => {
  const [logs, watchlistItem, circles] = await Promise.all([
    db.logEntry.findMany({
      where: { userId: viewerId, filmId },
      orderBy: { createdAt: "desc" },
      select: { id: true, rating: true, liked: true, watchedOn: true, screeningId: true },
    }),
    db.watchlistItem.findUnique({ where: { userId_filmId: { userId: viewerId, filmId } }, select: { filmId: true } }),
    db.circle.findMany({
      where: { members: { some: { userId: viewerId } } },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { logs, onWatchlist: watchlistItem !== null, circles };
});

/** Latest rating per person among people the viewer follows or shares a circle with. */
export async function getPeopleRatings(viewerId: string, filmId: number) {
  const logs = await db.logEntry.findMany({
    where: {
      filmId,
      userId: { not: viewerId },
      rating: { not: null },
      AND: [
        visibleLogsWhere(viewerId),
        {
          user: {
            OR: [
              { followers: { some: { followerId: viewerId } } },
              { memberships: { some: { circle: { members: { some: { userId: viewerId } } } } } },
            ],
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { rating: true, liked: true, user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    take: 60,
  });
  const seen = new Set<string>();
  return logs.filter((log) => !seen.has(log.user.id) && seen.add(log.user.id));
}

export async function getFilmReviews(viewerId: string | null, filmId: number, take = 20) {
  return db.logEntry.findMany({
    where: { filmId, review: { not: null }, AND: [visibleLogsWhere(viewerId)] },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      liked: true,
      review: true,
      hasSpoilers: true,
      watchedOn: true,
      createdAt: true,
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });
}
