"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { hasUsedVeto, tallyVotes } from "@/lib/pick/voting";
import { t } from "@/i18n";
import type { Prisma } from "@/generated/prisma/client";
import { assertMember } from "@/server/guards";
import { notify } from "@/server/notifications";
import { buildCandidates } from "@/server/pick";
import { assertRateLimit } from "@/server/rate-limit";
import { runAction, UserError } from "@/server/action";

const MIN_CANDIDATES = 3;

const startSchema = z.object({
  circleId: z.string().min(1),
  participantIds: z.array(z.string().min(1)).min(1).max(20),
  filters: z.object({
    maxRuntime: z.number().int().min(60).max(300).nullable(),
    genres: z.array(z.number().int()).max(6),
    onlyStreamable: z.boolean(),
    allowRewatch: z.boolean(),
  }),
});

export async function startPickNight(input: z.input<typeof startSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    assertRateLimit(`pick:${viewer.id}`, 10, 10 * 60 * 1000);
    const data = startSchema.parse(input);
    await assertMember(data.circleId, viewer.id);

    const members = await db.circleMember.findMany({ where: { circleId: data.circleId }, select: { userId: true } });
    const memberIds = new Set(members.map((m) => m.userId));
    const participantIds = [...new Set([viewer.id, ...data.participantIds])].filter((id) => memberIds.has(id));

    const candidates = await buildCandidates(data.circleId, participantIds, viewer.region, data.filters);
    if (candidates.length < MIN_CANDIDATES) throw new UserError(t("pick.tooFew"));

    const session = await db.pickSession.create({
      data: {
        circleId: data.circleId,
        hostId: viewer.id,
        region: viewer.region,
        filters: data.filters,
        participants: { create: participantIds.map((userId) => ({ userId })) },
        candidates: {
          create: candidates.map((c, position) => ({
            filmId: c.filmId,
            score: c.score,
            reasons: c.reasons as unknown as Prisma.InputJsonValue,
            position,
          })),
        },
      },
      include: { circle: { select: { name: true } } },
    });
    await notify(participantIds, "PICK_STARTED", { actorName: viewer.displayName, circleId: data.circleId, circleName: session.circle.name, pickId: session.id }, viewer.id);
    return { pickId: session.id };
  });
}

async function participantSession(sessionId: string, userId: string) {
  const session = await db.pickSession.findUnique({ where: { id: sessionId }, include: { participants: true } });
  if (!session || !session.participants.some((p) => p.userId === userId)) throw new UserError(t("errors.forbidden"));
  return session;
}

const voteSchema = z.object({
  sessionId: z.string().min(1),
  filmId: z.number().int().positive(),
  value: z.enum(["YES", "MAYBE", "NO", "VETO"]),
});

export async function castVote(input: z.input<typeof voteSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const { sessionId, filmId, value } = voteSchema.parse(input);
    const session = await participantSession(sessionId, viewer.id);
    if (session.status !== "VOTING") throw new UserError(t("common.somethingWrong"));

    if (value === "VETO") {
      const votes = await db.pickVote.findMany({ where: { sessionId, userId: viewer.id, NOT: { filmId } } });
      if (hasUsedVeto(votes, viewer.id)) throw new UserError(t("pick.vetoUsed"));
    }
    await db.pickVote.upsert({
      where: { sessionId_filmId_userId: { sessionId, filmId, userId: viewer.id } },
      create: { sessionId, filmId, userId: viewer.id, value },
      update: { value },
    });
    return null;
  });
}

async function closeSession(sessionId: string) {
  const [candidates, votes] = await Promise.all([
    db.pickCandidate.findMany({ where: { sessionId }, select: { filmId: true, score: true, position: true } }),
    db.pickVote.findMany({ where: { sessionId }, select: { filmId: true, userId: true, value: true } }),
  ]);
  const { winner } = tallyVotes(candidates, votes);
  await db.pickSession.updateMany({
    where: { id: sessionId, status: "VOTING" },
    data: { status: "DONE", resultFilmId: winner, closedAt: new Date() },
  });
}

export async function submitVotes(sessionId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const session = await participantSession(sessionId, viewer.id);
    if (session.status !== "VOTING") return null;
    await db.pickParticipant.update({
      where: { sessionId_userId: { sessionId, userId: viewer.id } },
      data: { submittedAt: new Date() },
    });
    const waiting = await db.pickParticipant.count({ where: { sessionId, submittedAt: null } });
    if (waiting === 0) await closeSession(sessionId);
    refresh();
    return null;
  });
}

export async function closeVoting(sessionId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const session = await participantSession(sessionId, viewer.id);
    if (session.hostId !== viewer.id) throw new UserError(t("errors.forbidden"));
    await closeSession(sessionId);
    refresh();
    return null;
  });
}

/** Turns the winning film into a screening for tonight with everyone who voted. */
export async function planFromPick(sessionId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const session = await participantSession(sessionId, viewer.id);
    if (session.status !== "DONE" || !session.resultFilmId) throw new UserError(t("common.somethingWrong"));
    const existing = await db.screening.findUnique({ where: { pickSessionId: sessionId }, select: { id: true } });
    if (existing) return { screeningId: existing.id };

    const screening = await db.screening.create({
      data: {
        circleId: session.circleId,
        filmId: session.resultFilmId,
        hostId: viewer.id,
        scheduledAt: new Date(),
        pickSessionId: sessionId,
        attendees: { create: session.participants.map((p) => ({ userId: p.userId, rsvp: "GOING" as const })) },
      },
    });
    return { screeningId: screening.id };
  });
}
