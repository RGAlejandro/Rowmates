import "server-only";
import { db } from "@/lib/db";
import { t } from "@/i18n";
import { UserError } from "./action";

/** Throws unless the user belongs to the circle. Returns the membership. */
export async function assertMember(circleId: string, userId: string) {
  const membership = await db.circleMember.findUnique({ where: { circleId_userId: { circleId, userId } } });
  if (!membership) throw new UserError(t("errors.forbidden"));
  return membership;
}

export async function isMember(circleId: string, userId: string): Promise<boolean> {
  const membership = await db.circleMember.findUnique({ where: { circleId_userId: { circleId, userId } }, select: { userId: true } });
  return membership !== null;
}

export async function hasLoggedFilm(userId: string, filmId: number): Promise<boolean> {
  const log = await db.logEntry.findFirst({ where: { userId, filmId }, select: { id: true } });
  return log !== null;
}

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const block = await db.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { blockerId: true },
  });
  return block !== null;
}
