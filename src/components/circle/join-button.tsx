"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinCircle } from "@/server/actions/circles";
import { t } from "@/i18n";

export function JoinButton({ token, circleName }: { token: string; circleName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await joinCircle(token);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(t("circles.joined", { circle: circleName }));
          router.push(`/circles/${result.data.circleId}`);
        })
      }
    >
      {t("circles.join")}
    </Button>
  );
}
