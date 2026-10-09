import { after, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLeaseExpired, processImportJob } from "@/server/import-worker";

/** Import progress for the polling UI. Also resumes a stalled job (e.g. after a function timeout). */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/import/[jobId]">) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== viewer.id) return Response.json({ error: "not found" }, { status: 404 });

  const pending = await db.importRow.count({ where: { jobId, status: "PENDING" } });
  if ((job.status === "PENDING" || job.status === "RUNNING") && isLeaseExpired(job)) {
    after(() => processImportJob(jobId));
  }

  return Response.json({
    status: job.status,
    totalRows: job.totalRows,
    processed: job.totalRows - pending,
    importedRows: job.importedRows,
    ambiguousRows: job.ambiguousRows,
    unmatchedRows: job.unmatchedRows,
  });
}
