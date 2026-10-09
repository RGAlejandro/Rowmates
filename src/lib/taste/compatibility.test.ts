import { describe, expect, it } from "vitest";
import { affinity, computeTasteProfile, type RatedFilm } from "./profile";
import { computeCompatibility, similarityToScore, type CompatSide } from "./compatibility";

const DRAMA = 18;
const HORROR = 27;
const COMEDY = 35;

function side(ratings: [number, number][], genresOf: (id: number) => number[] = () => [DRAMA]): CompatSide {
  const films: RatedFilm[] = ratings.map(([filmId, rating]) => ({ filmId, rating, genres: genresOf(filmId), directors: [] }));
  return { ratings: new Map(ratings), profile: computeTasteProfile(films) };
}

/** 30 films with a wide spread of ratings. */
const base: [number, number][] = Array.from({ length: 30 }, (_, i) => [i + 1, (i % 10) + 1]);

describe("taste profile", () => {
  it("weights genres relative to the user's own average", () => {
    const profile = computeTasteProfile([
      { filmId: 1, rating: 10, genres: [HORROR], directors: ["Ari Aster"] },
      { filmId: 2, rating: 9, genres: [HORROR], directors: ["Ari Aster"] },
      { filmId: 3, rating: 2, genres: [COMEDY], directors: [] },
      { filmId: 4, rating: 3, genres: [COMEDY], directors: [] },
    ]);
    expect(profile.genreWeights[HORROR]).toBeGreaterThan(0.3);
    expect(profile.genreWeights[COMEDY]).toBeLessThan(-0.3);
    expect(affinity(profile, { genres: [HORROR], directors: ["Ari Aster"] })).toBeGreaterThan(0.3);
    expect(affinity(profile, { genres: [COMEDY], directors: [] })).toBeLessThan(0);
  });

  it("is neutral without data", () => {
    expect(affinity(null, { genres: [DRAMA], directors: [] })).toBe(0);
    expect(computeTasteProfile([]).ratingCount).toBe(0);
  });
});

describe("compatibility", () => {
  it("scores taste twins near the top with high confidence", () => {
    const result = computeCompatibility(side(base), side(base));
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.confidence).toBe("HIGH");
    expect(result.commonCount).toBe(30);
  });

  it("cancels out different rating habits (my 3 is your 4)", () => {
    const harsh = base.map(([id, r]) => [id, Math.max(1, r - 2)] as [number, number]);
    expect(computeCompatibility(side(base), side(harsh)).score).toBeGreaterThanOrEqual(85);
  });

  it("scores opposites near the bottom", () => {
    const opposite = base.map(([id, r]) => [id, 11 - r] as [number, number]);
    expect(computeCompatibility(side(base), side(opposite)).score).toBeLessThanOrEqual(10);
  });

  it("reports low confidence with little overlap", () => {
    const a = side([[1, 8], [2, 4], [3, 9]]);
    const b = side([[1, 7], [2, 5], [4, 6]]);
    const result = computeCompatibility(a, b);
    expect(result.confidence).toBe("LOW");
    expect(result.commonCount).toBe(2);
  });

  it("highlights shared loves and arguments", () => {
    const a = side([[1, 10], [2, 9], [3, 2], [4, 6], [5, 5], [6, 7]]);
    const b = side([[1, 9], [2, 8], [3, 9], [4, 6], [5, 5], [6, 7]]);
    const result = computeCompatibility(a, b);
    expect(result.bothLove).toEqual([1, 2]);
    expect(result.willArgue).toEqual([3]);
  });

  it("maps similarity onto 0..100 with fixed anchors", () => {
    expect(similarityToScore(-1)).toBe(0);
    expect(similarityToScore(0)).toBe(50);
    expect(similarityToScore(1)).toBe(100);
  });
});
