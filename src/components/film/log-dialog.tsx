"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { logFilm } from "@/server/actions/log";
import { t } from "@/i18n";
import { Poster } from "./poster";
import { StarInput } from "./star-input";

interface LogDialogProps {
  film: { tmdbId: number; title: string; year: number | null; posterPath: string | null };
  circles: { id: string; name: string }[];
  trigger: ReactNode;
}

const NO_CIRCLE = "none";

function today() {
  // en-CA formats as YYYY-MM-DD in the user's local time zone.
  return new Date().toLocaleDateString("en-CA");
}

export function LogDialog({ film, circles, trigger }: LogDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [watchedOn, setWatchedOn] = useState(today);
  const [review, setReview] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [circleId, setCircleId] = useState(NO_CIRCLE);

  function reset() {
    setRating(null);
    setLiked(false);
    setWatchedOn(today());
    setReview("");
    setHasSpoilers(false);
    setIsRewatch(false);
    setCircleId(NO_CIRCLE);
  }

  function submit() {
    startTransition(async () => {
      const result = await logFilm({
        tmdbId: film.tmdbId,
        rating,
        liked,
        watchedOn: watchedOn || null,
        review: review.trim() || null,
        hasSpoilers,
        isRewatch,
        circleId: circleId === NO_CIRCLE ? null : circleId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("log.saved"));
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Poster tmdbId={film.tmdbId} title={film.title} year={film.year} posterPath={film.posterPath} size="xs" />
            <div>
              <DialogTitle className="marquee text-2xl">{film.title}</DialogTitle>
              <DialogDescription>{film.year}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <Label>{t("log.rating")}</Label>
              <StarInput value={rating} onChange={setRating} label={t("log.rating")} />
            </div>
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              aria-pressed={liked}
              className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
            >
              <Heart className={cn("size-8 transition-colors", liked && "fill-velvet text-velvet")} />
              {t("log.liked")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="watched-on">{t("log.watchedOn")}</Label>
              <Input id="watched-on" type="date" value={watchedOn} max={today()} onChange={(e) => setWatchedOn(e.target.value)} />
            </div>
            {circles.length > 0 && (
              <div className="grid gap-1.5">
                <Label>{t("log.watchedWith")}</Label>
                <Select value={circleId} onValueChange={setCircleId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CIRCLE}>{t("log.nobody")}</SelectItem>
                    {circles.map((circle) => (
                      <SelectItem key={circle.id} value={circle.id}>
                        {circle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="review">{t("log.review")}</Label>
            <Textarea
              id="review"
              rows={4}
              maxLength={5000}
              placeholder={t("log.reviewPlaceholder")}
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={isRewatch} onCheckedChange={(v) => setIsRewatch(v === true)} />
              {t("log.rewatch")}
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={hasSpoilers} onCheckedChange={(v) => setHasSpoilers(v === true)} />
              {t("log.spoilers")}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? t("common.saving") : t("log.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
