"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { Stars } from "./stars";

export interface ReviewCardData {
  id: string;
  rating: number | null;
  liked: boolean;
  review: string | null;
  hasSpoilers: boolean;
  user: { username: string; displayName: string; avatarUrl: string | null };
}

/** A review; spoiler-flagged text stays blurred until the viewer has logged the film or opts in. */
export function ReviewCard({ review, unlocked }: { review: ReviewCardData; unlocked: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const hidden = review.hasSpoilers && !unlocked && !revealed;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <Link href={`/u/${review.user.username}`} className="flex items-center gap-2">
          <UserAvatar name={review.user.displayName} src={review.user.avatarUrl} size="xs" />
          <span className="text-sm font-medium">{review.user.displayName}</span>
        </Link>
        {review.rating ? <Stars rating={review.rating} size="xs" /> : null}
        {review.liked ? <Heart className="size-3.5 fill-velvet text-velvet" aria-label={t("log.liked")} /> : null}
      </header>
      <div className="relative mt-2">
        <p className={cn("font-serif text-lg leading-snug whitespace-pre-line", hidden && "blur-sm select-none")} aria-hidden={hidden}>
          {review.review}
        </p>
        {hidden && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm">
            <span className="text-muted-foreground">{t("film.spoilerHidden")}</span>
            <Button size="xs" variant="outline" onClick={() => setRevealed(true)}>
              {t("film.revealSpoiler")}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
