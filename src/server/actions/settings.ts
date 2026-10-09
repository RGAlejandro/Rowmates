"use server";

import { refresh } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { isValidUsername } from "@/lib/usernames";
import { t } from "@/i18n";
import { runAction, UserError } from "@/server/action";

const settingsSchema = z.object({
  username: z.string().trim().toLowerCase(),
  displayName: z.string().trim().min(1).max(50),
  bio: z.string().trim().max(280),
  isPrivate: z.boolean(),
});

export async function updateSettings(input: z.input<typeof settingsSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = settingsSchema.parse(input);
    if (!isValidUsername(data.username)) throw new UserError(t("onboarding.usernameInvalid"));
    const taken = await db.user.findFirst({ where: { username: data.username, NOT: { id: viewer.id } }, select: { id: true } });
    if (taken) throw new UserError(t("onboarding.usernameTaken"));
    await db.user.update({ where: { id: viewer.id }, data: { ...data, bio: data.bio || null } });
    refresh();
    return null;
  });
}

/** Erases the account everywhere: our database (cascades) and the Clerk user. */
export async function deleteAccount() {
  return runAction(async () => {
    const viewer = await requireViewer();
    await db.user.delete({ where: { id: viewer.id } });
    const clerk = await clerkClient();
    await clerk.users.deleteUser(viewer.clerkId);
    return null;
  });
}
