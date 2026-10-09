"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { externalKey } from "@/lib/import/matcher";
import type { NormalizedRow } from "@/lib/import/types";
import { t } from "@/i18n";
import { ensureFilm } from "@/server/films";
import { commitMatchedRows, finalizeJob, processImportJob } from "@/server/import-worker";
import { recomputeTasteProfile } from "@/server/taste";
import { runAction, UserError } from "@/server/action";

const MAX_ROWS_PER_JOB = 25_000;
const MAX_ROWS_PER_CHUNK = 500;

const rowSchema = z.object({
  kind: z.enum(["DIARY", "RATING", "WATCHED", "WATCHLIST", "REVIEW", "LIKE"]),
  title: z.string().trim().min(1).max(300),
  year: z.number().int().min(1870).max(2100).nullable(),
  imdbId: z.string().regex(/^tt\d+$/).optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  watchedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  review: z.string().max(20_000).nullable().optional(),
  rewatch: z.boolean().optional(),
});

async function ownJob(jobId: string, userId: string) {
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== userId) throw new UserError(t("errors.forbidden"));
  return job;
}

export async function createImportJob(source: "LETTERBOXD" | "IMDB", totalRows: number) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const total = z.number().int().min(1).max(MAX_ROWS_PER_JOB).parse(totalRows);
    const job = await db.importJob.create({ data: { userId: viewer.id, source: z.enum(["LETTERBOXD", "IMDB"]).parse(source), totalRows: total } });
    return { jobId: job.id };
  });
}

export async function addImportRows(jobId: string, rows: NormalizedRow[]) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const job = await ownJob(jobId, viewer.id);
    if (job.status !== "PENDING") throw new UserError(t("common.somethingWrong"));
    const data = z.array(rowSchema).max(MAX_ROWS_PER_CHUNK).parse(rows);
    await db.importRow.createMany({ data: data.map((raw) => ({ jobId, kind: raw.kind, raw })) });
    return null;
  });
}

export async function startImport(jobId: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    await ownJob(jobId, viewer.id);
    after(() => processImportJob(jobId));
    return null;
  });
}

/** Manual review of an ambiguous row: pick the right film (or skip it). */
export async function resolveImportRow(rowId: string, tmdbId: number | null) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const row = await db.importRow.findUnique({ where: { id: rowId }, include: { job: true } });
    if (!row || row.job.userId !== viewer.id) throw new UserError(t("errors.forbidden"));

    if (tmdbId === null) {
      await db.importRow.update({ where: { id: rowId }, data: { status: "SKIPPED" } });
    } else {
      const film = await ensureFilm(z.number().int().positive().parse(tmdbId));
      const key = externalKey(row.raw as unknown as NormalizedRow, row.job.source);
      await db.externalIdMap.upsert({
        where: { source_externalKey: { source: row.job.source, externalKey: key } },
        create: { source: row.job.source, externalKey: key, filmId: film.tmdbId },
        update: { filmId: film.tmdbId },
      });
      await db.importRow.update({ where: { id: rowId }, data: { status: "MATCHED", filmId: film.tmdbId } });
      await commitMatchedRows(row.jobId, viewer.id, row.job.source);
      after(() => recomputeTasteProfile(viewer.id));
    }
    await finalizeJob(row.jobId);
    refresh();
    return null;
  });
}
