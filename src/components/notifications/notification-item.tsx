import Link from "next/link";
import { Bell, Heart, MessageCircle, Shuffle, Sparkles, Ticket, UserPlus, Users } from "lucide-react";
import type { NotificationPayload } from "@/server/notifications";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type NotificationType =
  | "CIRCLE_JOINED"
  | "SCREENING_PLANNED"
  | "SCREENING_LOGGED"
  | "REVEAL_READY"
  | "THREAD_REPLY"
  | "NEW_FOLLOWER"
  | "PICK_STARTED"
  | "COMPAT_ACCEPTED";

function describe(type: NotificationType, p: NotificationPayload): { text: string; href: string; icon: typeof Bell } {
  const name = p.actorName ?? "";
  const vars = { name, circle: p.circleName ?? "", film: p.filmTitle ?? "" };
  switch (type) {
    case "CIRCLE_JOINED":
      return { text: t("notifications.circleJoined", vars), href: `/circles/${p.circleId}`, icon: Users };
    case "SCREENING_PLANNED":
      return { text: t("notifications.screeningPlanned", vars), href: `/screenings/${p.screeningId}`, icon: Ticket };
    case "SCREENING_LOGGED":
      return { text: t("notifications.screeningLogged", vars), href: `/screenings/${p.screeningId}`, icon: Ticket };
    case "REVEAL_READY":
      return { text: t("notifications.revealReady", vars), href: `/screenings/${p.screeningId}`, icon: Sparkles };
    case "THREAD_REPLY":
      return { text: t("notifications.threadReply", vars), href: `/circles/${p.circleId}/threads/${p.filmId}`, icon: MessageCircle };
    case "NEW_FOLLOWER":
      return { text: t("notifications.newFollower", vars), href: `/u/${p.username}`, icon: UserPlus };
    case "PICK_STARTED":
      return { text: t("notifications.pickStarted", vars), href: `/pick/${p.pickId}`, icon: Shuffle };
    case "COMPAT_ACCEPTED":
      return { text: t("notifications.compatAccepted", vars), href: `/u/${p.username}`, icon: Heart };
  }
}

export function NotificationItem({ type, payload, unread, when }: { type: NotificationType; payload: unknown; unread: boolean; when: React.ReactNode }) {
  const { text, href, icon: Icon } = describe(type, payload as NotificationPayload);
  return (
    <Link href={href} className={cn("flex items-start gap-3 p-4 hover:bg-secondary/40", unread && "bg-primary/5")}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", unread ? "text-primary" : "text-muted-foreground")} />
      <span className="flex-1 text-sm">{text}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
      {unread ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="unread" /> : null}
    </Link>
  );
}
