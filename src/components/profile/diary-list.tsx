import Link from "next/link";
import { Heart, Repeat } from "lucide-react";
import { Poster } from "@/components/film/poster";
import { Stars } from "@/components/film/stars";
import { t } from "@/i18n";

export interface DiaryEntry {
  id: string;
  rating: number | null;
  liked: boolean;
  review: string | null;
  hasSpoilers: boolean;
  isRewatch: boolean;
  watchedOn: Date | null;
  createdAt: Date;
  film: { tmdbId: number; title: string; year: number | null; posterPath: string | null };
}

const monthFormat = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "UTC" });

/** Diary grouped by month, like a ticket stub collection. */
export function DiaryList({ entries }: { entries: DiaryEntry[] }) {
  const groups = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const key = entry.watchedOn ? monthFormat.format(entry.watchedOn) : "Undated";
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([month, items]) => (
        <section key={month}>
          <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{month}</h3>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {items.map((entry) => (
              <li key={entry.id} className="flex items-center gap-4 p-3">
                <span className="w-8 text-center font-mono text-lg text-muted-foreground">
                  {entry.watchedOn ? dayFormat.format(entry.watchedOn) : "–"}
                </span>
                <Link href={`/film/${entry.film.tmdbId}`}>
                  <Poster {...entry.film} size="xs" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/film/${entry.film.tmdbId}`} className="font-medium hover:underline">
                    {entry.film.title}
                  </Link>
                  <span className="ml-2 text-sm text-muted-foreground">{entry.film.year}</span>
                  {entry.review ? (
                    <p className="truncate font-serif text-muted-foreground">
                      {entry.hasSpoilers ? t("film.spoilerHidden") : entry.review}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {entry.rating ? <Stars rating={entry.rating} size="xs" /> : null}
                  {entry.liked ? <Heart className="size-3.5 fill-velvet text-velvet" aria-label={t("log.liked")} /> : null}
                  {entry.isRewatch ? <Repeat className="size-3.5 text-muted-foreground" aria-label={t("log.rewatch")} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
