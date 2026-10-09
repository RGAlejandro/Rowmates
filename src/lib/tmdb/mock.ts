import { FIXTURE_FILMS, FIXTURE_REGIONS, RENT_PROVIDERS, fixtureProvidersForRegion, type FixtureFilm } from "./fixtures";
import { normalizeTitle } from "@/lib/text";
import { GENRES } from "./genres";
import type {
  TmdbFindResult,
  TmdbMovieDetails,
  TmdbMovieSummary,
  TmdbPaged,
  TmdbProvider,
  TmdbRegion,
  TmdbWatchProviders,
} from "./types";

type Params = Record<string, string | number | boolean | undefined>;

const PAGE_SIZE = 20;
const byId = new Map(FIXTURE_FILMS.map((film) => [film.id, film]));

export class MockNotFoundError extends Error {
  status = 404;
}

function toSummary(film: FixtureFilm): TmdbMovieSummary {
  return {
    id: film.id,
    title: film.title,
    original_title: film.title,
    release_date: `${film.year}-07-01`,
    poster_path: null,
    backdrop_path: null,
    genre_ids: film.genres,
    popularity: film.popularity,
    vote_average: film.vote,
    vote_count: Math.round(film.popularity * 120),
    overview: film.overview,
    original_language: film.lang,
  };
}

function toDetails(film: FixtureFilm): TmdbMovieDetails {
  const summary: Omit<TmdbMovieSummary, "genre_ids"> = toSummary(film);
  delete (summary as TmdbMovieSummary).genre_ids;
  return {
    ...summary,
    runtime: film.runtime,
    genres: film.genres.map((id) => ({ id, name: GENRES[id] ?? "Other" })),
    tagline: null,
    imdb_id: film.imdb,
    credits: {
      cast: film.cast.map((name, order) => ({ id: film.id * 10 + order, name, profile_path: null, order })),
      crew: film.directors.map((name, i) => ({ id: film.id * 100 + i, name, job: "Director", department: "Directing", profile_path: null })),
    },
    videos: { results: [] },
  };
}

function paginate(films: FixtureFilm[], page: number): TmdbPaged<TmdbMovieSummary> {
  const start = (page - 1) * PAGE_SIZE;
  return {
    page,
    results: films.slice(start, start + PAGE_SIZE).map(toSummary),
    total_pages: Math.max(1, Math.ceil(films.length / PAGE_SIZE)),
    total_results: films.length,
  };
}

/** Deterministic pseudo-availability so the same film is always on the same services. */
function streamingFor(film: FixtureFilm, region: string): TmdbProvider[] {
  const providers = fixtureProvidersForRegion(region);
  const picked = providers.filter((p) => (film.id * 31 + p.provider_id * 17) % 5 < 2);
  return (picked.length ? picked : [providers[film.id % providers.length]]).map((p, i) => ({
    ...p,
    logo_path: null,
    display_priority: i,
  }));
}

function byPopularity(a: FixtureFilm, b: FixtureFilm) {
  return b.popularity - a.popularity;
}

export function mockTmdb<T>(path: string, params: Params = {}): T {
  const page = Number(params.page ?? 1);

  if (path === "/search/movie") {
    const query = normalizeTitle(String(params.query ?? ""));
    const year = Number(params.primary_release_year ?? params.year ?? 0);
    const results = FIXTURE_FILMS.filter(
      (f) => query.length > 0 && normalizeTitle(f.title).includes(query) && (!year || f.year === year),
    ).sort(byPopularity);
    return paginate(results, page) as T;
  }

  if (path === "/movie/popular") return paginate([...FIXTURE_FILMS].sort(byPopularity), page) as T;

  if (path === "/movie/now_playing") {
    const recent = FIXTURE_FILMS.filter((f) => f.year >= 2024).sort(byPopularity);
    return paginate(recent, page) as T;
  }

  if (path === "/discover/movie") {
    const genres = String(params.with_genres ?? "").split(/[|,]/).filter(Boolean).map(Number);
    const providers = String(params.with_watch_providers ?? "").split("|").filter(Boolean).map(Number);
    const region = String(params.watch_region ?? "US");
    const maxRuntime = Number(params["with_runtime.lte"] ?? 0);
    const results = FIXTURE_FILMS.filter(
      (f) =>
        (!genres.length || genres.some((g) => f.genres.includes(g))) &&
        (!providers.length || streamingFor(f, region).some((p) => providers.includes(p.provider_id))) &&
        (!maxRuntime || f.runtime <= maxRuntime),
    ).sort(byPopularity);
    return paginate(results, page) as T;
  }

  if (path === "/watch/providers/regions") return { results: FIXTURE_REGIONS as TmdbRegion[] } as T;

  if (path === "/watch/providers/movie") {
    const region = String(params.watch_region ?? "US");
    const results = fixtureProvidersForRegion(region).map((p, i) => ({ ...p, logo_path: null, display_priority: i }));
    return { results } as T;
  }

  const find = path.match(/^\/find\/(tt\d+)$/);
  if (find) {
    const film = FIXTURE_FILMS.find((f) => f.imdb === find[1]);
    return { movie_results: film ? [toSummary(film)] : [] } satisfies TmdbFindResult as T;
  }

  const movie = path.match(/^\/movie\/(\d+)(\/[a-z_/]+)?$/);
  if (movie) {
    const film = byId.get(Number(movie[1]));
    if (!film) throw new MockNotFoundError(`Mock film ${movie[1]} not found`);
    const sub = movie[2];

    if (!sub) return toDetails(film) as T;

    if (sub === "/watch/providers") {
      const results: TmdbWatchProviders["results"] = {};
      for (const { iso_3166_1: region } of FIXTURE_REGIONS) {
        results[region] = {
          link: `https://www.themoviedb.org/movie/${film.id}/watch?locale=${region}`,
          flatrate: streamingFor(film, region),
          rent: RENT_PROVIDERS.map((p) => ({ ...p, logo_path: null })),
        };
      }
      return { id: film.id, results } satisfies TmdbWatchProviders as T;
    }

    if (sub === "/recommendations" || sub === "/similar") {
      const related = FIXTURE_FILMS.filter((f) => f.id !== film.id)
        .map((f) => ({ f, shared: f.genres.filter((g) => film.genres.includes(g)).length }))
        .filter(({ shared }) => shared > 0)
        .sort((a, b) => b.shared - a.shared || byPopularity(a.f, b.f))
        .map(({ f }) => f);
      return paginate(related, page) as T;
    }
  }

  throw new MockNotFoundError(`No mock for TMDB path ${path}`);
}
