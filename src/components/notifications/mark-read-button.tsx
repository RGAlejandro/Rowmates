"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/server/actions/circles";
import { t } from "@/i18n";

export function MarkReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await markAllNotificationsRead()))}>
      {t("notifications.markAllRead")}
    </Button>
  );
}
