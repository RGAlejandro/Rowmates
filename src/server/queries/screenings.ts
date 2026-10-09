import "server-only";
import { db } from "@/lib/db";
import { canForceReveal, canRate, pendingRaters, revealSummary, type RevealState } from "@/lib/screenings/reveal";
import { isMember } from "@/server/guards";
import { maybeReveal } from "@/server/screenings";

const person = { select: { id: true, username: true, displayName: true, avatarUrl: true } } as const;

/**
 * Everything the screening page needs, sanitized for the viewer: other people's
 * ratings are only included once the screening has been revealed.
 */
export async function getScreeningView(screeningId: string, viewerId: string) {
  await maybeReveal(screeningId);

  const s = await db.screening.findUnique({
    where: { id: screeningId },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      watchedAt: true,
      revealedAt: true,
      location: true,
      venue: true,
      hostId: true,
      circleId: true,
      circle: { select: { id: true, name: true, kind: true, members: { select: { user: person } } } },
      film: { select: { tmdbId: true, title: true, year: true, posterPath: true, backdropPath: true, runtime: true, directors: true } },
      attendees: { select: { rsvp: true, user: person } },
      logs: { select: { userId: true, rating: true, review: true, hasSpoilers: true } },
    },
  });
  if (!s || !(await isMember(s.circleId, viewerId))) return null;

  const state: RevealState = {
    status: s.status,
    scheduledAt: s.scheduledAt,
    watchedAt: s.watchedAt,
    attendees: s.attendees.map((a) => ({ userId: a.user.id, rsvp: a.rsvp })),
    raters: s.logs.map((l) => l.userId),
  };
  const now = new Date();
  const revealed = s.status === "REVEALED";
  const members = new Map(s.circle.members.map((m) => [m.user.id, m.user]));
  const mine = s.logs.find((l) => l.userId === viewerId) ?? null;

  const ratings = revealed
    ? s.logs
        .filter((l) => l.rating !== null)
        .map((l) => ({ user: members.get(l.userId) ?? null, rating: l.rating!, review: l.review, hasSpoilers: l.hasSpoilers }))
        .filter((r): r is typeof r & { user: NonNullable<typeof r.user> } => r.user !== null)
    : [];

  return {
    id: s.id,
    status: s.status,
    scheduledAt: s.scheduledAt,
    watchedAt: s.watchedAt,
    revealedAt: s.revealedAt,
    location: s.location,
    venue: s.venue,
    isHost: s.hostId === viewerId,
    host: members.get(s.hostId) ?? null,
    circle: { id: s.circle.id, name: s.circle.name },
    film: s.film,
    attendees: s.attendees,
    viewerRsvp: s.attendees.find((a) => a.user.id === viewerId)?.rsvp ?? null,
    sealed: state.raters.map((id) => members.get(id)).filter((u) => u !== undefined),
    pending: pendingRaters(state).map((id) => members.get(id)).filter((u) => u !== undefined),
    mine: mine ? { rating: mine.rating, review: mine.review } : null,
    canRate: canRate(state, now) && !revealed,
    canForceReveal: canForceReveal(state, viewerId, s.hostId),
    ratings,
    summary: revealed ? revealSummary(ratings.map((r) => ({ userId: r.user.id, rating: r.rating }))) : null,
  };
}

export type ScreeningView = NonNullable<Awaited<ReturnType<typeof getScreeningView>>>;

/** Minimal state for the polling endpoint: no ratings, ever. */
export async function getScreeningPulse(screeningId: string, viewerId: string) {
  await maybeReveal(screeningId);
  const s = await db.screening.findUnique({
    where: { id: screeningId },
    select: { status: true, circleId: true, logs: { select: { userId: true } } },
  });
  if (!s || !(await isMember(s.circleId, viewerId))) return null;
  return { status: s.status, sealedCount: s.logs.length };
}
