// Taste profiles: what a person tends to rate above or below their own average.
// Ratings are centered on the user's mean, so "my 3 stars = your 4 stars" cancels out.

export interface RatedFilm {
  filmId: number;
  /** 1..10 */
  rating: number;
  genres: number[];
  directors: string[];
}

export interface TasteProfileData {
  meanRating: number;
  ratingCount: number;
  /** genreId -> weight in [-1, 1] */
  genreWeights: Record<string, number>;
  /** director name -> weight in [-1, 1] */
  directorWeights: Record<string, number>;
}

const GENRE_SHRINK = 3;
const DIRECTOR_SHRINK = 2;
const MAX_DIRECTORS = 60;
/** Half the 1..10 range: maps a centered rating roughly into [-1, 1]. */
const HALF_RANGE = 4.5;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function mean(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

function accumulate<K>(acc: Map<K, { sum: number; n: number }>, key: K, value: number) {
  const entry = acc.get(key) ?? { sum: 0, n: 0 };
  entry.sum += value;
  entry.n += 1;
  acc.set(key, entry);
}

/** Shrunk mean: few observations pull the weight toward 0 instead of trusting one film. */
function shrunk({ sum, n }: { sum: number; n: number }, shrink: number) {
  return (sum / n) * (n / (n + shrink));
}

export function computeTasteProfile(ratings: RatedFilm[]): TasteProfileData {
  if (ratings.length === 0) return { meanRating: 0, ratingCount: 0, genreWeights: {}, directorWeights: {} };

  const avg = mean(ratings.map((r) => r.rating));
  const genres = new Map<number, { sum: number; n: number }>();
  const directors = new Map<string, { sum: number; n: number }>();

  for (const film of ratings) {
    const centered = clamp((film.rating - avg) / HALF_RANGE, -1, 1);
    for (const genre of film.genres) accumulate(genres, genre, centered);
    for (const director of film.directors) accumulate(directors, director, centered);
  }

  const genreWeights: Record<string, number> = {};
  for (const [genre, acc] of genres) genreWeights[genre] = round(shrunk(acc, GENRE_SHRINK));

  const directorWeights: Record<string, number> = {};
  [...directors.entries()]
    .map(([name, acc]) => [name, shrunk(acc, DIRECTOR_SHRINK)] as const)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, MAX_DIRECTORS)
    .forEach(([name, weight]) => (directorWeights[name] = round(weight)));

  return { meanRating: round(avg), ratingCount: ratings.length, genreWeights, directorWeights };
}

/** How much a profile should like a film, in [-1, 1]. Unknown genres count as neutral. */
export function affinity(profile: TasteProfileData | null, film: { genres: number[]; directors: string[] }): number {
  if (!profile || profile.ratingCount === 0) return 0;
  const genreScore = film.genres.length ? mean(film.genres.map((g) => profile.genreWeights[g] ?? 0)) : 0;
  const directorScores = film.directors.map((d) => profile.directorWeights[d]).filter((w): w is number => w !== undefined);
  if (!directorScores.length) return clamp(genreScore, -1, 1);
  return clamp(0.6 * genreScore + 0.4 * Math.max(...directorScores), -1, 1);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
