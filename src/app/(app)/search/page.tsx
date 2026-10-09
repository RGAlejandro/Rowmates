import type { Metadata } from "next";
import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilmCard, FilmGrid, FilmRow } from "@/components/film/film-card";
import { EmptyState, PageTitle, SectionHeader } from "@/components/ui-extras";
import { getViewer } from "@/lib/auth";
import { getNowPlaying, getPopular, searchMovies } from "@/lib/tmdb/api";
import type { TmdbMovieSummary } from "@/lib/tmdb/types";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("search.title") };

const toCard = (film: TmdbMovieSummary) => ({
  tmdbId: film.id,
  title: film.title,
  year: Number(film.release_date?.slice(0, 4)) || null,
  posterPath: film.poster_path,
});

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";

  return (
    <div className="space-y-8">
      <PageTitle title={t("search.title")} />
      <Form action="/search" className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="h-11 pl-10 text-base"
          autoFocus={!query}
        />
      </Form>
      {query ? <Results query={query} /> : <Discover />}
    </div>
  );
}

async function Results({ query }: { query: string }) {
  const { results } = await searchMovies(query);
  if (results.length === 0) return <EmptyState message={t("search.empty", { query })} />;
  return (
    <FilmGrid>
      {results.map((film) => (
        <FilmCard key={film.id} film={toCard(film)} />
      ))}
    </FilmGrid>
  );
}

async function Discover() {
  const viewer = await getViewer();
  const [popular, nowPlaying] = await Promise.all([getPopular(), getNowPlaying(viewer?.region ?? "US")]);
  return (
    <div className="space-y-10">
      {nowPlaying.results.length > 0 && (
        <section>
          <SectionHeader title={t("search.nowPlaying")} />
          <FilmRow>
            {nowPlaying.results.map((film) => (
              <FilmCard key={film.id} film={toCard(film)} />
            ))}
          </FilmRow>
        </section>
      )}
      <section>
        <SectionHeader title={t("search.popular")} />
        <FilmGrid>
          {popular.results.map((film) => (
            <FilmCard key={film.id} film={toCard(film)} />
          ))}
        </FilmGrid>
      </section>
    </div>
  );
}
