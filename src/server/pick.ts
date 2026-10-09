import "server-only";
import pLimit from "p-limit";
import { db } from "@/lib/db";
import { discoverMovies, getRecommendations, getWatchProviders } from "@/lib/tmdb/api";
import { scoreCandidates, type PickFilmInput, type PickFilters, type PickParticipantInput, type ScoredCandidate } from "@/lib/pick/score";
import { upsertFilmSummaries } from "./films";
import { toProfile } from "./taste";

const MIN_POOL = 15;
const MAX_AVAILABILITY_LOOKUPS = 60;

/**
 * Builds the candidate deck for a Pick Night: everyone's watchlists and the circle
 * list first, topped up with TMDB recommendations seeded by the group's favorites
 * and films streaming on the group's services.
 */
export async function buildCandidates(
  circleId: string,
  participantIds: string[],
  region: string,
  filters: PickFilters,
): Promise<ScoredCandidate[]> {
  const [users, circleList, groupServices] = await Promise.all([
    db.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        displayName: true,
        tasteProfile: true,
        watchlist: { select: { filmId: true } },
        logs: { select: { filmId: true, rating: true } },
      },
    }),
    db.circleWatchlistItem.findMany({ where: { circleId }, select: { filmId: true } }),
    db.userService.findMany({ where: { userId: { in: participantIds } }, select: { providerId: true } }),
  ]);

  const participants: PickParticipantInput[] = users.map((u) => ({
    userId: u.id,
    displayName: u.displayName.split(" ")[0],
    profile: toProfile(u.tasteProfile),
    watchlist: new Set(u.watchlist.map((w) => w.filmId)),
    seen: new Set(u.logs.map((l) => l.filmId)),
  }));
  const services = new Set(groupServices.map((s) => s.providerId));
  const circleSet = new Set(circleList.map((c) => c.filmId));

  const pool = new Set<number>([...circleSet, ...participants.flatMap((p) => [...p.watchlist])]);

  if (pool.size < MIN_POOL) {
    // Seed with the group's best-loved films.
    const loved = new Map<number, number[]>();
    for (const u of users) for (const l of u.logs) if (l.rating && l.rating >= 8) loved.set(l.filmId, [...(loved.get(l.filmId) ?? []), l.rating]);
    const seeds = [...loved.entries()]
      .sort((a, b) => b[1].length - a[1].length || b[1][0] - a[1][0])
      .slice(0, 3)
      .map(([filmId]) => filmId);

    const batches = await Promise.all([
      ...seeds.map((id) => getRecommendations(id).catch(() => null)),
      discoverMovies({ genres: filters.genres, providers: [...services], region, maxRuntime: filters.maxRuntime ?? undefined }),
      discoverMovies({ genres: filters.genres, maxRuntime: filters.maxRuntime ?? undefined }),
    ]);
    const summaries = batches.flatMap((b) => b?.results ?? []);
    await upsertFilmSummaries(summaries);
    for (const s of summaries) pool.add(s.id);
  }

  const films = await db.film.findMany({
    where: { tmdbId: { in: [...pool] } },
    select: { tmdbId: true, genres: true, directors: true, runtime: true, voteAverage: true },
  });

  // Availability only matters for films still in the running; cap lookups for large pools.
  const limit = pLimit(8);
  const lookups = films
    .filter((f) => filters.allowRewatch || !participants.some((p) => p.seen.has(f.tmdbId)))
    .slice(0, MAX_AVAILABILITY_LOOKUPS);
  const availability = new Map<number, { id: number; name: string }[]>();
  await Promise.all(
    lookups.map((film) =>
      limit(async () => {
        const providers = await getWatchProviders(film.tmdbId, region).catch(() => null);
        availability.set(film.tmdbId, (providers?.flatrate ?? []).map((p) => ({ id: p.provider_id, name: p.provider_name })));
      }),
    ),
  );

  const inputs: PickFilmInput[] = films.map((film) => ({
    filmId: film.tmdbId,
    genres: film.genres,
    directors: film.directors,
    runtime: film.runtime,
    voteAverage: film.voteAverage,
    onCircleWatchlist: circleSet.has(film.tmdbId),
    streaming: availability.get(film.tmdbId) ?? null,
  }));

  return scoreCandidates(participants, inputs, filters, services);
}
