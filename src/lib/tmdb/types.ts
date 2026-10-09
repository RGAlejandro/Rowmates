// Subset of the TMDB v3 API shapes the app relies on.

export interface TmdbMovieSummary {
  id: number;
  title: string;
  original_title?: string;
  /** "YYYY-MM-DD", or "" when unknown. */
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  original_language?: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path: string | null;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  name?: string;
}

export interface TmdbMovieDetails extends Omit<TmdbMovieSummary, "genre_ids"> {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline?: string | null;
  imdb_id?: string | null;
  credits?: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] };
  videos?: { results: TmdbVideo[] };
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface TmdbRegionProviders {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
}

export interface TmdbWatchProviders {
  id: number;
  results: Record<string, TmdbRegionProviders>;
}

export interface TmdbRegion {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}

export interface TmdbFindResult {
  movie_results: TmdbMovieSummary[];
}
