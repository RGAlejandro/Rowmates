import type { Prisma } from "@/generated/prisma/client";

// Single source of truth for who can see what. Every query that reads other
// people's diary entries must go through visibleLogsWhere().

/** A log tied to a screening stays sealed until that screening's reveal. */
const NOT_SEALED: Prisma.LogEntryWhereInput = {
  OR: [{ screeningId: null }, { screening: { status: "REVEALED" } }],
};

/** Authors the viewer may read: not blocked either way, and public or sharing a circle. */
export function visibleAuthorWhere(viewerId: string | null): Prisma.UserWhereInput {
  if (!viewerId) return { isPrivate: false };
  return {
    blocking: { none: { blockedId: viewerId } },
    blockedBy: { none: { blockerId: viewerId } },
    OR: [
      { id: viewerId },
      { isPrivate: false },
      { memberships: { some: { circle: { members: { some: { userId: viewerId } } } } } },
    ],
  };
}

/** Diary entries visible to `viewerId` (null = signed out). Your own entries are always visible to you. */
export function visibleLogsWhere(viewerId: string | null): Prisma.LogEntryWhereInput {
  const others: Prisma.LogEntryWhereInput = { AND: [NOT_SEALED, { user: visibleAuthorWhere(viewerId) }] };
  return viewerId ? { OR: [{ userId: viewerId }, others] } : others;
}

/** Whether the viewer may open a profile's diary. */
export function canSeeProfile(
  viewerId: string | null,
  owner: { id: string; isPrivate: boolean },
  context: { sharesCircle: boolean; blocked: boolean },
): boolean {
  if (context.blocked) return false;
  if (viewerId === owner.id) return true;
  return !owner.isPrivate || context.sharesCircle;
}
