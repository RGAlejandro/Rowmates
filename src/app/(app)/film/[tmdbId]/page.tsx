import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "@/components/film/poster";
import { Stars } from "@/components/film/stars";
import { FilmCard, FilmRow } from "@/components/film/film-card";
import { LogDialog } from "@/components/film/log-dialog";
import { WatchlistButton } from "@/components/film/watchlist-button";
import { WhereToWatch } from "@/components/film/providers";
import { ReviewCard } from "@/components/film/review-card";
import { EmptyState, SectionHeader } from "@/components/ui-extras";
import { UserAvatar } from "@/components/user-avatar";
import { getViewer, type Viewer } from "@/lib/auth";
import { getMovie, getRecommendations, getWatchProviders } from "@/lib/tmdb/api";
import { backdropUrl } from "@/lib/tmdb/images";
import { genreName } from "@/lib/tmdb/genres";
import { joinNames } from "@/lib/text";
import { getFilmReviews, getPeopleRatings, getViewerFilmState } from "@/server/queries/films";
import { plural, t } from "@/i18n";

type Props = PageProps<"/film/[tmdbId]">;

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

async function loadMovie(id: number) {
  try {
    return await getMovie(id);
  } catch (error) {
    if ((error as { status?: number }).status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).tmdbId);
  const film = await getMovie(id).catch(() => null);
  if (!film) return {};
  const year = film.release_date?.slice(0, 4);
  return { title: year ? `${film.title} (${year})` : film.title, description: film.overview };
}

export default async function FilmPage({ params }: Props) {
  const id = parseId((await params).tmdbId);
  const film = await loadMovie(id);
  const viewer = await getViewer();
  const region = viewer?.region ?? "US";
  const [providers, recommendations] = await Promise.all([getWatchProviders(id, region), getRecommendations(id)]);

  const year = Number(film.release_date?.slice(0, 4)) || null;
  const directors = film.credits?.crew.filter((c) => c.job === "Director").map((c) => c.name) ?? [];
  const cast = film.credits?.cast.slice(0, 8) ?? [];
  const backdrop = backdropUrl(film.backdrop_path);
  const filmRef = { tmdbId: film.id, title: film.title, year, posterPath: film.poster_path };

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-6 md:-mt-8 md:pt-8">
        {backdrop ? (
          <Image src={backdrop} alt="" fill priority className="-z-10 object-cover opacity-25" />
        ) : (
          <div className="screen-glow absolute inset-0 -z-10" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="flex flex-col gap-6 pb-2 sm:flex-row sm:items-end">
          <Poster {...filmRef} size="lg" className="w-36 sm:w-44" />
          <div className="min-w-0 flex-1">
            <h1 className="marquee text-4xl sm:text-6xl">{film.title}</h1>
            <p className="mt-2 text-muted-foreground">
              {[year, film.runtime ? t("film.runtime", { count: film.runtime }) : null].filter(Boolean).join(" · ")}
              {directors.length ? ` · ${t("film.directedBy", { names: joinNames(directors) })}` : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {film.genres.map((g) => (
                <Badge key={g.id} variant="secondary">
                  {genreName(g.id)}
                </Badge>
              ))}
            </div>
            <Suspense fallback={<Skeleton className="mt-5 h-9 w-64" />}>
              <ViewerActions viewer={viewer} film={filmRef} />
            </Suspense>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {film.overview ? (
            <section>
              <SectionHeader title={t("film.overview")} />
              {film.tagline ? <p className="mb-2 font-serif text-xl text-primary italic">{film.tagline}</p> : null}
              <p className="max-w-prose leading-relaxed text-muted-foreground">{film.overview}</p>
            </section>
          ) : null}

          {viewer ? (
            <section>
              <SectionHeader title={t("film.friendsRatings")} />
              <Suspense fallback={<Skeleton className="h-16 w-full" />}>
                <PeopleRatings viewerId={viewer.id} filmId={film.id} />
              </Suspense>
            </section>
          ) : null}

          <section>
            <SectionHeader title={t("film.reviews")} />
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <Reviews viewerId={viewer?.id ?? null} filmId={film.id} />
            </Suspense>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">{t("film.whereToWatch")}</h2>
            <WhereToWatch providers={providers} region={region} />
          </section>
          {cast.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">{t("film.cast")}</h2>
              <ul className="space-y-1.5 text-sm">
                {cast.map((person) => (
                  <li key={person.id} className="flex justify-between gap-3">
                    <span>{person.name}</span>
                    {person.character ? <span className="truncate text-muted-foreground">{person.character}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {recommendations.results.length > 0 && (
        <section>
          <SectionHeader title={t("film.recommendations")} />
          <FilmRow>
            {recommendations.results.slice(0, 12).map((rec) => (
              <FilmCard
                key={rec.id}
                film={{ tmdbId: rec.id, title: rec.title, year: Number(rec.release_date?.slice(0, 4)) || null, posterPath: rec.poster_path }}
              />
            ))}
          </FilmRow>
        </section>
      )}
    </div>
  );
}

async function ViewerActions({ viewer, film }: { viewer: Viewer | null; film: { tmdbId: number; title: string; year: number | null; posterPath: string | null } }) {
  if (!viewer) {
    return (
      <Button asChild className="mt-5" size="lg">
        <Link href="/sign-in">{t("film.signInToLog")}</Link>
      </Button>
    );
  }
  const state = await getViewerFilmState(viewer.id, film.tmdbId);
  const latest = state.logs[0];
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <LogDialog
        film={film}
        circles={state.circles}
        trigger={
          <Button size="lg">
            <Plus /> {t(state.logs.length ? "log.logAgain" : "log.button")}
          </Button>
        }
      />
      {state.logs.length === 0 ? <WatchlistButton tmdbId={film.tmdbId} initial={state.onWatchlist} /> : null}
      {latest ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {latest.rating ? <Stars rating={latest.rating} size="sm" /> : null}
          {latest.liked ? <Heart className="size-4 fill-velvet text-velvet" /> : null}
          {plural("film.loggedTimes", state.logs.length)}
        </span>
      ) : null}
    </div>
  );
}

async function PeopleRatings({ viewerId, filmId }: { viewerId: string; filmId: number }) {
  const ratings = await getPeopleRatings(viewerId, filmId);
  if (ratings.length === 0) return <p className="text-sm text-muted-foreground">{t("film.noFriendsRatings")}</p>;
  return (
    <ul className="flex flex-wrap gap-3">
      {ratings.map(({ user, rating, liked }) => (
        <li key={user.id}>
          <Link href={`/u/${user.username}`} className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1">
            <UserAvatar name={user.displayName} src={user.avatarUrl} size="xs" />
            <span className="text-sm">{user.displayName}</span>
            {rating ? <Stars rating={rating} size="xs" /> : null}
            {liked ? <Heart className="size-3 fill-velvet text-velvet" /> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Reviews({ viewerId, filmId }: { viewerId: string | null; filmId: number }) {
  const [reviews, viewerLogged] = await Promise.all([
    getFilmReviews(viewerId, filmId),
    viewerId ? getViewerFilmState(viewerId, filmId).then((s) => s.logs.length > 0) : Promise.resolve(false),
  ]);
  if (reviews.length === 0) return <EmptyState message={t("film.noReviews")} />;
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} unlocked={viewerLogged} />
      ))}
    </div>
  );
}
