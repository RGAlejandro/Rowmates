"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setWatchlist } from "@/server/actions/log";
import { t } from "@/i18n";

export function WatchlistButton({ tmdbId, initial }: { tmdbId: number; initial: boolean }) {
  const [pending, startTransition] = useTransition();
  const [onList, setOnList] = useOptimistic(initial);

  function toggle() {
    const next = !onList;
    startTransition(async () => {
      setOnList(next);
      const result = await setWatchlist(tmdbId, next);
      if (!result.ok) toast.error(result.error);
      else toast.success(t(next ? "watchlist.addedToast" : "watchlist.removedToast"));
    });
  }

  return (
    <Button variant="outline" size="lg" onClick={toggle} disabled={pending} aria-pressed={onList}>
      {onList ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      {t(onList ? "watchlist.added" : "watchlist.add")}
    </Button>
  );
}
