"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Crown, Download, MessageCircle, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/film/stars";
import { UserAvatar } from "@/components/user-avatar";
import type { ScreeningView } from "@/server/queries/screenings";
import { t } from "@/i18n";

const FLIP_DELAY = 0.35;

/** All the sealed ratings flip over one after another, then the verdict lands. */
export function RevealBoard({ view, viewerId }: { view: ScreeningView; viewerId: string }) {
  const summary = view.summary!;
  const fans = new Set(summary.biggestFans);
  const critics = new Set(summary.toughestCritics);
  const verdictDelay = 0.4 + view.ratings.length * FLIP_DELAY;

  return (
    <section className="space-y-6" aria-label={t("screening.revealed")}>
      <h2 className="marquee text-center text-4xl">{t("screening.revealed")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ perspective: 900 }}>
        {view.ratings.map((entry, i) => (
          <motion.li
            key={entry.user.id}
            initial={{ rotateY: 180, opacity: 0.4 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * FLIP_DELAY, duration: 0.6, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <UserAvatar name={entry.user.displayName} src={entry.user.avatarUrl} size="sm" />
              <span className="truncate text-sm font-medium">{entry.user.id === viewerId ? t("common.you") : entry.user.displayName}</span>
            </div>
            <Stars rating={entry.rating} size="md" className="mt-3" />
            <div className="mt-2 flex flex-wrap gap-1">
              {fans.has(entry.user.id) ? (
                <Badge variant="secondary">
                  <Crown className="size-3 text-primary" /> {t("screening.biggestFan")}
                </Badge>
              ) : null}
              {critics.has(entry.user.id) ? (
                <Badge variant="secondary">
                  <Snowflake className="size-3" /> {t("screening.toughestCritic")}
                </Badge>
              ) : null}
            </div>
            {entry.review ? <p className="mt-2 line-clamp-3 font-serif text-muted-foreground">{entry.review}</p> : null}
          </motion.li>
        ))}
      </ul>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: verdictDelay, type: "spring", stiffness: 200, damping: 20 }}
        className="screen-glow flex flex-col items-center gap-3 rounded-3xl border border-border p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">{t("screening.average")}</p>
        <p className="text-6xl font-semibold">{(summary.average / 2).toFixed(1)}★</p>
        {summary.label === "DIVISIVE" ? (
          <Badge className="bg-velvet px-3 py-1 text-base text-velvet-foreground">{t("screening.divisive")}</Badge>
        ) : summary.label === "UNANIMOUS" ? (
          <Badge variant="secondary" className="px-3 py-1 text-base">
            {t("screening.unanimous")}
          </Badge>
        ) : null}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <a href={`/api/og/reveal/${view.id}`} target="_blank" rel="noreferrer" download>
              <Download /> {t("screening.shareCard")}
            </a>
          </Button>
          <Button asChild>
            <Link href={`/circles/${view.circle.id}/threads/${view.film.tmdbId}`}>
              <MessageCircle /> {t("screening.discuss")}
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
