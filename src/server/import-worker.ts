import "server-only";
import pLimit from "p-limit";
import { db } from "@/lib/db";
import { findByImdbId, searchMovies } from "@/lib/tmdb/api";
import { externalKey, pickMatch, type MatchResult } from "@/lib/import/matcher";
import type { ImportSourceName, NormalizedRow } from "@/lib/import/types";
import type { Prisma } from "@/generated/prisma/client";
import { ensureFilm, upsertFilmSummaries } from "./films";
import { recomputeTasteProfile } from "./taste";

const LEASE_MS = 60_000;
const BATCH_SIZE = 60;
const CONCURRENCY = 6;

// ─── Leasing ────────────────────────────────────────────────────────────────

/** Atomically claim the job so concurrent triggers (after(), polling) don't double-process. */
async function acquireLease(jobId: string): Promise<boolean> {
  const now = new Date();
  const { count } = await db.importJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "RUNNING"] },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    data: { status: "RUNNING", lockedUntil: new Date(now.getTime() + LEASE_MS) },
  });
  return count === 1;
}

export function isLeaseExpired(job: { lockedUntil: Date | null }, now = new Date()) {
  return !job.lockedUntil || job.lockedUntil < now;
}

// ─── Matching ───────────────────────────────────────────────────────────────

async function matchByTitle(row: NormalizedRow): Promise<MatchResult> {
  const first = await searchMovies(row.title, 1, row.year ?? undefined);
  let results = first.results;
  let result = pickMatch(row, results);
  if (result.status !== "MATCHED" && row.year) {
    results = (await searchMovies(row.title)).results;
    result = pickMatch(row, results);
  }
  if (result.status === "MATCHED") {
    const filmId = result.filmId;
    await upsertFilmSummaries(results.filter((film) => film.id === filmId));
  }
  return result;
}

async function resolveRow(row: NormalizedRow): Promise<MatchResult> {
  if (row.imdbId) {
    const film = await findByImdbId(row.imdbId);
    if (film) {
      await upsertFilmSummaries([film]);
      return { status: "MATCHED", filmId: film.id };
    }
  }
  return matchByTitle(row);
}

/** Rows sharing an external key (same film in diary.csv and ratings.csv) are resolved once. */
async function matchGroup(source: ImportSourceName, key: string, rows: { id: string; raw: NormalizedRow }[]) {
  const ids = rows.map((r) => r.id);
  const cached = await db.externalIdMap.findUnique({ where: { source_externalKey: { source, externalKey: key } } });
  if (cached) {
    await db.importRow.updateMany({ where: { id: { in: ids } }, data: { status: "MATCHED", filmId: cached.filmId } });
    return;
  }

  let result: MatchResult;
  try {
    result = await resolveRow(rows[0].raw);
  } catch (error) {
    if ((error as { status?: number }).status === 404) result = { status: "UNMATCHED" };
    else throw error;
  }

  if (result.status === "MATCHED") {
    await db.externalIdMap.upsert({
      where: { source_externalKey: { source, externalKey: key } },
      create: { source, externalKey: key, filmId: result.filmId },
      update: {},
    });
    await db.importRow.updateMany({ where: { id: { in: ids } }, data: { status: "MATCHED", filmId: result.filmId } });
  } else if (result.status === "AMBIGUOUS") {
    await db.importRow.updateMany({
      where: { id: { in: ids } },
      data: { status: "AMBIGUOUS", candidates: result.candidates as unknown as Prisma.InputJsonValue },
    });
  } else {
    await db.importRow.updateMany({ where: { id: { in: ids } }, data: { status: "UNMATCHED" } });
  }
}

// ─── Committing ─────────────────────────────────────────────────────────────

interface Draft {
  watchedOn: string | null;
  rating: number | null;
  liked: boolean;
  review: string | null;
  isRewatch: boolean;
}

const sameDay = (date: Date | null, iso: string | null | undefined) =>
  (date ? date.toISOString().slice(0, 10) : null) === (iso ?? null);

