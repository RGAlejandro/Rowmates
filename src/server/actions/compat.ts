"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { t } from "@/i18n";
import { notify } from "@/server/notifications";
import { getCompatibility, ratingCount } from "@/server/taste";
import { runAction, UserError } from "@/server/action";

export async function createCompatInvite() {
  return runAction(async () => {
    const viewer = await requireViewer();
    const open = await db.compatInvite.findFirst({ where: { inviterId: viewer.id, acceptedById: null }, orderBy: { createdAt: "desc" } });
    if (open) return { token: open.token };
    const invite = await db.compatInvite.create({ data: { inviterId: viewer.id, token: randomBytes(12).toString("base64url") } });
    return { token: invite.token };
  });
}

/** The friend opens the link: record who accepted and score the pair. */
export async function acceptCompatInvite(token: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const invite = await db.compatInvite.findUnique({ where: { token: z.string().min(1).parse(token) } });
    if (!invite) throw new UserError(t("common.notFound"));
    if (invite.inviterId === viewer.id) throw new UserError(t("compat.ownLink"));
    if (invite.acceptedById && invite.acceptedById !== viewer.id) throw new UserError(t("compat.used"));
    if ((await ratingCount(viewer.id)) < 5) throw new UserError(t("compat.needRatings"));

    if (!invite.acceptedById) {
      await db.compatInvite.update({ where: { id: invite.id }, data: { acceptedById: viewer.id, acceptedAt: new Date() } });
      await notify([invite.inviterId], "COMPAT_ACCEPTED", { actorName: viewer.displayName, username: viewer.username });
    }
    const result = await getCompatibility(viewer.id, invite.inviterId);
    return { score: result.score };
  });
}

/** One tap from a compatibility result to a shared Duo circle. */
export async function createDuoFromCompat(token: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const invite = await db.compatInvite.findUnique({
      where: { token },
      include: { inviter: { select: { id: true, displayName: true } } },
    });
    if (!invite || ![invite.inviterId, invite.acceptedById].includes(viewer.id) || !invite.acceptedById) {
      throw new UserError(t("errors.forbidden"));
    }
    if (invite.circleId) return { circleId: invite.circleId };

    const other = invite.inviterId === viewer.id ? invite.acceptedById : invite.inviterId;
    const otherUser = await db.user.findUniqueOrThrow({ where: { id: other }, select: { displayName: true } });
    const name = `${viewer.displayName.split(" ")[0]} & ${otherUser.displayName.split(" ")[0]}`.slice(0, 60);
    const circle = await db.circle.create({
      data: {
        name,
        kind: "DUO",
        createdById: viewer.id,
        members: { create: [{ userId: viewer.id, role: "OWNER" }, { userId: other }] },
      },
    });
    await db.compatInvite.update({ where: { id: invite.id }, data: { circleId: circle.id } });
    return { circleId: circle.id };
  });
}
