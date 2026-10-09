import Link from "next/link";
import { cacheLife } from "next/cache";
import { Clapperboard, Download, Heart, Lock, Shuffle, Sparkles, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poster } from "@/components/film/poster";
import { RevealPreview } from "@/components/marketing/reveal-preview";
import { getPopular } from "@/lib/tmdb/api";
import { t, type MessageKey } from "@/i18n";

const LOOP: { step: MessageKey; title: MessageKey; body: MessageKey; icon: typeof Shuffle }[] = [
  { step: "landing.before", title: "landing.beforeTitle", body: "landing.beforeBody", icon: Shuffle },
  { step: "landing.during", title: "landing.duringTitle", body: "landing.duringBody", icon: Ticket },
  { step: "landing.after", title: "landing.afterTitle", body: "landing.afterBody", icon: Sparkles },
];

const FEATURES: { title: MessageKey; body: MessageKey; icon: typeof Users }[] = [
  { title: "landing.circlesTitle", body: "landing.circlesBody", icon: Users },
  { title: "landing.spoilersTitle", body: "landing.spoilersBody", icon: Lock },
  { title: "landing.compatTitle", body: "landing.compatBody", icon: Heart },
  { title: "landing.importTitle", body: "landing.importBody", icon: Download },
];

export default function LandingPage() {
  return (
    <>
      <section className="screen-glow relative overflow-hidden pt-28 pb-16 md:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-sm font-medium tracking-widest text-primary uppercase">{t("landing.eyebrow")}</p>
            <h1 className="marquee mt-4 text-6xl sm:text-7xl lg:text-8xl">{t("landing.title")}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("landing.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/sign-up">{t("landing.cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <a href="#how-it-works">{t("landing.secondaryCta")}</a>
              </Button>
            </div>
          </div>
          <RevealPreview />
        </div>
        <PosterStrip />
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
        <h2 className="marquee max-w-3xl text-4xl sm:text-5xl">{t("landing.loopTitle")}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {LOOP.map(({ step, title, body, icon: Icon }) => (
            <li key={step} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{t(step)}</span>
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="marquee mt-6 text-3xl">{t(title)}</h3>
              <p className="mt-2 text-muted-foreground">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="marquee max-w-3xl text-4xl sm:text-5xl">{t("landing.featuresTitle")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ title, body, icon: Icon }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-border bg-background/60 p-6">
                <Icon className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{t(title)}</h3>
                  <p className="mt-1 text-muted-foreground">{t(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="marquee text-4xl sm:text-5xl">{t("landing.valuesTitle")}</h2>
            <ul className="mt-6 space-y-3 text-lg">
              {(["landing.values1", "landing.values2", "landing.values3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <Clapperboard className="mt-1 size-5 shrink-0 text-velvet" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="screen-glow flex flex-col items-start justify-center rounded-3xl border border-border bg-card p-8">
            <h2 className="marquee text-5xl">{t("landing.finalTitle")}</h2>
            <Button asChild size="lg" className="mt-6 h-11 px-5 text-base">
              <Link href="/sign-up">{t("landing.finalCta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/** A wall of popular posters; cached for a day so the landing stays fully static. */
async function PosterStrip() {
  "use cache";
  cacheLife("days");
  const { results } = await getPopular();
  return (
    <div className="mask-x-from-90% mask-x-to-100% mt-16 flex gap-3 overflow-hidden px-4 opacity-80" aria-hidden>
      {results.slice(0, 14).map((film) => (
        <Poster
          key={film.id}
          tmdbId={film.id}
          title={film.title}
          year={Number(film.release_date?.slice(0, 4)) || null}
          posterPath={film.poster_path}
          size="md"
        />
      ))}
    </div>
  );
}
