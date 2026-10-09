"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptCompatInvite, createCompatInvite, createDuoFromCompat } from "@/server/actions/compat";
import { t } from "@/i18n";

/** Home card button: creates (or reuses) the viewer's compatibility link and copies it. */
export function CompatLinkButton() {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!link) {
    return (
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createCompatInvite();
            if (result.ok) setLink(`${window.location.origin}/compat/${result.data.token}`);
            else toast.error(result.error);
          })
        }
      >
        <Heart /> {t("compat.createLink")}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={link} aria-label={t("compat.linkReady")} onFocus={(e) => e.target.select()} />
      <Button
        aria-label={t("common.copy")}
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          toast.success(t("common.copied"));
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

export function RevealScoreButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acceptCompatInvite(token);
          if (!result.ok) toast.error(result.error);
          else router.refresh();
        })
      }
    >
      <Sparkles /> {t("compat.cta")}
    </Button>
  );
}

export function CreateDuoButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await createDuoFromCompat(token);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(t("compat.duoCreated"));
          router.push(`/circles/${result.data.circleId}`);
        })
      }
    >
      <Heart /> {t("compat.createDuo")}
    </Button>
  );
}

export function RefreshButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.refresh()}>
      {label}
    </Button>
  );
}
