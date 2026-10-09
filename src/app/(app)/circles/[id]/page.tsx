import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Lock, MessageCircle, Shuffle, Unlock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilmCard, FilmGrid } from "@/components/film/film-card";
import { Poster } from "@/components/film/poster";
import { Stars } from "@/components/film/stars";
import { StatTile } from "@/components/charts/bar-list";
import { EmptyState, SectionHeader } from "@/components/ui-extras";
import { UserAvatar } from "@/components/user-avatar";
import { AvatarStack } from "@/components/circle/avatar-stack";
import { InviteDialog } from "@/components/circle/invite-dialog";
import { PlanScreeningDialog } from "@/components/circle/plan-screening-dialog";
import { ScreeningCard } from "@/components/circle/screening-card";
import { AddToCircleWatchlist, RemoveFromCircleWatchlist } from "@/components/circle/circle-watchlist-editor";
import { LeaveCircleButton } from "@/components/circle/leave-circle-button";
import { requireOnboardedViewer } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { buildCandidates } from "@/server/pick";
import { getCircle, getCircleDiary, getCircleStats, getCircleThreads, getCircleUpNext, getCircleWatchlist } from "@/server/queries/circles";
import { plural, t, type MessageKey } from "@/i18n";

type Props = PageProps<"/circles/[id]">;
type Tab = "upnext" | "watchlist" | "diary" | "discussions" | "members";

const TABS: { id: Tab; label: MessageKey }[] = [
  { id: "upnext", label: "circles.tabUpNext" },
  { id: "watchlist", label: "circles.tabWatchlist" },
  { id: "diary", label: "circles.tabDiary" },
  { id: "discussions", label: "circles.tabDiscussions" },
  { id: "members", label: "circles.tabMembers" },
];

export const metadata: Metadata = { title: t("nav.circles") };

