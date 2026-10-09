"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { t } from "@/i18n";
import { ensureFilm } from "@/server/films";
import { assertMember } from "@/server/guards";
import { circleMemberIds, notify } from "@/server/notifications";
import { assertRateLimit } from "@/server/rate-limit";
import { runAction, UserError } from "@/server/action";
import { CIRCLE_LIMITS } from "@/lib/circles";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const newToken = () => randomBytes(12).toString("base64url");

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["DUO", "CREW"]),
});

export async function createCircle(input: z.input<typeof createSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    assertRateLimit(`circle:${viewer.id}`, 10, 60 * 60 * 1000);
    const data = createSchema.parse(input);
    const circle = await db.circle.create({
      data: { ...data, createdById: viewer.id, members: { create: { userId: viewer.id, role: "OWNER" } } },
    });
    return { circleId: circle.id };
  });
}

/** Link-based invite. Duos get a single-use link; crews a 7-day open link. */
export async function createInvite(circleId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    await assertMember(circleId, viewer.id);
    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId }, select: { kind: true } });
    const existing = await db.circleInvite.findFirst({
      where: { circleId, createdById: viewer.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (existing && (existing.maxUses === null || existing.uses < existing.maxUses)) return { token: existing.token };
    const invite = await db.circleInvite.create({
      data: {
        token: newToken(),
        circleId,
        createdById: viewer.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        maxUses: circle.kind === "DUO" ? 1 : null,
      },
    });
    return { token: invite.token };
  });
}

export async function joinCircle(token: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const invite = await db.circleInvite.findUnique({
      where: { token },
      include: { circle: { select: { id: true, name: true, kind: true, _count: { select: { members: true } } } } },
    });
    if (!invite || invite.expiresAt < new Date() || (invite.maxUses !== null && invite.uses >= invite.maxUses)) {
      throw new UserError(t("circles.inviteExpired"));
    }
    const { circle } = invite;
    const already = await db.circleMember.findUnique({ where: { circleId_userId: { circleId: circle.id, userId: viewer.id } } });
    if (already) return { circleId: circle.id };
    if (circle._count.members >= CIRCLE_LIMITS[circle.kind]) throw new UserError(t("circles.full"));

    await db.$transaction([
      db.circleMember.create({ data: { circleId: circle.id, userId: viewer.id } }),
      db.circleInvite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } }),
      db.circle.update({ where: { id: circle.id }, data: { updatedAt: new Date() } }),
    ]);
    await notify(await circleMemberIds(circle.id), "CIRCLE_JOINED", { actorName: viewer.displayName, circleId: circle.id, circleName: circle.name }, viewer.id);
    return { circleId: circle.id };
  });
}

export async function leaveCircle(circleId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const membership = await assertMember(circleId, viewer.id);
    await db.circleMember.delete({ where: { circleId_userId: { circleId, userId: viewer.id } } });
    const remaining = await db.circleMember.findMany({ where: { circleId }, orderBy: { joinedAt: "asc" } });
    if (remaining.length === 0) {
      await db.circle.delete({ where: { id: circleId } });
    } else if (membership.role === "OWNER") {
      await db.circleMember.update({
        where: { circleId_userId: { circleId, userId: remaining[0].userId } },
        data: { role: "OWNER" },
      });
    }
    return null;
  });
}

export async function setCircleWatchlist(circleId: string, tmdbId: number, onList: boolean) {
  return runAction(async () => {
    const viewer = await requireViewer();
    await assertMember(circleId, viewer.id);
    const filmId = z.number().int().positive().parse(tmdbId);
    if (onList) {
      await ensureFilm(filmId);
      await db.circleWatchlistItem.upsert({
        where: { circleId_filmId: { circleId, filmId } },
        create: { circleId, filmId, addedById: viewer.id },
        update: {},
      });
    } else {
      await db.circleWatchlistItem.deleteMany({ where: { circleId, filmId } });
    }
    refresh();
    return null;
  });
}

export async function markAllNotificationsRead() {
  return runAction(async () => {
    const viewer = await requireViewer();
    await db.notification.updateMany({ where: { userId: viewer.id, readAt: null }, data: { readAt: new Date() } });
    refresh();
    return null;
  });
}
