import { Poster } from "@/components/film/poster";
import { Stars } from "@/components/film/stars";
import { UserAvatar } from "@/components/user-avatar";
import { t } from "@/i18n";

const SAMPLE = [
  { name: "Ana", rating: 10 },
  { name: "Leo", rating: 4 },
  { name: "Maya", rating: 9 },
  { name: "You", rating: 8 },
];

/** Static illustration of the Blind Reveal used on the landing page. */
export function RevealPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-card/80 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-4">
        <Poster tmdbId={666277} title="Past Lives" year={2023} size="sm" />
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">{t("screening.revealed")}</p>
          <p className="marquee text-3xl">Past Lives</p>
          <span className="mt-1 inline-block rounded-full bg-velvet px-2 py-0.5 text-xs font-semibold text-velvet-foreground">
            {t("screening.divisive")}
          </span>
        </div>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {SAMPLE.map((person, i) => (
          <li
            key={person.name}
            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both rounded-xl border border-border bg-background/60 p-3 duration-700"
            style={{ animationDelay: `${300 + i * 250}ms` }}
          >
            <div className="flex items-center gap-2">
              <UserAvatar name={person.name} size="xs" />
              <span className="text-sm font-medium">{person.name}</span>
            </div>
            <Stars rating={person.rating} size="sm" className="mt-2" />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">{t("screening.average")}</span>
        <span className="font-mono text-lg font-semibold text-primary">3.9</span>
      </div>
    </div>
  );
}
