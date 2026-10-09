import { clerkMiddleware } from "@clerk/nextjs/server";

// Makes the session available to auth(). Authorization happens next to the data:
// pages call requireViewer()/requireOnboardedViewer(), actions and route handlers re-check.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
