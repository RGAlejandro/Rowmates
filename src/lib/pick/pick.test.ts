import { describe, expect, it } from "vitest";
import { computeTasteProfile } from "@/lib/taste/profile";
import { scoreCandidates, type PickFilmInput, type PickParticipantInput } from "./score";
import { hasUsedVeto, tallyVotes } from "./voting";

const HORROR = 27;
const ROMANCE = 10749;
const COMEDY = 35;

function person(name: string, overrides: Partial<PickParticipantInput> = {}): PickParticipantInput {
  return { userId: name, displayName: name, profile: null, watchlist: new Set(), seen: new Set(), ...overrides };
}

function film(filmId: number, genres: number[], overrides: Partial<PickFilmInput> = {}): PickFilmInput {
  return { filmId, genres, directors: [], runtime: 110, voteAverage: 7, onCircleWatchlist: false, streaming: null, ...overrides };
}

const horrorFan = computeTasteProfile([
  { filmId: 900, rating: 10, genres: [HORROR], directors: [] },
  { filmId: 901, rating: 10, genres: [HORROR], directors: [] },
  { filmId: 902, rating: 2, genres: [ROMANCE], directors: [] },
]);
const horrorHater = computeTasteProfile([
  { filmId: 900, rating: 1, genres: [HORROR], directors: [] },
  { filmId: 901, rating: 1, genres: [HORROR], directors: [] },
  { filmId: 902, rating: 9, genres: [ROMANCE], directors: [] },
]);

const noFilters = { onlyStreamable: false, allowRewatch: false };

describe("pick night scoring", () => {
  it("prefers films on several watchlists and says why", () => {
    const people = [person("Ana", { watchlist: new Set([1]) }), person("Leo", { watchlist: new Set([1]) })];
    const [top] = scoreCandidates(people, [film(1, [COMEDY]), film(2, [COMEDY])], noFilters, new Set());
    expect(top.filmId).toBe(1);
    expect(top.reasons[0]).toEqual({ key: "watchlists", count: 2 });
  });

  it("avoids films that make one person miserable (least misery)", () => {
    const people = [person("Ana", { profile: horrorFan }), person("Leo", { profile: horrorHater })];
    const films = [film(1, [HORROR], { voteAverage: 8 }), film(2, [COMEDY], { voteAverage: 7 })];
    const [top] = scoreCandidates(people, films, noFilters, new Set());
    expect(top.filmId).toBe(2);
  });

  it("filters out seen films, long films and unstreamable films", () => {
    const people = [person("Ana", { seen: new Set([1]) })];
    const films = [
      film(1, [COMEDY]),
      film(2, [COMEDY], { runtime: 200 }),
      film(3, [COMEDY], { streaming: [{ id: 99, name: "Elsewhere" }] }),
      film(4, [COMEDY], { streaming: [{ id: 8, name: "Netflix" }] }),
    ];
    const result = scoreCandidates(people, films, { maxRuntime: 150, onlyStreamable: true, allowRewatch: false }, new Set([8]));
    expect(result.map((c) => c.filmId)).toEqual([4]);
    expect(result[0].reasons).toContainEqual({ key: "streaming", service: "Netflix" });
  });

  it("allows rewatches when asked", () => {
    const people = [person("Ana", { seen: new Set([1]) })];
    expect(scoreCandidates(people, [film(1, [COMEDY])], { ...noFilters, allowRewatch: true }, new Set())).toHaveLength(1);
  });
});

describe("pick night voting", () => {
  const candidates = [
    { filmId: 1, score: 0.9, position: 0 },
    { filmId: 2, score: 0.8, position: 1 },
    { filmId: 3, score: 0.7, position: 2 },
  ];

  it("counts yes as 2 and maybe as 1", () => {
    const { winner, tallies } = tallyVotes(candidates, [
      { filmId: 1, userId: "a", value: "MAYBE" },
      { filmId: 2, userId: "a", value: "YES" },
      { filmId: 2, userId: "b", value: "MAYBE" },
      { filmId: 1, userId: "b", value: "MAYBE" },
    ]);
    expect(winner).toBe(2);
    expect(tallies.find((t) => t.filmId === 2)).toMatchObject({ yes: 1, maybe: 1, points: 3 });
  });

  it("knocks out vetoed films", () => {
    const { winner } = tallyVotes(candidates, [
      { filmId: 1, userId: "a", value: "YES" },
      { filmId: 1, userId: "b", value: "VETO" },
      { filmId: 3, userId: "b", value: "MAYBE" },
    ]);
    expect(winner).toBe(3);
  });

  it("breaks ties with the pre-vote score", () => {
    const { winner } = tallyVotes(candidates, [
      { filmId: 2, userId: "a", value: "YES" },
      { filmId: 3, userId: "b", value: "YES" },
    ]);
    expect(winner).toBe(2);
  });

  it("returns no winner when everything is rejected", () => {
    const { winner } = tallyVotes(candidates, [
      { filmId: 1, userId: "a", value: "VETO" },
      { filmId: 2, userId: "a", value: "NO" },
    ]);
    expect(winner).toBeNull();
  });

  it("tracks the one veto per person", () => {
    expect(hasUsedVeto([{ filmId: 1, userId: "a", value: "VETO" }], "a")).toBe(true);
    expect(hasUsedVeto([{ filmId: 1, userId: "a", value: "VETO" }], "b")).toBe(false);
  });
});
