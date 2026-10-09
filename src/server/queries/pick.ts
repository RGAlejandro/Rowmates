import "server-only";
import { db } from "@/lib/db";
import { tallyVotes } from "@/lib/pick/voting";
import type { PickReason } from "@/lib/pick/score";

const person = { select: { id: true, username: true, displayName: true, avatarUrl: true } } as const;

/** Pick Night state for a participant. Other people's votes stay hidden until voting closes. */
export async function getPickView(sessionId: string, viewerId: string) {
  const session = await db.pickSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      hostId: true,
      createdAt: true,
      resultFilmId: true,
      circle: { select: { id: true, name: true } },
      participants: { select: { submittedAt: true, user: person } },
      candidates: {
        orderBy: { position: "asc" },
        select: {
          filmId: true,
          score: true,
          position: true,
          reasons: true,
          film: { select: { tmdbId: true, title: true, year: true, posterPath: true, runtime: true, genres: true, overview: true } },
        },
      },
      screening: { select: { id: true } },
    },
  });
  if (!session || !session.participants.some((p) => p.user.id === viewerId)) return null;

  const myVotes = await db.pickVote.findMany({ where: { sessionId, userId: viewerId }, select: { filmId: true, value: true } });
  let tallies = null;
  if (session.status === "DONE") {
    const votes = await db.pickVote.findMany({ where: { sessionId }, select: { filmId: true, userId: true, value: true } });
    tallies = tallyVotes(session.candidates, votes).tallies;
  }

  return {
    ...session,
    candidates: session.candidates.map((c) => ({ ...c, reasons: c.reasons as unknown as PickReason[] })),
    isHost: session.hostId === viewerId,
    viewerSubmitted: session.participants.some((p) => p.user.id === viewerId && p.submittedAt !== null),
    myVotes,
    tallies,
  };
}

export type PickView = NonNullable<Awaited<ReturnType<typeof getPickView>>>;

export async function getPickPulse(sessionId: string, viewerId: string) {
  const session = await db.pickSession.findUnique({
    where: { id: sessionId },
    select: { status: true, participants: { select: { userId: true, submittedAt: true } } },
  });
  if (!session || !session.participants.some((p) => p.userId === viewerId)) return null;
  return {
    status: session.status,
    submitted: session.participants.filter((p) => p.submittedAt).map((p) => p.userId),
  };
}
