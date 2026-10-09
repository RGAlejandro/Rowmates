import "server-only";
import { db } from "@/lib/db";

const filmCard = { select: { tmdbId: true, title: true, year: true, posterPath: true } } as const;

/** What needs the viewer's attention across all their circles. */
export async function getUpNext(viewerId: string, now: Date) {
  const inMyCircles = { circle: { members: { some: { userId: viewerId } } } };
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [picks, planned, toRate, reveals] = await Promise.all([
    db.pickSession.findMany({
      where: { status: "VOTING", participants: { some: { userId: viewerId, submittedAt: null } } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, circle: { select: { name: true } } },
    }),
    db.screening.findMany({
      where: { status: "PLANNED", ...inMyCircles },
      orderBy: { scheduledAt: { sort: "asc", nulls: "last" } },
      take: 6,
      select: { id: true, scheduledAt: true, location: true, film: filmCard, circle: { select: { name: true } } },
    }),
    db.screening.findMany({
      where: {
        status: "WATCHED",
        ...inMyCircles,
        logs: { none: { userId: viewerId } },
        attendees: { some: { userId: viewerId, rsvp: { not: "DECLINED" } } },
      },
      take: 6,
      select: { id: true, film: filmCard, circle: { select: { name: true } } },
    }),
    db.screening.findMany({
      where: { status: "REVEALED", revealedAt: { gte: weekAgo }, ...inMyCircles },
      orderBy: { revealedAt: "desc" },
      take: 6,
      select: { id: true, film: filmCard, circle: { select: { name: true } } },
    }),
  ]);

  return { picks, planned, toRate, reveals };
}

export async function getNotifications(viewerId: string) {
  return db.notification.findMany({ where: { userId: viewerId }, orderBy: { createdAt: "desc" }, take: 50 });
}
