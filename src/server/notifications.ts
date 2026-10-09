import "server-only";
import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/enums";

export interface NotificationPayload {
  actorName?: string;
  circleId?: string;
  circleName?: string;
  filmId?: number;
  filmTitle?: string;
  screeningId?: string;
  pickId?: string;
  username?: string;
}

/** Fan out one notification to several people, never to the person who caused it. */
export async function notify(userIds: string[], type: NotificationType, payload: NotificationPayload, actorId?: string) {
  const recipients = [...new Set(userIds)].filter((id) => id !== actorId);
  if (!recipients.length) return;
  await db.notification.createMany({
    data: recipients.map((userId) => ({ userId, type, payload: payload as object })),
  });
}

export async function circleMemberIds(circleId: string): Promise<string[]> {
  const members = await db.circleMember.findMany({ where: { circleId }, select: { userId: true } });
  return members.map((m) => m.userId);
}
