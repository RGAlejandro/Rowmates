"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { t } from "@/i18n";
import { isBlockedEitherWay } from "@/server/guards";
import { notify } from "@/server/notifications";
import { runAction, UserError } from "@/server/action";

export async function setFollowing(username: string, follow: boolean) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const target = await db.user.findUnique({ where: { username }, select: { id: true, username: true } });
    if (!target || target.id === viewer.id) throw new UserError(t("common.notFound"));

    if (follow) {
      if (await isBlockedEitherWay(viewer.id, target.id)) throw new UserError(t("errors.forbidden"));
      const created = await db.follow.createMany({
        data: [{ followerId: viewer.id, followeeId: target.id }],
        skipDuplicates: true,
      });
      if (created.count > 0) {
        await notify([target.id], "NEW_FOLLOWER", { actorName: viewer.displayName, username: viewer.username }, viewer.id);
      }
    } else {
      await db.follow.deleteMany({ where: { followerId: viewer.id, followeeId: target.id } });
    }
    refresh();
    return null;
  });
}
