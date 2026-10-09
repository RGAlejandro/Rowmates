import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

// User rows are created lazily by getViewer(); the webhook only keeps profile
// data in sync and erases everything when an account is deleted in Clerk.
export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.updated") {
    const { id, first_name, last_name, image_url } = event.data;
    const displayName = [first_name, last_name].filter(Boolean).join(" ");
    await db.user.updateMany({
      where: { clerkId: id },
      data: { avatarUrl: image_url, ...(displayName ? { displayName } : {}) },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await db.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("ok");
}
