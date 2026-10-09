"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { leaveCircle } from "@/server/actions/circles";
import { t } from "@/i18n";

export function LeaveCircleButton({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await leaveCircle(circleId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(t("circles.left"));
          router.push("/circles");
        })
      }
    >
      {t("circles.leave")}
    </Button>
  );
}
