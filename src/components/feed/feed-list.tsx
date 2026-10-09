import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { Poster } from "@/components/film/poster";
import { Stars } from "@/components/film/stars";
import { UserAvatar } from "@/components/user-avatar";
import type { FeedItem } from "@/server/queries/feed";
import { t } from "@/i18n";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(date: Date, now: Date): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return relative.format(0, "minute");
}

export function FeedList({ items, now }: { items: FeedItem[]; now: Date }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
          <Link href={`/film/${item.film.tmdbId}`} className="shrink-0">
            <Poster {...item.film} size="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
              <Link href={`/u/${item.user.username}`} className="flex items-center gap-1.5 font-medium">
                <UserAvatar name={item.user.displayName} src={item.user.avatarUrl} size="xs" />
                {item.user.displayName}
              </Link>
              <span className="text-muted-foreground">{t(item.review ? "home.reviewed" : item.rating ? "home.rated" : "home.logged")}</span>
              <Link href={`/film/${item.film.tmdbId}`} className="font-medium hover:underline">
                {item.film.title}
              </Link>
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {item.rating ? <Stars rating={item.rating} size="xs" /> : null}
              {item.liked ? <Heart className="size-3 fill-velvet text-velvet" /> : null}
              <span>{timeAgo(item.createdAt, now)}</span>
              {item.screening ? (
                <Link href={`/screenings/${item.screening.id}`} className="flex items-center gap-1 text-primary">
                  <Sparkles className="size-3" />
                  {t("home.revealedIn", { circle: item.screening.circle.name })}
                </Link>
              ) : null}
            </div>
            {item.review ? (
              <p className="mt-2 line-clamp-3 font-serif text-base text-foreground/90">
                {item.hasSpoilers ? t("film.spoilerHidden") : item.review}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
