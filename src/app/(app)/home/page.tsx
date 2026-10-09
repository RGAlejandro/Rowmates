import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Download, Heart, Lock, Search, Shuffle, Sparkles, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poster } from "@/components/film/poster";
import { LocalTime } from "@/components/local-time";
import { EmptyState, SectionHeader } from "@/components/ui-extras";
import { FeedList } from "@/components/feed/feed-list";
import { CompatLinkButton } from "@/components/compat/compat-actions";
import { requireOnboardedViewer } from "@/lib/auth";
import { getFeed } from "@/server/queries/feed";
import { getUpNext } from "@/server/queries/home";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.home") };

type FilmRef = { tmdbId: number; title: string; year: number | null; posterPath: string | null };

function UpNextCard({ href, film, icon, label, detail, accent }: { href: string; film?: FilmRef; icon: React.ReactNode; label: string; detail: React.ReactNode; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-72 shrink-0 items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-primary/60 ${accent ? "border-primary/50 bg-primary/10" : "border-border bg-card"}`}
    >
      {film ? <Poster {...film} size="sm" /> : <span className="grid size-16 place-items-center rounded-xl bg-secondary">{icon}</span>}
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
          {icon} {label}
        </span>
        <span className="mt-1 block truncate font-medium">{film?.title}</span>
        <span className="block truncate text-sm text-muted-foreground">{detail}</span>
      </span>
    </Link>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const viewer = await requireOnboardedViewer();
  const { before } = await searchParams;
  const beforeDate = typeof before === "string" && !Number.isNaN(Date.parse(before)) ? new Date(before) : undefined;
  await connection();
  const now = new Date();
  const [feed, upNext] = await Promise.all([getFeed(viewer.id, beforeDate), getUpNext(viewer.id, now)]);
  const hasUpNext = upNext.picks.length + upNext.toRate.length + upNext.reveals.length + upNext.planned.length > 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="marquee text-4xl sm:text-5xl">{t("home.greeting", { name: viewer.displayName.split(" ")[0] })}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/circles">
              <Users /> {t("nav.circles")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">
              <Search /> {t("nav.search")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/import">
              <Download /> {t("nav.import")}
            </Link>
          </Button>
        </div>
      </header>

      <section>
        <SectionHeader title={t("home.upNext")} />
        {hasUpNext ? (
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {upNext.picks.map((pick) => (
              <UpNextCard key={pick.id} href={`/pick/${pick.id}`} icon={<Shuffle className="size-3.5" />} label={t("home.votingNow")} detail={pick.circle.name} accent />
            ))}
            {upNext.toRate.map((s) => (
              <UpNextCard key={s.id} href={`/screenings/${s.id}`} film={s.film} icon={<Lock className="size-3.5" />} label={t("screening.needsRating")} detail={s.circle.name} accent />
            ))}
            {upNext.reveals.map((s) => (
              <UpNextCard key={s.id} href={`/screenings/${s.id}`} film={s.film} icon={<Sparkles className="size-3.5" />} label={t("screening.revealReady")} detail={s.circle.name} />
            ))}
            {upNext.planned.map((s) => (
              <UpNextCard
                key={s.id}
                href={`/screenings/${s.id}`}
                film={s.film}
                icon={<Ticket className="size-3.5" />}
                label={t("screening.upcoming")}
                detail={s.scheduledAt ? <LocalTime iso={s.scheduledAt.toISOString()} /> : s.circle.name}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Shuffle className="size-7" />} message={t("home.upNextEmpty")} />
        )}
      </section>

      <section className="grid items-center gap-4 rounded-3xl border border-border bg-card p-6 md:grid-cols-[1fr_auto]">
        <div className="flex items-start gap-4">
          <Heart className="mt-1 size-7 shrink-0 text-velvet" />
          <div>
            <h2 className="text-xl font-semibold">{t("compat.cta")}</h2>
            <p className="text-sm text-muted-foreground">{t("compat.ctaBody")}</p>
          </div>
        </div>
        <div className="md:w-96">
          <CompatLinkButton />
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.activity")} />
        {feed.items.length ? (
          <div className="space-y-4">
            <FeedList items={feed.items} now={now} />
            {feed.nextBefore ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/home?before=${feed.nextBefore.toISOString()}`}>{t("common.loadMore")}</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <EmptyState message={t("home.activityEmpty")} />
        )}
      </section>
    </div>
  );
}
