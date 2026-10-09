import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { canSeeProfile, visibleLogsWhere } from "@/lib/visibility";
import { genreName } from "@/lib/tmdb/genres";
import { isBlockedEitherWay } from "@/server/guards";

export const getProfile = cache(async (username: string, viewerId: string | null) => {
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!user) return null;

  const isSelf = viewerId === user.id;
  let isFollowing = false;
  let sharesCircle = false;
  let blocked = false;
  if (viewerId && !isSelf) {
    [isFollowing, sharesCircle, blocked] = await Promise.all([
      db.follow.findUnique({ where: { followerId_followeeId: { followerId: viewerId, followeeId: user.id } } }).then(Boolean),
      db.circle
        .findFirst({ where: { members: { some: { userId: viewerId } }, AND: { members: { some: { userId: user.id } } } }, select: { id: true } })
        .then(Boolean),
      isBlockedEitherWay(viewerId, user.id),
    ]);
  }

  return { user, isSelf, isFollowing, canSee: canSeeProfile(viewerId, user, { sharesCircle, blocked }) };
});

export async function getFavorites(userId: string) {
  const favorites = await db.favoriteFilm.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    select: { film: { select: { tmdbId: true, title: true, year: true, posterPath: true } } },
  });
  return favorites.map((f) => f.film);
}

export async function getProfileStats(userId: string, viewerId: string | null) {
  const logs = await db.logEntry.findMany({
    where: { userId, AND: [visibleLogsWhere(viewerId)] },
    orderBy: [{ watchedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { filmId: true, rating: true, watchedOn: true, createdAt: true, film: { select: { genres: true, runtime: true } } },
  });

  const year = new Date().getUTCFullYear();
  const latestRating = new Map<number, number>();
  const films = new Map<number, number[]>();
  const thisYear = new Set<number>();
  let minutes = 0;

  for (const log of logs) {
    films.set(log.filmId, log.film.genres);
    if (log.rating !== null && !latestRating.has(log.filmId)) latestRating.set(log.filmId, log.rating);
    if ((log.watchedOn ?? log.createdAt).getUTCFullYear() === year) thisYear.add(log.filmId);
    minutes += log.film.runtime ?? 0;
  }

  const histogram = Array.from({ length: 10 }, () => 0);
  for (const rating of latestRating.values()) histogram[rating - 1] += 1;

  const genreCounts = new Map<number, number>();
  for (const genres of films.values()) for (const g of genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, value]) => ({ label: genreName(id), value }));

  const ratings = [...latestRating.values()];
  return {
    filmsLogged: films.size,
    thisYear: thisYear.size,
    average: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length / 2 : null,
    hours: Math.round(minutes / 60),
    histogram,
    topGenres,
  };
}

const logListSelect = {
  id: true,
  rating: true,
  liked: true,
  review: true,
  hasSpoilers: true,
  isRewatch: true,
  watchedOn: true,
  createdAt: true,
  film: { select: { tmdbId: true, title: true, year: true, posterPath: true } },
} as const;

export async function getRecentLogs(userId: string, viewerId: string | null, take = 12) {
  return db.logEntry.findMany({
    where: { userId, AND: [visibleLogsWhere(viewerId)] },
    orderBy: { createdAt: "desc" },
    take,
    select: logListSelect,
  });
}

export const DIARY_PAGE_SIZE = 40;

export async function getDiaryPage(userId: string, viewerId: string | null, page: number) {
  const where = { userId, AND: [visibleLogsWhere(viewerId)] };
  const [entries, total] = await Promise.all([
    db.logEntry.findMany({
      where,
      orderBy: [{ watchedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * DIARY_PAGE_SIZE,
      take: DIARY_PAGE_SIZE,
      select: logListSelect,
    }),
    db.logEntry.count({ where }),
  ]);
  return { entries, totalPages: Math.max(1, Math.ceil(total / DIARY_PAGE_SIZE)) };
}

export async function getWatchlist(userId: string) {
  const items = await db.watchlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    select: { film: { select: { tmdbId: true, title: true, year: true, posterPath: true } } },
  });
  return items.map((item) => item.film);
}
