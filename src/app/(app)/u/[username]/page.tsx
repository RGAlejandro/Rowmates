import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { FilmCard, FilmGrid } from "@/components/film/film-card";
import { Poster } from "@/components/film/poster";
import { EmptyState, SectionHeader } from "@/components/ui-extras";
import { RatingHistogram } from "@/components/charts/rating-histogram";
import { BarList, StatTile } from "@/components/charts/bar-list";
import { FollowButton } from "@/components/profile/follow-button";
import { FavoritesEditor } from "@/components/profile/favorites-editor";
import { DiaryList } from "@/components/profile/diary-list";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getCompatibility, ratingCount } from "@/server/taste";
import { getDiaryPage, getFavorites, getProfile, getProfileStats, getRecentLogs, getWatchlist } from "@/server/queries/profile";
import { plural, t, type MessageKey } from "@/i18n";

type Props = PageProps<"/u/[username]">;
type Tab = "overview" | "diary" | "watchlist";

const TABS: { id: Tab; label: MessageKey }[] = [
  { id: "overview", label: "profile.stats" },
  { id: "diary", label: "profile.diary" },
  { id: "watchlist", label: "profile.watchlist" },
];

const memberSince = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  const profile = await getProfile(username, viewer?.id ?? null);
  if (!profile) notFound();
  const { user, isSelf, isFollowing, canSee } = profile;

  const tab: Tab = TABS.some((x) => x.id === query.tab) ? (query.tab as Tab) : "overview";
  const page = Math.max(1, Number(query.page) || 1);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <UserAvatar name={user.displayName} src={user.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="marquee text-4xl sm:text-5xl">{user.displayName}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
          {user.bio ? <p className="mt-2 max-w-prose">{user.bio}</p> : null}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{plural("profile.followers", user._count.followers)}</span>
            <span>{t("profile.followingCount", { count: user._count.following })}</span>
            <span>{t("profile.memberSince", { date: memberSince.format(user.createdAt) })}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewer && !isSelf ? <CompatBadge viewerId={viewer.id} userId={user.id} /> : null}
          {isSelf ? (
            <Button asChild variant="outline">
              <Link href="/settings">
                <Settings /> {t("nav.settings")}
              </Link>
            </Button>
          ) : viewer ? (
            <FollowButton username={user.username} initial={isFollowing} />
          ) : null}
        </div>
      </header>

      {!canSee ? (
        <EmptyState icon={<Lock className="size-6" />} message={t("profile.private")} />
      ) : (
        <>
          <nav className="flex gap-1 border-b border-border">
            {TABS.map(({ id, label }) => (
              <Link
                key={id}
                href={id === "overview" ? `/u/${user.username}` : `/u/${user.username}?tab=${id}`}
                className={cn(
                  "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                  tab === id && "border-primary text-foreground",
                )}
              >
                {t(label)}
              </Link>
            ))}
          </nav>

          {tab === "overview" && <Overview userId={user.id} viewerId={viewer?.id ?? null} isSelf={isSelf} />}
          {tab === "diary" && <Diary userId={user.id} viewerId={viewer?.id ?? null} page={page} username={user.username} />}
          {tab === "watchlist" && <Watchlist userId={user.id} />}
        </>
      )}
    </div>
  );
}

async function CompatBadge({ viewerId, userId }: { viewerId: string; userId: string }) {
  const [mine, theirs] = await Promise.all([ratingCount(viewerId), ratingCount(userId)]);
  if (mine < 5 || theirs < 5) return null;
  const compat = await getCompatibility(viewerId, userId);
  if (compat.commonCount === 0 && compat.confidence === "LOW") {
    return <Badge variant="outline">{t("profile.compatLow")}</Badge>;
  }
  return (
    <Badge className="bg-primary/15 px-3 py-1 text-sm text-primary">{t("profile.compatWithYou", { score: compat.score })}</Badge>
  );
}

async function Overview({ userId, viewerId, isSelf }: { userId: string; viewerId: string | null; isSelf: boolean }) {
  const [favorites, stats, recent] = await Promise.all([
    getFavorites(userId),
    getProfileStats(userId, viewerId),
    getRecentLogs(userId, viewerId),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title={t("profile.favorites")} action={isSelf ? <FavoritesEditor initial={favorites} /> : null} />
        {favorites.length ? (
          <div className="grid max-w-xl grid-cols-4 gap-3">
            {favorites.map((film) => (
              <Link key={film.tmdbId} href={`/film/${film.tmdbId}`}>
                <Poster {...film} size="fill" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("profile.noFavorites")}</p>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader title={t("profile.stats")} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label={t("profile.filmsLogged")} value={stats.filmsLogged.toLocaleString("en")} />
          <StatTile label={t("profile.thisYear")} value={stats.thisYear.toLocaleString("en")} />
          <StatTile label={t("profile.avgRating")} value={stats.average ? `${stats.average.toFixed(1)}★` : "–"} />
          <StatTile label={t("profile.hoursWatched")} value={stats.hours.toLocaleString("en")} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">{t("profile.ratingSpread")}</h3>
            <RatingHistogram counts={stats.histogram} label={t("profile.ratingSpread")} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">{t("profile.topGenres")}</h3>
            {stats.topGenres.length ? (
              <BarList items={stats.topGenres} label={t("profile.topGenres")} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("profile.emptyDiary")}</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title={t("profile.recent")} />
        {recent.length ? (
          <FilmGrid>
            {recent.map((log) => (
              <FilmCard key={log.id} film={log.film} rating={log.rating} />
            ))}
          </FilmGrid>
        ) : (
          <EmptyState message={t("profile.emptyDiary")} />
        )}
      </section>
    </div>
  );
}

async function Diary({ userId, viewerId, page, username }: { userId: string; viewerId: string | null; page: number; username: string }) {
  const { entries, totalPages } = await getDiaryPage(userId, viewerId, page);
  if (entries.length === 0) return <EmptyState message={t("profile.emptyDiary")} />;
  return (
    <div className="space-y-6">
      <DiaryList entries={entries} />
      {totalPages > 1 && (
        <div className="flex justify-between">
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={`/u/${username}?tab=diary&page=${page - 1}`}>{t("common.back")}</Link>
            </Button>
          ) : (
            <span />
          )}
          {page < totalPages ? (
            <Button asChild variant="outline">
              <Link href={`/u/${username}?tab=diary&page=${page + 1}`}>{t("common.next")}</Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

async function Watchlist({ userId }: { userId: string }) {
  const films = await getWatchlist(userId);
  if (films.length === 0) return <EmptyState message={t("watchlist.empty")} />;
  return (
    <FilmGrid>
      {films.map((film) => (
        <FilmCard key={film.tmdbId} film={film} />
      ))}
    </FilmGrid>
  );
}
