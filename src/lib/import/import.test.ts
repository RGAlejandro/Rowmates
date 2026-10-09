import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { kindForFile, parseLetterboxdCsv, parseLetterboxdZip } from "./letterboxd";
import { parseImdbCsv } from "./imdb";
import { externalKey, pickMatch } from "./matcher";
import { InvalidExportError } from "./types";
import type { TmdbMovieSummary } from "@/lib/tmdb/types";

const DIARY = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2026-01-03,Past Lives,2023,https://boxd.it/a1,4.5,,,2026-01-02
2026-02-10,"Crouching Tiger, Hidden Dragon",2000,https://boxd.it/a2,3,Yes,,2026-02-09
`;

const WATCHLIST = `Date,Name,Year,Letterboxd URI
2025-12-01,Aftersun,2022,https://boxd.it/b1
`;

const IMDB_RATINGS = `Const,Your Rating,Date Rated,Title,Original Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors
tt0111161,9,2025-05-01,The Shawshank Redemption,The Shawshank Redemption,https://www.imdb.com/title/tt0111161/,Movie,9.3,142,1994,Drama,3000000,1994-09-23,Frank Darabont
tt0903747,10,2025-05-02,Breaking Bad,Breaking Bad,https://www.imdb.com/title/tt0903747/,TV Series,9.5,49,2008,Drama,2000000,2008-01-20,
`;

describe("letterboxd import", () => {
  it("normalizes diary rows, including quoted titles and rewatches", () => {
    const rows = parseLetterboxdCsv("DIARY", DIARY);
    expect(rows).toEqual([
      { kind: "DIARY", title: "Past Lives", year: 2023, rating: 9, watchedOn: "2026-01-02", review: null, rewatch: false },
      { kind: "DIARY", title: "Crouching Tiger, Hidden Dragon", year: 2000, rating: 6, watchedOn: "2026-02-09", review: null, rewatch: true },
    ]);
  });

  it("detects file kinds and skips deleted entries", () => {
    expect(kindForFile("diary.csv")).toBe("DIARY");
    expect(kindForFile("letterboxd-export/likes/films.csv")).toBe("LIKE");
    expect(kindForFile("deleted/diary.csv")).toBeNull();
    expect(kindForFile("lists/my-list.csv")).toBeNull();
  });

  it("reads a full export ZIP", () => {
    const zip = zipSync({ "diary.csv": strToU8(DIARY), "watchlist.csv": strToU8(WATCHLIST), "profile.csv": strToU8("x") });
    const rows = parseLetterboxdZip(zip);
    expect(rows.filter((r) => r.kind === "DIARY")).toHaveLength(2);
    expect(rows.find((r) => r.kind === "WATCHLIST")).toMatchObject({ title: "Aftersun", watchedOn: null });
  });

  it("rejects files that are not Letterboxd exports", () => {
    expect(() => parseLetterboxdZip(strToU8("not a zip"))).toThrow(InvalidExportError);
    expect(() => parseLetterboxdCsv("DIARY", "foo,bar\n1,2")).toThrow(InvalidExportError);
  });
});

describe("imdb import", () => {
  it("keeps movies only and maps ratings", () => {
    const rows = parseImdbCsv(IMDB_RATINGS);
    expect(rows).toEqual([
      { kind: "RATING", title: "The Shawshank Redemption", year: 1994, imdbId: "tt0111161", rating: 9, watchedOn: "2025-05-01" },
    ]);
  });

  it("detects watchlists", () => {
    const csv = `Position,Const,Created,Modified,Description,Title,Original Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors,Your Rating,Date Rated
1,tt6751668,2025-01-01,2025-01-01,,Parasite,Gisaengchung,https://www.imdb.com/title/tt6751668/,Movie,8.5,132,2019,Drama,900000,2019-05-30,Bong Joon Ho,,
`;
    expect(parseImdbCsv(csv)[0]).toMatchObject({ kind: "WATCHLIST", imdbId: "tt6751668", rating: null });
  });
});

describe("tmdb matcher", () => {
  const result = (id: number, title: string, year: number, popularity = 10): TmdbMovieSummary => ({
    id,
    title,
    release_date: `${year}-05-01`,
    poster_path: null,
    backdrop_path: null,
    popularity,
  });

  it("matches exact title and year, ignoring accents and punctuation", () => {
    expect(pickMatch({ title: "Amelie", year: 2001 }, [result(194, "Amélie", 2001)])).toEqual({ status: "MATCHED", filmId: 194 });
  });

  it("accepts a one-year difference when unambiguous", () => {
    expect(pickMatch({ title: "Roma", year: 2019 }, [result(426426, "Roma", 2018)])).toEqual({ status: "MATCHED", filmId: 426426 });
  });

  it("prefers the exact year among remakes", () => {
    const results = [result(1, "Suspiria", 1977, 30), result(2, "Suspiria", 2018, 50)];
    expect(pickMatch({ title: "Suspiria", year: 1977 }, results)).toEqual({ status: "MATCHED", filmId: 1 });
  });

  it("asks for review when unsure and reports misses", () => {
    expect(pickMatch({ title: "Dune", year: 1999 }, [result(438631, "Dune", 2021)]).status).toBe("AMBIGUOUS");
    expect(pickMatch({ title: "Nope", year: 2022 }, [])).toEqual({ status: "UNMATCHED" });
  });

  it("builds stable cache keys", () => {
    expect(externalKey({ title: "Amélie", year: 2001 }, "LETTERBOXD")).toBe("amelie|2001");
    expect(externalKey({ title: "X", year: 2022, imdbId: "tt123" }, "IMDB")).toBe("tt123");
  });
});
