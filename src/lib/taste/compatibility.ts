import { mean, type TasteProfileData } from "./profile";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export interface CompatSide {
  /** filmId -> rating 1..10 */
  ratings: Map<number, number>;
  profile: TasteProfileData | null;
  watchlist?: Set<number>;
}

export interface CompatResult {
  /** 0..100 */
  score: number;
  confidence: Confidence;
  commonCount: number;
  /** Films both rated 4★+, best first. */
  bothLove: number[];
  /** Films with a 2★+ gap, biggest gap first. */
  willArgue: number[];
  sharedWatchlist: number[];
}

export const MIN_COMMON_FOR_RATINGS = 5;
const RATING_SHRINK = 10;
const PROFILE_BLEND = 15;

/** Cosine similarity; 0 when either vector has no variation. */
export function cosine(xs: number[], ys: number[]): number {
  let dot = 0;
  let nx = 0;
  let ny = 0;
  for (let i = 0; i < xs.length; i++) {
    dot += xs[i] * ys[i];
    nx += xs[i] * xs[i];
    ny += ys[i] * ys[i];
  }
  return nx === 0 || ny === 0 ? 0 : dot / Math.sqrt(nx * ny);
}

/** Cosine of genre preference vectors, or null when either profile has no leanings yet. */
function genreSimilarity(a: TasteProfileData, b: TasteProfileData): number | null {
  const keys = [...new Set([...Object.keys(a.genreWeights), ...Object.keys(b.genreWeights)])];
  const xs = keys.map((k) => a.genreWeights[k] ?? 0);
  const ys = keys.map((k) => b.genreWeights[k] ?? 0);
  if (xs.every((x) => x === 0) || ys.every((y) => y === 0)) return null;
  return cosine(xs, ys);
}

/** Spread similarity in [-1, 1] onto 0..100 with a gentle S-curve so real pairs don't all land near 50. */
export function similarityToScore(similarity: number): number {
  const stretched = Math.tanh(1.6 * similarity) / Math.tanh(1.6);
  return Math.round(Math.min(100, Math.max(0, 50 + 50 * stretched)));
}

export function computeCompatibility(a: CompatSide, b: CompatSide): CompatResult {
  const common = [...a.ratings.keys()].filter((id) => b.ratings.has(id));
  const n = common.length;

  // Center on each person's overall mean (not the common subset) to cancel scale habits.
  const meanA = mean([...a.ratings.values()]);
  const meanB = mean([...b.ratings.values()]);

  let ratingSim: number | null = null;
  if (n >= MIN_COMMON_FOR_RATINGS) {
    const xs = common.map((id) => a.ratings.get(id)! - meanA);
    const ys = common.map((id) => b.ratings.get(id)! - meanB);
    ratingSim = cosine(xs, ys) * (n / (n + RATING_SHRINK));
  }

  const profileSim = a.profile?.ratingCount && b.profile?.ratingCount ? genreSimilarity(a.profile, b.profile) : null;

  let similarity = 0;
  if (ratingSim !== null && profileSim !== null) {
    const w = n / (n + PROFILE_BLEND);
    similarity = w * ratingSim + (1 - w) * profileSim * 0.8;
  } else if (ratingSim !== null) {
    similarity = ratingSim;
  } else if (profileSim !== null) {
    similarity = profileSim * 0.6;
  }

  const confidence: Confidence = n >= 25 ? "HIGH" : n >= 8 ? "MEDIUM" : "LOW";

  const bothLove = common
    .filter((id) => a.ratings.get(id)! >= 8 && b.ratings.get(id)! >= 8)
    .sort((x, y) => Math.min(b.ratings.get(y)!, a.ratings.get(y)!) - Math.min(b.ratings.get(x)!, a.ratings.get(x)!))
    .slice(0, 3);

  const gap = (id: number) => Math.abs(a.ratings.get(id)! - b.ratings.get(id)!);
  const willArgue = common
    .filter((id) => gap(id) >= 4)
    .sort((x, y) => gap(y) - gap(x))
    .slice(0, 3);

  const sharedWatchlist = a.watchlist && b.watchlist ? [...a.watchlist].filter((id) => b.watchlist!.has(id)).slice(0, 6) : [];

  return { score: similarityToScore(similarity), confidence, commonCount: n, bothLove, willArgue, sharedWatchlist };
}