export default async function CirclePage({ params, searchParams }: Props) {
  const viewer = await requireOnboardedViewer();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const circle = await getCircle(id, viewer.id);
  if (!circle) notFound();

  const tab: Tab = TABS.some((x) => x.id === query.tab) ? (query.tab as Tab) : "upnext";

  return (
    <div className="space-y-6">
      <header className="screen-glow -mx-4 -mt-6 space-y-5 px-4 pt-8 pb-2 md:-mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {circle.kind === "DUO" ? <Heart className="size-3" /> : <Users className="size-3" />}
            {t(circle.kind === "DUO" ? "circles.duo" : "circles.crew")}
          </Badge>
          <span className="text-sm text-muted-foreground">{plural("common.members", circle.members.length)}</span>
        </div>
        <h1 className="marquee text-5xl sm:text-6xl">{circle.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <AvatarStack people={circle.members.map((m) => m.user)} max={8} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/circles/${circle.id}/pick`}>
                <Shuffle /> {t("circles.startPick")}
              </Link>
            </Button>
            <PlanScreeningDialog circleId={circle.id} />
            <InviteDialog circleId={circle.id} circleName={circle.name} openInitially={query.invite === "1"} />
          </div>
        </div>
      </header>

      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(({ id: tabId, label }) => (
          <Link
            key={tabId}
            href={tabId === "upnext" ? `/circles/${circle.id}` : `/circles/${circle.id}?tab=${tabId}`}
            className={cn(
              "-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
              tab === tabId && "border-primary text-foreground",
            )}
          >
            {t(label)}
          </Link>
        ))}
      </nav>

      {tab === "upnext" && <UpNext circleId={circle.id} isDuo={circle.kind === "DUO"} memberIds={circle.members.map((m) => m.user.id)} region={viewer.region} />}
      {tab === "watchlist" && <Watchlist circleId={circle.id} />}
      {tab === "diary" && <Diary circleId={circle.id} />}
      {tab === "discussions" && <Discussions circleId={circle.id} viewerId={viewer.id} />}
      {tab === "members" && (
        <section className="space-y-6">
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {circle.members.map((member) => (
              <li key={member.user.id} className="flex items-center gap-3 p-3">
                <UserAvatar name={member.user.displayName} src={member.user.avatarUrl} size="sm" />
                <Link href={`/u/${member.user.username}`} className="flex-1 font-medium hover:underline">
                  {member.user.displayName}
                </Link>
                {member.role === "OWNER" ? <Badge variant="outline">{t("circles.owner")}</Badge> : null}
              </li>
            ))}
          </ul>
          <LeaveCircleButton circleId={circle.id} />
        </section>
      )}
    </div>
  );
}

async function UpNext({ circleId, isDuo, memberIds, region }: { circleId: string; isDuo: boolean; memberIds: string[]; region: string }) {
  const [{ screenings, picks }, stats] = await Promise.all([getCircleUpNext(circleId), getCircleStats(circleId)]);

  return (
    <div className="space-y-10">
      {picks.length > 0 && (
        <section className="space-y-3">
          {picks.map((pick) => (
            <Link
              key={pick.id}
              href={`/pick/${pick.id}`}
              className="flex items-center gap-4 rounded-2xl border border-primary/50 bg-primary/10 p-4"
            >
              <Shuffle className="size-6 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{t("home.votingNow")}</p>
                <p className="text-sm text-muted-foreground">
                  {pick.host.displayName} · {pick.participants.filter((p) => p.submittedAt).length}/{pick.participants.length}
                </p>
              </div>
              <Button size="sm">{t("pick.voteTitle")}</Button>
            </Link>
          ))}
        </section>
      )}

      <section>
        {screenings.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {screenings.map((screening) => (
              <ScreeningCard key={screening.id} screening={screening} />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <EmptyState icon={<Shuffle className="size-7" />} message={t("circles.upNextEmpty")} />
        ) : null}
      </section>

      {isDuo && (
        <section>
          <SectionHeader title={t("circles.blendTitle")} />
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t("circles.blendBody")}</p>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <Blend circleId={circleId} memberIds={memberIds} region={region} />
          </Suspense>
        </section>
      )}

      {stats.filmsTogether > 0 && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile label={t("circles.filmsTogether")} value={String(stats.filmsTogether)} />
          <StatTile label={t("circles.avgTogether")} value={stats.average ? `${stats.average.toFixed(1)}★` : "–"} />
          {stats.mostDivisive ? <StatTile label={t("circles.mostDivisive")} value={stats.mostDivisive.title} /> : null}
        </section>
      )}
    </div>
  );
}

async function Blend({ circleId, memberIds, region }: { circleId: string; memberIds: string[]; region: string }) {
  if (memberIds.length < 2) return <p className="text-sm text-muted-foreground">{t("circles.blendEmpty")}</p>;
  const candidates = await buildCandidates(circleId, memberIds, region, { onlyStreamable: true, allowRewatch: false, genres: [], maxRuntime: null });
  if (candidates.length === 0) return <p className="text-sm text-muted-foreground">{t("circles.blendEmpty")}</p>;
  const films = await db.film.findMany({
    where: { tmdbId: { in: candidates.slice(0, 8).map((c) => c.filmId) } },
    select: { tmdbId: true, title: true, year: true, posterPath: true },
  });
  const byId = new Map(films.map((f) => [f.tmdbId, f]));
  return (
    <FilmGrid>
      {candidates.slice(0, 8).map((c) => {
        const film = byId.get(c.filmId);
        return film ? <FilmCard key={c.filmId} film={film} /> : null;
      })}
    </FilmGrid>
  );
}

async function Watchlist({ circleId }: { circleId: string }) {
  const items = await getCircleWatchlist(circleId);
  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <AddToCircleWatchlist circleId={circleId} />
      </div>
      {items.length === 0 ? (
        <EmptyState message={t("circles.watchlistEmpty")} />
      ) : (
        <FilmGrid>
          {items.map(({ film, addedBy }) => (
            <div key={film.tmdbId} className="group relative">
              <FilmCard film={film} caption={addedBy.displayName.split(" ")[0]} />
              <RemoveFromCircleWatchlist circleId={circleId} tmdbId={film.tmdbId} title={film.title} />
            </div>
          ))}
        </FilmGrid>
      )}
    </section>
  );
}

async function Diary({ circleId }: { circleId: string }) {
  const diary = await getCircleDiary(circleId);
  if (diary.length === 0) return <EmptyState message={t("circles.diaryEmpty")} />;
  return (
    <ul className="space-y-3">
      {diary.map((entry) => (
        <li key={entry.id}>
          <Link href={`/screenings/${entry.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 hover:border-primary/50">
            <Poster {...entry.film} size="sm" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{entry.film.title}</p>
                {entry.summary.label === "DIVISIVE" ? <Badge className="bg-velvet text-velvet-foreground">{t("screening.divisive")}</Badge> : null}
                {entry.summary.label === "UNANIMOUS" ? <Badge variant="secondary">{t("screening.unanimous")}</Badge> : null}
              </div>
              {entry.summary.average ? <Stars rating={Math.round(entry.summary.average)} size="sm" /> : null}
              <AvatarStack people={entry.logs.map((l) => l.user)} size="xs" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Discussions({ circleId, viewerId }: { circleId: string; viewerId: string }) {
  const threads = await getCircleThreads(circleId, viewerId);
  if (threads.length === 0) return <EmptyState icon={<MessageCircle className="size-7" />} message={t("circles.discussionsEmpty")} />;
  return (
    <ul className="space-y-3">
      {threads.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`/circles/${circleId}/threads/${thread.film.tmdbId}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 hover:border-primary/50"
          >
            <Poster {...thread.film} size="xs" />
            <div className="flex-1">
              <p className="font-semibold">{thread.film.title}</p>
              <p className="text-sm text-muted-foreground">
                {thread.unlocked ? plural("common.comments", thread._count.comments) : plural("threads.waiting", thread._count.comments)}
              </p>
            </div>
            {thread.unlocked ? <Unlock className="size-4 text-muted-foreground" /> : <Lock className="size-4 text-primary" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
