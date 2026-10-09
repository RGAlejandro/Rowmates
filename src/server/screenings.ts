import "server-only";
import { db } from "@/lib/db";
import { shouldAutoReveal, type RevealState } from "@/lib/screenings/reveal";
import { notify } from "./notifications";

export async function loadRevealState(screeningId: string) {
  const screening = await db.screening.findUnique({
    where: { id: screeningId },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      watchedAt: true,
      hostId: true,
      circleId: true,
      circle: { select: { name: true } },
      film: { select: { tmdbId: true, title: true } },
      attendees: { select: { userId: true, rsvp: true } },
      logs: { select: { userId: true } },
    },
  });
  if (!screening) return null;
  const state: RevealState = {
    status: screening.status,
    scheduledAt: screening.scheduledAt,
    watchedAt: screening.watchedAt,
    attendees: screening.attendees,
    raters: screening.logs.map((log) => log.userId),
  };
  return { screening, state };
}

/**
 * Flip a screening to REVEALED exactly once (the status guard makes concurrent
 * calls safe) and tell everyone involved.
 */
export async function revealScreening(screeningId: string): Promise<boolean> {
  const loaded = await loadRevealState(screeningId);
  if (!loaded) return false;
  const { count } = await db.screening.updateMany({
    where: { id: screeningId, status: { in: ["PLANNED", "WATCHED"] } },
    data: { status: "REVEALED", revealedAt: new Date() },
  });
  if (count === 1) {
    const { screening, state } = loaded;
    await notify([...new Set([...state.raters, ...state.attendees.map((a) => a.userId)])], "REVEAL_READY", {
      circleId: screening.circleId,
      circleName: screening.circle.name,
      filmTitle: screening.film.title,
      screeningId,
    });
  }
  return count === 1;
}

/** Lazy auto-reveal: called after each sealed rating and whenever a screening is viewed. */
export async function maybeReveal(screeningId: string, now = new Date()): Promise<boolean> {
  const loaded = await loadRevealState(screeningId);
  if (!loaded || !shouldAutoReveal(loaded.state, now)) return false;
  return revealScreening(screeningId);
}
