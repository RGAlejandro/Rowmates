import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";

/** Shortcut used by the mobile nav: /me → /u/<username>. */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  const target = viewer ? `/u/${viewer.username}` : "/sign-in";
  return NextResponse.redirect(new URL(target, request.url));
}
