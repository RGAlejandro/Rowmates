import { affinity, clamp, mean, type TasteProfileData } from "@/lib/taste/profile";

export interface PickParticipantInput {
  userId: string;
  displayName: string;
  profile: TasteProfileData | null;
  watchlist: Set<number>;
  seen: Set<number>;
}

export interface PickFilmInput {
  filmId: number;
  genres: number[];
  directors: string[];
  runtime: number | null;
  voteAverage: number | null;
  onCircleWatchlist: boolean;
  /** Flatrate providers in the session region; null when unknown. */
  streaming: { id: number; name: string }[] | null;
}

export interface PickFilters {
  maxRuntime?: number | null;
  genres?: number[];
  onlyStreamable: boolean;
  allowRewatch: boolean;
}

/** Structured so the UI can translate it; stored as JSON on PickCandidate. */
export type PickReason =
  | { key: "watchlists"; count: number }
  | { key: "circleList" }
  | { key: "streaming"; service: string }
  | { key: "taste"; name: string }
  | { key: "groupTaste" }
  | { key: "popular" };

export interface ScoredCandidate {
  filmId: number;
  score: number;
  reasons: PickReason[];
}

export const CANDIDATE_COUNT = 12;

/** Group score blends the average with the least happy person ("least misery"). */
const MEAN_WEIGHT = 0.7;
const MISERY_WEIGHT = 0.3;

export function personalAppeal(person: PickParticipantInput, film: PickFilmInput): number {
  const onWatchlist = person.watchlist.has(film.filmId) ? 0.3 : 0;
  return clamp(0.5 + onWatchlist + 0.3 * affinity(person.profile, film), 0, 1);
}

export function isEligible(
  film: PickFilmInput,
  participants: PickParticipantInput[],
  filters: PickFilters,
  services: Set<number>,
): boolean {
  if (!filters.allowRewatch && participants.some((p) => p.seen.has(film.filmId))) return false;
  if (filters.maxRuntime && film.runtime && film.runtime > filters.maxRuntime) return false;
  if (filters.genres?.length && !film.genres.some((g) => filters.genres!.includes(g))) return false;
  if (filters.onlyStreamable && !(film.streaming ?? []).some((s) => services.has(s.id))) return false;
  return true;
}

export function scoreCandidates(
  participants: PickParticipantInput[],
  films: PickFilmInput[],
  filters: PickFilters,
  services: Set<number>,
  limit = CANDIDATE_COUNT,
): ScoredCandidate[] {
  if (participants.length === 0) return [];

  return films
    .filter((film) => isEligible(film, participants, filters, services))
    .map((film) => {
      const appeals = participants.map((p) => personalAppeal(p, film));
      const affinities = participants.map((p) => affinity(p.profile, film));
      const streamingOn = (film.streaming ?? []).find((s) => services.has(s.id));
      const quality = film.voteAverage ? clamp((film.voteAverage - 6) / 3, 0, 1) : 0;

      const score =
        MEAN_WEIGHT * mean(appeals) +
        MISERY_WEIGHT * Math.min(...appeals) +
        (film.onCircleWatchlist ? 0.08 : 0) +
        (streamingOn ? 0.05 : 0) +
        0.03 * quality;

      const reasons: PickReason[] = [];
      const watchlistCount = participants.filter((p) => p.watchlist.has(film.filmId)).length;
      if (watchlistCount > 0) reasons.push({ key: "watchlists", count: watchlistCount });
      if (film.onCircleWatchlist) reasons.push({ key: "circleList" });
      if (streamingOn) reasons.push({ key: "streaming", service: streamingOn.name });
      const best = affinities.indexOf(Math.max(...affinities));
      if (mean(affinities) > 0.25 && participants.length > 1) reasons.push({ key: "groupTaste" });
      else if (affinities[best] > 0.3) reasons.push({ key: "taste", name: participants[best].displayName });
      if (reasons.length === 0) reasons.push({ key: "popular" });

      return { filmId: film.filmId, score: Math.round(score * 1000) / 1000, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
