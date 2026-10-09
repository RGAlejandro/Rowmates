import "server-only";
import { db } from "@/lib/db";
import { visibleLogsWhere } from "@/lib/visibility";

export const FEED_PAGE_SIZE = 20;

/**
 * Diary activity from people the viewer follows or shares a circle with, newest first.
 * Bulk imports and undated quick ratings (onboarding) are left out so they don't flood the feed.
 */
export async function getFeed(viewerId: string, before?: Date) {
  const items = await db.logEntry.findMany({
    where: {
      userId: { not: viewerId },
      source: "MANUAL",
      ...(before ? { createdAt: { lt: before } } : {}),
      AND: [
        visibleLogsWhere(viewerId),
        { OR: [{ watchedOn: { not: null } }, { review: { not: null } }, { screeningId: { not: null } }] },
        {
          user: {
            OR: [
              { followers: { some: { followerId: viewerId } } },
              { memberships: { some: { circle: { members: { some: { userId: viewerId } } } } } },
            ],
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: FEED_PAGE_SIZE + 1,
    select: {
      id: true,
      rating: true,
      liked: true,
      review: true,
      hasSpoilers: true,
      createdAt: true,
      film: { select: { tmdbId: true, title: true, year: true, posterPath: true } },
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      screening: { select: { id: true, circle: { select: { id: true, name: true } } } },
    },
  });
  return {
    items: items.slice(0, FEED_PAGE_SIZE),
    nextBefore: items.length > FEED_PAGE_SIZE ? items[FEED_PAGE_SIZE - 1].createdAt : null,
  };
}

export type FeedItem = Awaited<ReturnType<typeof getFeed>>["items"][number];
