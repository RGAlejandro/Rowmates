import { normalizeTitle } from "@/lib/text";
import type { TmdbMovieSummary } from "@/lib/tmdb/types";

export interface MatchCandidate {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

export type MatchResult =
  | { status: "MATCHED"; filmId: number }
  | { status: "AMBIGUOUS"; candidates: MatchCandidate[] }
  | { status: "UNMATCHED" };

const yearOf = (film: TmdbMovieSummary) => Number(film.release_date?.slice(0, 4)) || null;

function toCandidate(film: TmdbMovieSummary): MatchCandidate {
  return { tmdbId: film.id, title: film.title, year: yearOf(film), posterPath: film.poster_path };
}

/**
 * Picks the TMDB film for an exported row. Letterboxd itself is built on TMDB data,
 * so an exact title + year match is the common case; ±1 year covers festival vs.
 * release dates. Anything fuzzier goes to manual review.
 */
export function pickMatch(row: { title: string; year: number | null }, results: TmdbMovieSummary[]): MatchResult {
  if (results.length === 0) return { status: "UNMATCHED" };
  const wanted = normalizeTitle(row.title);
  const sameTitle = results.filter(
    (film) => normalizeTitle(film.title) === wanted || (film.original_title && normalizeTitle(film.original_title) === wanted),
  );

  const byPopularity = (a: TmdbMovieSummary, b: TmdbMovieSummary) => (b.popularity ?? 0) - (a.popularity ?? 0);

  if (row.year) {
    const exact = sameTitle.filter((film) => yearOf(film) === row.year).sort(byPopularity);
    if (exact.length >= 1) return { status: "MATCHED", filmId: exact[0].id };
    const near = sameTitle.filter((film) => Math.abs((yearOf(film) ?? 0) - row.year!) <= 1);
    if (near.length === 1) return { status: "MATCHED", filmId: near[0].id };
  } else if (sameTitle.length === 1) {
    return { status: "MATCHED", filmId: sameTitle[0].id };
  }

  return { status: "AMBIGUOUS", candidates: results.slice(0, 5).map(toCandidate) };
}

/** Cache key for the shared ExternalIdMap table. */
export function externalKey(row: { title: string; year: number | null; imdbId?: string }, source: "LETTERBOXD" | "IMDB"): string {
  return source === "IMDB" && row.imdbId ? row.imdbId : `${normalizeTitle(row.title)}|${row.year ?? ""}`;
}