function latest<T extends { watchedOn: string | null }>(drafts: T[]): T {
  return [...drafts].sort((a, b) => (b.watchedOn ?? "").localeCompare(a.watchedOn ?? ""))[0];
}

/** Turn MATCHED rows into diary entries and watchlist items, merging the CSVs per film. */
export async function commitMatchedRows(jobId: string, userId: string, source: ImportSourceName) {
  const rows = await db.importRow.findMany({ where: { jobId, status: "MATCHED" }, select: { id: true, raw: true, filmId: true } });
  if (rows.length === 0) return;

  const filmIds = [...new Set(rows.map((r) => r.filmId!))];
  const [existing, existingWatchlist] = await Promise.all([
    db.logEntry.findMany({ where: { userId, filmId: { in: filmIds } }, select: { id: true, filmId: true, watchedOn: true, review: true } }),
    db.watchlistItem.findMany({ where: { userId, filmId: { in: filmIds } }, select: { filmId: true } }),
  ]);
  const onWatchlist = new Set(existingWatchlist.map((w) => w.filmId));

  const newLogs: Prisma.LogEntryCreateManyInput[] = [];
  const likeUpdates: string[] = [];
  const watchlistAdds: number[] = [];

  const byFilm = new Map<number, NormalizedRow[]>();
  for (const row of rows) byFilm.set(row.filmId!, [...(byFilm.get(row.filmId!) ?? []), row.raw as unknown as NormalizedRow]);

  for (const [filmId, data] of byFilm) {
    const prior = existing.filter((e) => e.filmId === filmId);
    const drafts: Draft[] = [];

    for (const d of data.filter((r) => r.kind === "DIARY")) {
      if (prior.some((p) => sameDay(p.watchedOn, d.watchedOn))) continue; // already imported earlier
      if (drafts.some((x) => x.watchedOn === (d.watchedOn ?? null) && x.rating === (d.rating ?? null))) continue;
      drafts.push({ watchedOn: d.watchedOn ?? null, rating: d.rating ?? null, liked: false, review: null, isRewatch: !!d.rewatch });
    }

    for (const r of data.filter((x) => x.kind === "REVIEW" && x.review)) {
      const target = drafts.find((x) => x.watchedOn === (r.watchedOn ?? null));
      if (target) {
        target.review = r.review ?? null;
        target.rating ??= r.rating ?? null;
      } else if (!prior.some((p) => sameDay(p.watchedOn, r.watchedOn) && p.review)) {
        drafts.push({ watchedOn: r.watchedOn ?? null, rating: r.rating ?? null, liked: false, review: r.review ?? null, isRewatch: !!r.rewatch });
      }
    }

    const ratingRow = data.find((r) => r.kind === "RATING" && r.rating);
    if (ratingRow) {
      if (drafts.length === 0 && prior.length === 0) {
        drafts.push({ watchedOn: ratingRow.watchedOn ?? null, rating: ratingRow.rating ?? null, liked: false, review: null, isRewatch: false });
      } else if (drafts.length > 0 && drafts.every((x) => x.rating === null)) {
        latest(drafts).rating = ratingRow.rating ?? null;
      }
    }

    if (data.some((r) => r.kind === "WATCHED") && drafts.length === 0 && prior.length === 0) {
      drafts.push({ watchedOn: null, rating: null, liked: false, review: null, isRewatch: false });
    }

    if (data.some((r) => r.kind === "LIKE")) {
      if (drafts.length > 0) latest(drafts).liked = true;
      else if (prior.length > 0) likeUpdates.push(prior[0].id);
      else drafts.push({ watchedOn: null, rating: null, liked: true, review: null, isRewatch: false });
    }

    if (data.some((r) => r.kind === "WATCHLIST") && drafts.length === 0 && prior.length === 0 && !onWatchlist.has(filmId)) {
      watchlistAdds.push(filmId);
    }

    for (const draft of drafts) {
      newLogs.push({
        userId,
        filmId,
        source,
        watchedOn: draft.watchedOn ? new Date(`${draft.watchedOn}T00:00:00Z`) : null,
        rating: draft.rating,
        liked: draft.liked,
        review: draft.review,
        isRewatch: draft.isRewatch,
      });
    }
  }

  await db.$transaction([
    db.logEntry.createMany({ data: newLogs }),
    db.watchlistItem.createMany({ data: watchlistAdds.map((filmId) => ({ userId, filmId })), skipDuplicates: true }),
    db.logEntry.updateMany({ where: { id: { in: likeUpdates } }, data: { liked: true } }),
    db.importRow.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { status: "IMPORTED" } }),
  ]);
}

