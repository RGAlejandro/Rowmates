"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createInvite } from "@/server/actions/circles";
import { t } from "@/i18n";

export function InviteDialog({ circleId, circleName, openInitially = false }: { circleId: string; circleName: string; openInitially?: boolean }) {
  const [open, setOpen] = useState(openInitially);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || link) return;
    startTransition(async () => {
      const result = await createInvite(circleId);
      if (result.ok) setLink(`${window.location.origin}/join/${result.data.token}`);
      else toast.error(result.error);
    });
  }, [open, link, circleId]);

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("circles.inviteCopied"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus /> {t("circles.invite")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("circles.inviteTitle", { name: circleName })}</DialogTitle>
          <DialogDescription>{t("circles.inviteBody")}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link ?? ""} placeholder={pending ? t("common.loading") : ""} aria-label="Invite link" onFocus={(e) => e.target.select()} />
          <Button onClick={copy} disabled={!link} aria-label={t("common.copy")}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
