"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Poster } from "@/components/film/poster";
import { FilmSearchPicker } from "@/components/film/film-search-picker";
import { cn } from "@/lib/utils";
import type { SearchHit } from "@/app/api/search/route";
import { planScreening } from "@/server/actions/screenings";
import { t } from "@/i18n";

type Location = "HOME" | "CINEMA" | "OTHER";

function tonightAt(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  // datetime-local wants local "YYYY-MM-DDTHH:mm"
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function PlanScreeningDialog({ circleId, initialFilm }: { circleId: string; initialFilm?: SearchHit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [film, setFilm] = useState<SearchHit | null>(initialFilm ?? null);
  const [when, setWhen] = useState(() => tonightAt(21));
  const [location, setLocation] = useState<Location>("HOME");
  const [venue, setVenue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!film) return;
    startTransition(async () => {
      const result = await planScreening({
        circleId,
        tmdbId: film.tmdbId,
        scheduledAt: when ? new Date(when).toISOString() : null,
        location,
        venue: venue.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("screening.planned"));
      router.push(`/screenings/${result.data.screeningId}`);
    });
  }

  const locations: { id: Location; label: string }[] = [
    { id: "HOME", label: t("screening.atHome") },
    { id: "CINEMA", label: t("screening.atCinema") },
    { id: "OTHER", label: t("screening.elsewhere") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus /> {t("circles.planScreening")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="marquee text-3xl">{t("screening.planTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <Label>{t("screening.film")}</Label>
            {film ? (
              <div className="flex items-center gap-3 rounded-xl border border-border p-2">
                <Poster {...film} size="xs" />
                <span className="flex-1 font-medium">
                  {film.title} <span className="text-muted-foreground">{film.year}</span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setFilm(null)} aria-label={t("common.remove")}>
                  <X />
                </Button>
              </div>
            ) : (
              <FilmSearchPicker onPick={setFilm} placeholder={t("screening.pickFilm")} autoFocus />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="when">{t("screening.when")}</Label>
            <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("screening.where")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {locations.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={location === option.id}
                  onClick={() => setLocation(option.id)}
                  className={cn(
                    "rounded-lg border border-border px-2 py-2 text-sm transition-colors",
                    location === option.id && "border-primary bg-primary/10",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {location !== "HOME" && (
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t("screening.venue")} maxLength={120} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!film || pending}>
            {t("screening.plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
