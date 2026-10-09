import { describe, expect, it } from "vitest";
import { canForceReveal, canRate, pendingRaters, revealSummary, shouldAutoReveal, type RevealState } from "./reveal";

const now = new Date("2026-10-09T22:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

function state(overrides: Partial<RevealState> = {}): RevealState {
  return {
    status: "WATCHED",
    scheduledAt: hoursAgo(3),
    watchedAt: hoursAgo(1),
    attendees: [
      { userId: "ana", rsvp: "GOING" },
      { userId: "leo", rsvp: "GOING" },
      { userId: "maya", rsvp: "DECLINED" },
    ],
    raters: [],
    ...overrides,
  };
}

describe("blind reveal", () => {
  it("waits for everyone who said they were going", () => {
    const s = state({ raters: ["ana"] });
    expect(pendingRaters(s)).toEqual(["leo"]);
    expect(shouldAutoReveal(s, now)).toBe(false);
  });

  it("reveals once everyone going has rated", () => {
    expect(shouldAutoReveal(state({ raters: ["ana", "leo"] }), now)).toBe(true);
  });

  it("counts people who rated without RSVPing", () => {
    const s = state({ raters: ["ana", "leo", "maya"] });
    expect(pendingRaters(s)).toEqual([]);
    expect(shouldAutoReveal(s, now)).toBe(true);
  });

  it("never reveals a single rating, even after 48 hours", () => {
    expect(shouldAutoReveal(state({ raters: ["ana"], watchedAt: hoursAgo(72) }), now)).toBe(false);
  });

  it("auto-reveals after 48 hours with at least two ratings", () => {
    const s = state({
      attendees: [...state().attendees, { userId: "sam", rsvp: "GOING" }],
      raters: ["ana", "leo"],
      watchedAt: hoursAgo(49),
    });
    expect(pendingRaters(s)).toEqual(["sam"]);
    expect(shouldAutoReveal(s, now)).toBe(true);
  });

  it("does not touch revealed or cancelled screenings", () => {
    expect(shouldAutoReveal(state({ status: "REVEALED", raters: ["ana", "leo"] }), now)).toBe(false);
    expect(shouldAutoReveal(state({ status: "CANCELLED", raters: ["ana", "leo"] }), now)).toBe(false);
  });

  it("only lets people rate after the film was watched or its time has passed", () => {
    expect(canRate(state({ status: "PLANNED", scheduledAt: new Date(now.getTime() + 3600_000) }), now)).toBe(false);
    expect(canRate(state({ status: "PLANNED", scheduledAt: hoursAgo(1) }), now)).toBe(true);
    expect(canRate(state(), now)).toBe(true);
  });

  it("lets only the host force a reveal, and only with two ratings", () => {
    expect(canForceReveal(state({ raters: ["ana", "leo"] }), "ana", "ana")).toBe(true);
    expect(canForceReveal(state({ raters: ["ana", "leo"] }), "leo", "ana")).toBe(false);
    expect(canForceReveal(state({ raters: ["ana"] }), "ana", "ana")).toBe(false);
  });
});

describe("reveal summary", () => {
  it("labels divisive screenings and names the extremes", () => {
    const summary = revealSummary([
      { userId: "ana", rating: 10 },
      { userId: "leo", rating: 3 },
      { userId: "maya", rating: 9 },
      { userId: "sam", rating: 2 },
    ]);
    expect(summary.label).toBe("DIVISIVE");
    expect(summary.biggestFans).toEqual(["ana"]);
    expect(summary.toughestCritics).toEqual(["sam"]);
    expect(summary.average).toBe(6);
  });

  it("labels unanimous screenings and has no extremes when everyone agrees", () => {
    const summary = revealSummary([
      { userId: "ana", rating: 8 },
      { userId: "leo", rating: 8 },
    ]);
    expect(summary.label).toBe("UNANIMOUS");
    expect(summary.biggestFans).toEqual([]);
  });
});