/** Recount rows and settle the job's final status. */
export async function finalizeJob(jobId: string) {
  const counts = await db.importRow.groupBy({ by: ["status"], where: { jobId }, _count: { _all: true } });
  const count = (status: string) => counts.find((c) => c.status === status)?._count._all ?? 0;
  const pending = count("PENDING") + count("MATCHED");
  const ambiguous = count("AMBIGUOUS");
  await db.importJob.update({
    where: { id: jobId },
    data: {
      importedRows: count("IMPORTED"),
      ambiguousRows: ambiguous,
      unmatchedRows: count("UNMATCHED"),
      status: pending > 0 ? "RUNNING" : ambiguous > 0 ? "NEEDS_REVIEW" : "DONE",
      finishedAt: pending > 0 ? null : new Date(),
      lockedUntil: null,
    },
  });
}

/** Fill in runtime/directors for imported films that only have search-result data. */
async function backfillFilmDetails(filmIds: number[], deadline: number) {
  const missing = await db.film.findMany({
    where: { tmdbId: { in: filmIds }, detailsFetchedAt: null },
    select: { tmdbId: true },
    take: 400,
  });
  const limit = pLimit(4);
  await Promise.all(
    missing.map(({ tmdbId }) =>
      limit(async () => {
        if (Date.now() > deadline) return;
        await ensureFilm(tmdbId).catch(() => undefined);
      }),
    ),
  );
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * Process a slice of an import job within a time budget. Safe to call repeatedly
 * (from after() and from the status poll); the lease makes it single-flight.
 */
export async function processImportJob(jobId: string, budgetMs = 45_000) {
  if (!(await acquireLease(jobId))) return;
  const job = await db.importJob.findUniqueOrThrow({ where: { id: jobId } });
  const started = Date.now();
  const limit = pLimit(CONCURRENCY);

  try {
    while (Date.now() - started < budgetMs) {
      const rows = await db.importRow.findMany({ where: { jobId, status: "PENDING" }, take: BATCH_SIZE, select: { id: true, raw: true } });
      if (rows.length === 0) break;

      const groups = new Map<string, { id: string; raw: NormalizedRow }[]>();
      for (const row of rows) {
        const raw = row.raw as unknown as NormalizedRow;
        const key = externalKey(raw, job.source);
        groups.set(key, [...(groups.get(key) ?? []), { id: row.id, raw }]);
      }
      await Promise.all([...groups.entries()].map(([key, group]) => limit(() => matchGroup(job.source, key, group))));
      await db.importJob.update({ where: { id: jobId }, data: { lockedUntil: new Date(Date.now() + LEASE_MS) } });
    }

    const pending = await db.importRow.count({ where: { jobId, status: "PENDING" } });
    if (pending > 0) {
      await db.importJob.update({ where: { id: jobId }, data: { lockedUntil: null } });
      return;
    }

    await commitMatchedRows(jobId, job.userId, job.source);
    await finalizeJob(jobId);
    const filmIds = await db.importRow.findMany({ where: { jobId, filmId: { not: null } }, select: { filmId: true }, distinct: ["filmId"] });
    await backfillFilmDetails(filmIds.map((r) => r.filmId!), started + budgetMs + 30_000);
    await recomputeTasteProfile(job.userId);
  } catch (error) {
    console.error("Import failed", jobId, error);
    await db.importJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: String(error).slice(0, 500), lockedUntil: null },
    });
  }
}
