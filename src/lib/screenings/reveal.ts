// The Blind Reveal: attendees rate in secret; ratings flip together once everyone
// has rated, the host forces it, or 48h pass with at least two ratings.

export type ScreeningStatus = "PLANNED" | "WATCHED" | "REVEALED" | "CANCELLED";
export type RsvpValue = "GOING" | "MAYBE" | "DECLINED";

export const AUTO_REVEAL_AFTER_MS = 48 * 60 * 60 * 1000;
export const MIN_RATINGS_TO_REVEAL = 2;

export interface RevealState {
  status: ScreeningStatus;
  scheduledAt: Date | null;
  watchedAt: Date | null;
  attendees: { userId: string; rsvp: RsvpValue }[];
  /** userIds who have sealed a rating for this screening. */
  raters: string[];
}

/** People we wait for: everyone who said they're going, plus anyone else who already rated. */
export function expectedRaters(state: RevealState): string[] {
  const going = state.attendees.filter((a) => a.rsvp === "GOING").map((a) => a.userId);
  return [...new Set([...going, ...state.raters])];
}

export function pendingRaters(state: RevealState): string[] {
  const rated = new Set(state.raters);
  return expectedRaters(state).filter((id) => !rated.has(id));
}

/** Ratings can be sealed once the film has been watched (or its scheduled time has passed). */
export function canRate(state: RevealState, now: Date): boolean {
  if (state.status === "WATCHED") return true;
  return state.status === "PLANNED" && state.scheduledAt !== null && state.scheduledAt <= now;
}

export function shouldAutoReveal(state: RevealState, now: Date): boolean {
  if (state.status !== "WATCHED" && state.status !== "PLANNED") return false;
  if (state.raters.length < MIN_RATINGS_TO_REVEAL) return false;
  if (pendingRaters(state).length === 0) return true;
  const watched = state.watchedAt ?? state.scheduledAt;
  return watched !== null && now.getTime() - watched.getTime() >= AUTO_REVEAL_AFTER_MS;
}

export function canForceReveal(state: RevealState, viewerId: string, hostId: string): boolean {
  return viewerId === hostId && state.status === "WATCHED" && state.raters.length >= MIN_RATINGS_TO_REVEAL;
}

export type RevealLabel = "UNANIMOUS" | "DIVISIVE" | null;

export interface RevealSummary {
  average: number;
  /** Population standard deviation in rating units (1 unit = half a star). */
  spread: number;
  label: RevealLabel;
  biggestFans: string[];
  toughestCritics: string[];
}

export function revealSummary(ratings: { userId: string; rating: number }[]): RevealSummary {
  if (ratings.length === 0) return { average: 0, spread: 0, label: null, biggestFans: [], toughestCritics: [] };
  const values = ratings.map((r) => r.rating);
  const average = values.reduce((s, v) => s + v, 0) / values.length;
  const spread = Math.sqrt(values.reduce((s, v) => s + (v - average) ** 2, 0) / values.length);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const label: RevealLabel = ratings.length < 2 ? null : spread <= 1 ? "UNANIMOUS" : spread >= 3 ? "DIVISIVE" : null;
  return {
    average: Math.round(average * 100) / 100,
    spread: Math.round(spread * 100) / 100,
    label,
    biggestFans: max === min ? [] : ratings.filter((r) => r.rating === max).map((r) => r.userId),
    toughestCritics: max === min ? [] : ratings.filter((r) => r.rating === min).map((r) => r.userId),
  };
}
