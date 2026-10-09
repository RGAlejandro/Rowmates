import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/ui-extras";
import { LocalTime } from "@/components/local-time";
import { NotificationItem } from "@/components/notifications/notification-item";
import { MarkReadButton } from "@/components/notifications/mark-read-button";
import { requireOnboardedViewer } from "@/lib/auth";
import { getNotifications } from "@/server/queries/home";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("notifications.title") };

export default async function NotificationsPage() {
  const viewer = await requireOnboardedViewer();
  const notifications = await getNotifications(viewer.id);
  const unread = notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t("notifications.title")} action={unread ? <MarkReadButton /> : null} />
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-7" />} message={t("notifications.empty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationItem
                type={n.type}
                payload={n.payload}
                unread={!n.readAt}
                when={<LocalTime iso={n.createdAt.toISOString()} format="date" />}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
