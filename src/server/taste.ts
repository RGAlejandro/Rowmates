import "server-only";
import { db } from "@/lib/db";
import { computeTasteProfile, type RatedFilm, type TasteProfileData } from "@/lib/taste/profile";
import { computeCompatibility, type CompatResult } from "@/lib/taste/compatibility";

const COMPAT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Latest rating per film for a user (rewatches overwrite older opinions). */
export async function latestRatings(userId: string): Promise<RatedFilm[]> {
  const logs = await db.logEntry.findMany({
    where: { userId, rating: { not: null } },
    select: { filmId: true, rating: true, film: { select: { genres: true, directors: true } } },
    orderBy: [{ watchedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  const latest = new Map<number, RatedFilm>();
  for (const log of logs) {
    if (!latest.has(log.filmId)) {
      latest.set(log.filmId, { filmId: log.filmId, rating: log.rating!, genres: log.film.genres, directors: log.film.directors });
    }
  }
  return [...latest.values()];
}

/** Rebuild a user's taste profile and drop their cached compatibility scores. */
export async function recomputeTasteProfile(userId: string): Promise<TasteProfileData> {
  const profile = computeTasteProfile(await latestRatings(userId));
  await db.tasteProfile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile });
  await db.compatibility.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
  return profile;
}

export function toProfile(row: { meanRating: number; ratingCount: number; genreWeights: unknown; directorWeights: unknown } | null): TasteProfileData | null {
  if (!row) return null;
  return {
    meanRating: row.meanRating,
    ratingCount: row.ratingCount,
    genreWeights: row.genreWeights as Record<string, number>,
    directorWeights: row.directorWeights as Record<string, number>,
  };
}

/** Pairwise compatibility, cached for a week or until either person rates something new. */
export async function getCompatibility(userX: string, userY: string): Promise<CompatResult> {
  const [userAId, userBId] = userX < userY ? [userX, userY] : [userY, userX];
  const cached = await db.compatibility.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  if (cached && Date.now() - cached.computedAt.getTime() < COMPAT_TTL_MS) {
    const highlights = cached.highlights as Pick<CompatResult, "bothLove" | "willArgue" | "sharedWatchlist">;
    return { score: cached.score, confidence: cached.confidence, commonCount: cached.commonCount, ...highlights };
  }

  const [ratingsA, ratingsB, profiles, watchlists] = await Promise.all([
    latestRatings(userAId),
    latestRatings(userBId),
    db.tasteProfile.findMany({ where: { userId: { in: [userAId, userBId] } } }),
    db.watchlistItem.findMany({ where: { userId: { in: [userAId, userBId] } }, select: { userId: true, filmId: true } }),
  ]);

  const side = (userId: string, ratings: RatedFilm[]) => ({
    ratings: new Map(ratings.map((r) => [r.filmId, r.rating])),
    profile: toProfile(profiles.find((p) => p.userId === userId) ?? null) ?? computeTasteProfile(ratings),
    watchlist: new Set(watchlists.filter((w) => w.userId === userId).map((w) => w.filmId)),
  });

  const result = computeCompatibility(side(userAId, ratingsA), side(userBId, ratingsB));
  const data = {
    score: result.score,
    confidence: result.confidence,
    commonCount: result.commonCount,
    highlights: { bothLove: result.bothLove, willArgue: result.willArgue, sharedWatchlist: result.sharedWatchlist },
    computedAt: new Date(),
  };
  await db.compatibility.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, ...data },
    update: data,
  });
  return result;
}

export async function ratingCount(userId: string): Promise<number> {
  const rows = await db.logEntry.findMany({ where: { userId, rating: { not: null } }, distinct: ["filmId"], select: { filmId: true } });
  return rows.length;
}
