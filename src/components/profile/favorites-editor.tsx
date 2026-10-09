"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Poster } from "@/components/film/poster";
import { FilmSearchPicker } from "@/components/film/film-search-picker";
import { setFavorites } from "@/server/actions/log";
import { t } from "@/i18n";

interface FilmRef {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

export function FavoritesEditor({ initial }: { initial: FilmRef[] }) {
  const [open, setOpen] = useState(false);
  const [films, setFilms] = useState(initial);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await setFavorites(films.map((f) => f.tmdbId));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFilms(initial);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {t("profile.editFavorites")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.favorites")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => films[i]).map((film, i) =>
            film ? (
              <div key={film.tmdbId} className="relative">
                <Poster {...film} size="fill" />
                <button
                  type="button"
                  onClick={() => setFilms(films.filter((f) => f.tmdbId !== film.tmdbId))}
                  className="absolute -top-2 -right-2 rounded-full bg-background p-1 shadow"
                  aria-label={`${t("common.remove")} ${film.title}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div key={`empty-${i}`} className="aspect-[2/3] rounded-md border border-dashed border-border" />
            ),
          )}
        </div>
        {films.length < 4 && (
          <FilmSearchPicker
            onPick={(film) => {
              if (!films.some((f) => f.tmdbId === film.tmdbId)) setFilms([...films, film]);
            }}
          />
        )}
        <DialogFooter>
          <Button onClick={save} disabled={pending}>
            {pending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
