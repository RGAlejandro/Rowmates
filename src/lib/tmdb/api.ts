import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tmdbFetch } from "./client";
import type {
  TmdbFindResult,
  TmdbMovieDetails,
  TmdbMovieSummary,
  TmdbPaged,
  TmdbProvider,
  TmdbRegion,
  TmdbRegionProviders,
  TmdbWatchProviders,
} from "./types";

// Every read goes through `use cache`: TMDB data changes slowly and the
// rate limit is shared by the whole app.

export async function searchMovies(query: string, page = 1, year?: number) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>("/search/movie", {
    query,
    page,
    primary_release_year: year,
    include_adult: false,
    language: "en-US",
  });
}

export async function getMovie(id: number) {
  "use cache";
  cacheLife("days");
  cacheTag(`tmdb:movie:${id}`);
  return tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: "credits,videos", language: "en-US" });
}

export async function getWatchProviders(id: number, region: string): Promise<TmdbRegionProviders | null> {
  "use cache";
  cacheLife("days");
  const data = await tmdbFetch<TmdbWatchProviders>(`/movie/${id}/watch/providers`);
  return data.results[region] ?? null;
}

export async function getRecommendations(id: number) {
  "use cache";
  cacheLife("days");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>(`/movie/${id}/recommendations`, { language: "en-US" });
}

export async function getPopular(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>("/movie/popular", { page, language: "en-US" });
}

/** The most-voted films on TMDB: the ones almost everyone has seen (great for quick rating). */
export async function getMostVoted(page = 1) {
  "use cache";
  cacheLife("days");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>("/discover/movie", { sort_by: "vote_count.desc", include_adult: false, page });
}

export async function getNowPlaying(region: string) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>("/movie/now_playing", { region, language: "en-US" });
}

export interface DiscoverOptions {
  genres?: number[];
  providers?: number[];
  region?: string;
  maxRuntime?: number;
  page?: number;
}

export async function discoverMovies({ genres, providers, region, maxRuntime, page = 1 }: DiscoverOptions) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<TmdbPaged<TmdbMovieSummary>>("/discover/movie", {
    with_genres: genres?.join("|"),
    with_watch_providers: providers?.join("|"),
    watch_region: providers?.length ? region : undefined,
    with_watch_monetization_types: providers?.length ? "flatrate" : undefined,
    "with_runtime.lte": maxRuntime,
    "vote_count.gte": 200,
    sort_by: "popularity.desc",
    include_adult: false,
    page,
  });
}

export async function getProviderList(region: string): Promise<TmdbProvider[]> {
  "use cache";
  cacheLife("weeks");
  const data = await tmdbFetch<{ results: TmdbProvider[] }>("/watch/providers/movie", { watch_region: region });
  return [...data.results].sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99));
}

export async function getRegions(): Promise<TmdbRegion[]> {
  "use cache";
  cacheLife("weeks");
  const data = await tmdbFetch<{ results: TmdbRegion[] }>("/watch/providers/regions");
  return [...data.results].sort((a, b) => a.english_name.localeCompare(b.english_name));
}

export async function findByImdbId(imdbId: string): Promise<TmdbMovieSummary | null> {
  "use cache";
  cacheLife("weeks");
  const data = await tmdbFetch<TmdbFindResult>(`/find/${imdbId}`, { external_source: "imdb_id" });
  return data.movie_results[0] ?? null;
}
