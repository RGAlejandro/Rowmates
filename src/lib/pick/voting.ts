export type VoteValue = "YES" | "MAYBE" | "NO" | "VETO";

export interface CandidateRef {
  filmId: number;
  score: number;
  position: number;
}

export interface VoteRef {
  filmId: number;
  userId: string;
  value: VoteValue;
}

export interface Tally {
  filmId: number;
  yes: number;
  maybe: number;
  no: number;
  vetoed: boolean;
  points: number;
}

const POINTS: Record<VoteValue, number> = { YES: 2, MAYBE: 1, NO: 0, VETO: 0 };

/** Yes = 2, Maybe = 1. Any veto knocks a film out. Ties go to the higher pre-vote score. */
export function tallyVotes(candidates: CandidateRef[], votes: VoteRef[]): { tallies: Tally[]; winner: number | null } {
  const tallies = candidates.map<Tally>((c) => {
    const forFilm = votes.filter((v) => v.filmId === c.filmId);
    return {
      filmId: c.filmId,
      yes: forFilm.filter((v) => v.value === "YES").length,
      maybe: forFilm.filter((v) => v.value === "MAYBE").length,
      no: forFilm.filter((v) => v.value === "NO").length,
      vetoed: forFilm.some((v) => v.value === "VETO"),
      points: forFilm.reduce((sum, v) => sum + POINTS[v.value], 0),
    };
  });

  const byFilm = new Map(candidates.map((c) => [c.filmId, c]));
  const ranked = tallies
    .filter((t) => !t.vetoed && t.points > 0)
    .sort((a, b) => {
      const ca = byFilm.get(a.filmId)!;
      const cb = byFilm.get(b.filmId)!;
      return b.points - a.points || cb.score - ca.score || ca.position - cb.position;
    });

  return { tallies, winner: ranked[0]?.filmId ?? null };
}

export function hasUsedVeto(votes: VoteRef[], userId: string): boolean {
  return votes.some((v) => v.userId === userId && v.value === "VETO");
}
