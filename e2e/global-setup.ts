import { createClerkClient } from "@clerk/backend";
import { clerkSetup } from "@clerk/testing/playwright";
import { Client } from "pg";
import { USER_A, USER_B } from "./users";

/**
 * Makes sure both test users exist in the Clerk dev instance and wipes their app
 * data, so every run starts from onboarding with a clean diary.
 */
export default async function globalSetup() {
  await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkIds: string[] = [];
  for (const user of [USER_A, USER_B]) {
    const existing = await clerk.users.getUserList({ emailAddress: [user.email] });
    const found = existing.data[0] ?? (await clerk.users.createUser({ emailAddress: [user.email], skipPasswordRequirement: true }));
    clerkIds.push(found.id);
  }

  // Plain SQL: the generated Prisma client is ESM-only and Playwright loads setup as CommonJS.
  const db = new Client({ connectionString: process.env.DATABASE_URL!.replace(/\?schema=.*/, "") });
  await db.connect();
  try {
    await db.query('DELETE FROM "User" WHERE "clerkId" = ANY($1)', [clerkIds]);
  } finally {
    await db.end();
  }
}
