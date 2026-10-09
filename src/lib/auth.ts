import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { slugifyUsername } from "./usernames";

const viewerSelect = {
  id: true,
  clerkId: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  region: true,
  onboardedAt: true,
} as const;

export type Viewer = {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  region: string;
  onboardedAt: Date | null;
};

async function uniqueUsername(base: string): Promise<string> {
  const slug = slugifyUsername(base);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug.slice(0, 15)}_${Math.floor(Math.random() * 9000) + 1000}`;
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error("Could not allocate a username");
}

/**
 * The signed-in app user, or null. Creates the User row the first time a Clerk
 * user shows up, so the app never depends on the webhook having arrived.
 * Reads the session, so callers must sit behind a Suspense boundary.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { clerkId: userId }, select: viewerSelect });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const fallbackName = clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] ?? "member";
  const username = await uniqueUsername(clerkUser.username ?? clerkUser.firstName ?? fallbackName);
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || username;

  return db.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, username, displayName, avatarUrl: clerkUser.imageUrl },
    update: {},
    select: viewerSelect,
  });
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}

/** For app pages: signed in and finished onboarding. */
export async function requireOnboardedViewer(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.onboardedAt) redirect("/onboarding");
  return viewer;
}
