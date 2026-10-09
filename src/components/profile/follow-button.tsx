"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFollowing } from "@/server/actions/follows";
import { t } from "@/i18n";

export function FollowButton({ username, initial }: { username: string; initial: boolean }) {
  const [pending, startTransition] = useTransition();
  const [following, setOptimistic] = useOptimistic(initial);

  return (
    <Button
      variant={following ? "outline" : "default"}
      disabled={pending}
      aria-pressed={following}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!following);
          const result = await setFollowing(username, !following);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      {t(following ? "profile.following" : "profile.follow")}
    </Button>
  );
}
