import { describe, expect, it } from "vitest";
import { mockTmdb } from "./mock";
import type { TmdbMovieDetails, TmdbPaged, TmdbMovieSummary, TmdbWatchProviders } from "./types";

describe("tmdb mock", () => {
  it("searches titles accent-insensitively", () => {
    const data = mockTmdb<TmdbPaged<TmdbMovieSummary>>("/search/movie", { query: "amelie" });
    expect(data.results.map((r) => r.id)).toEqual([194]);
  });

  it("returns details with directors and runtime", () => {
    const film = mockTmdb<TmdbMovieDetails>("/movie/496243");
    expect(film.runtime).toBe(133);
    expect(film.credits?.crew.find((c) => c.job === "Director")?.name).toBe("Bong Joon Ho");
  });

  it("gives every film at least one stable streaming option per region", () => {
    const first = mockTmdb<TmdbWatchProviders>("/movie/27205/watch/providers");
    const again = mockTmdb<TmdbWatchProviders>("/movie/27205/watch/providers");
    expect(first.results.US.flatrate?.length).toBeGreaterThan(0);
    expect(first).toEqual(again);
  });

  it("finds films by IMDb id", () => {
    const data = mockTmdb<{ movie_results: TmdbMovieSummary[] }>("/find/tt0111161");
    expect(data.movie_results[0].id).toBe(278);
  });

  it("throws for unknown films", () => {
    expect(() => mockTmdb("/movie/1")).toThrow();
  });
});
