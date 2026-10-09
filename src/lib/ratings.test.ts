import { describe, expect, it } from "vitest";
import { formatAverage, formatStars, fromLetterboxd, fromTenPoint, isValidRating, starsToRating } from "./ratings";

describe("ratings", () => {
  it("maps Letterboxd half-star values onto 1..10", () => {
    expect(fromLetterboxd("0.5")).toBe(1);
    expect(fromLetterboxd("3.5")).toBe(7);
    expect(fromLetterboxd("5")).toBe(10);
    expect(fromLetterboxd("")).toBeNull();
    expect(fromLetterboxd(undefined)).toBeNull();
  });

  it("keeps 10-point scales as they are and rejects out-of-range values", () => {
    expect(fromTenPoint("8")).toBe(8);
    expect(fromTenPoint("0")).toBeNull();
    expect(fromTenPoint("11")).toBeNull();
  });

  it("validates storage values", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(10)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(7.5)).toBe(false);
    expect(starsToRating(4.5)).toBe(9);
  });

  it("formats stars and averages", () => {
    expect(formatStars(7)).toBe("★★★½");
    expect(formatStars(10)).toBe("★★★★★");
    expect(formatAverage([8, 9])).toBe("4.3");
    expect(formatAverage([])).toBe("–");
  });
});
