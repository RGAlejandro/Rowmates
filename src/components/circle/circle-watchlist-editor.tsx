"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FilmSearchPicker } from "@/components/film/film-search-picker";
import { setCircleWatchlist } from "@/server/actions/circles";
import { t } from "@/i18n";

export function AddToCircleWatchlist({ circleId }: { circleId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {t("circles.addToWatchlist")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("circles.addToWatchlist")}</DialogTitle>
        </DialogHeader>
        <div aria-busy={pending}>
          <FilmSearchPicker
            autoFocus
            onPick={(film) =>
              startTransition(async () => {
                const result = await setCircleWatchlist(circleId, film.tmdbId, true);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success(film.title);
                  setOpen(false);
                }
              })
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RemoveFromCircleWatchlist({ circleId, tmdbId, title }: { circleId: string; tmdbId: number; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${t("common.remove")} ${title}`}
      className="absolute top-1 right-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      onClick={() =>
        startTransition(async () => {
          const result = await setCircleWatchlist(circleId, tmdbId, false);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      <X className="size-3.5" />
    </button>
  );
}
