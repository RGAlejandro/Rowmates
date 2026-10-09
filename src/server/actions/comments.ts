"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { t } from "@/i18n";
import { assertMember, hasLoggedFilm } from "@/server/guards";
import { notify } from "@/server/notifications";
import { assertRateLimit } from "@/server/rate-limit";
import { runAction, UserError } from "@/server/action";

const postSchema = z.object({
  circleId: z.string().min(1),
  filmId: z.number().int().positive(),
  body: z.string().trim().min(1).max(2000),
});

/** Comment in a circle's spoiler-locked thread. Only people who logged the film can post (or read). */
export async function postComment(input: z.input<typeof postSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    assertRateLimit(`comment:${viewer.id}`, 10, 60 * 1000);
    const { circleId, filmId, body } = postSchema.parse(input);
    await assertMember(circleId, viewer.id);
    if (!(await hasLoggedFilm(viewer.id, filmId))) throw new UserError(t("errors.forbidden"));

    const thread = await db.thread.upsert({
      where: { circleId_filmId: { circleId, filmId } },
      create: { circleId, filmId },
      update: { lastActivityAt: new Date() },
      include: { film: { select: { title: true } }, circle: { select: { name: true } } },
    });
    await db.comment.create({ data: { threadId: thread.id, authorId: viewer.id, body } });

    // Notify members who can already read the thread (they've logged the film).
    const readers = await db.circleMember.findMany({
      where: { circleId, user: { logs: { some: { filmId } } } },
      select: { userId: true },
    });
    await notify(
      readers.map((r) => r.userId),
      "THREAD_REPLY",
      { actorName: viewer.displayName, circleId, circleName: thread.circle.name, filmId, filmTitle: thread.film.title },
      viewer.id,
    );
    refresh();
    return null;
  });
}

export async function deleteComment(commentId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const comment = await db.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });
    if (!comment || comment.authorId !== viewer.id) throw new UserError(t("errors.forbidden"));
    await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "" } });
    refresh();
    return null;
  });
}
