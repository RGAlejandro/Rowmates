export type ImportSourceName = "LETTERBOXD" | "IMDB";
export type ImportKind = "DIARY" | "RATING" | "WATCHED" | "WATCHLIST" | "REVIEW" | "LIKE";

/** One row from any export, normalized before upload. Ratings already use our 1..10 scale. */
export interface NormalizedRow {
  kind: ImportKind;
  title: string;
  year: number | null;
  imdbId?: string;
  rating?: number | null;
  /** YYYY-MM-DD */
  watchedOn?: string | null;
  review?: string | null;
  rewatch?: boolean;
}

export class InvalidExportError extends Error {}

export function toYear(value: string | undefined): number | null {
  const year = Number(value?.trim());
  return Number.isInteger(year) && year > 1870 && year < 2100 ? year : null;
}

export function toDate(value: string | undefined): string | null {
  const match = value?.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
