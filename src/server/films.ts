import "server-only";
import { db } from "@/lib/db";
import { getMovie } from "@/lib/tmdb/api";
import type { TmdbMovieDetails, TmdbMovieSummary } from "@/lib/tmdb/types";

const DETAILS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function yearOf(date?: string): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 1870 ? year : null;
}

export function filmDataFromSummary(summary: TmdbMovieSummary) {
  return {
    title: summary.title,
    originalTitle: summary.original_title ?? null,
    year: yearOf(summary.release_date),
    posterPath: summary.poster_path,
    backdropPath: summary.backdrop_path,
    overview: summary.overview ?? null,
    genres: summary.genre_ids ?? [],
    originalLanguage: summary.original_language ?? null,
    popularity: summary.popularity ?? 0,
    voteAverage: summary.vote_average ?? null,
  };
}

export function filmDataFromDetails(details: TmdbMovieDetails, fetchedAt: Date) {
  return {
    title: details.title,
    originalTitle: details.original_title ?? null,
    year: yearOf(details.release_date),
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    overview: details.overview ?? null,
    runtime: details.runtime ?? null,
    genres: details.genres.map((g) => g.id),
    directors: details.credits?.crew.filter((c) => c.job === "Director").map((c) => c.name) ?? [],
    originalLanguage: details.original_language ?? null,
    popularity: details.popularity ?? 0,
    voteAverage: details.vote_average ?? null,
    detailsFetchedAt: fetchedAt,
  };
}

/** Make sure a Film row exists with full details (runtime, directors), refreshing monthly. */
export async function ensureFilm(tmdbId: number) {
  const existing = await db.film.findUnique({ where: { tmdbId } });
  const now = new Date();
  if (existing?.detailsFetchedAt && now.getTime() - existing.detailsFetchedAt.getTime() < DETAILS_TTL_MS) {
    return existing;
  }
  const data = filmDataFromDetails(await getMovie(tmdbId), now);
  return db.film.upsert({ where: { tmdbId }, create: { tmdbId, ...data }, update: data });
}

/** Insert lightweight rows from search/discover results without extra API calls. */
export async function upsertFilmSummaries(summaries: TmdbMovieSummary[]) {
  if (!summaries.length) return;
  await db.film.createMany({
    data: summaries.map((s) => ({ tmdbId: s.id, ...filmDataFromSummary(s) })),
    skipDuplicates: true,
  });
}
