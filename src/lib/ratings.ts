/**
 * Ratings are stored as integers 1..10 where one unit is half a star,
 * so 10 = five stars and 7 = three and a half.
 */
export const MIN_RATING = 1;
export const MAX_RATING = 10;

export function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_RATING && value <= MAX_RATING;
}

export function ratingToStars(rating: number): number {
  return rating / 2;
}

export function starsToRating(stars: number): number {
  return Math.round(stars * 2);
}

/** Letterboxd exports ratings as 0.5..5 in half-star steps. */
export function fromLetterboxd(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const rating = starsToRating(Number(value));
  return isValidRating(rating) ? rating : null;
}

/** IMDb (and most 10-point scales) already match our 1..10 storage. */
export function fromTenPoint(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const rating = Math.round(Number(value));
  return isValidRating(rating) ? rating : null;
}

/** "★★★½" style label for compact displays and alt text. */
export function formatStars(rating: number): string {
  const full = Math.floor(rating / 2);
  return "★".repeat(full) + (rating % 2 === 1 ? "½" : "");
}

export function formatAverage(ratings: number[]): string {
  if (ratings.length === 0) return "–";
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return ratingToStars(avg).toFixed(1);
}
