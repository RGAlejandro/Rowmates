import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, SectionHeader } from "@/components/ui-extras";
import { ImportProgress } from "@/components/import/import-progress";
import { ReviewRow } from "@/components/import/review-row";
import { requireViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MatchCandidate } from "@/lib/import/matcher";
import type { NormalizedRow } from "@/lib/import/types";
import { t } from "@/i18n";

export default async function ImportJobPage({ params }: PageProps<"/import/[jobId]">) {
  const viewer = await requireViewer();
  const { jobId } = await params;
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== viewer.id) notFound();

  const running = job.status === "PENDING" || job.status === "RUNNING";
  const ambiguous = running
    ? []
    : await db.importRow.findMany({ where: { jobId, status: "AMBIGUOUS" }, take: 50, orderBy: { createdAt: "asc" } });
  const skipped = job.unmatchedRows + (await db.importRow.count({ where: { jobId, status: "SKIPPED" } }));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageTitle title={t("importer.title")} />
      {running ? <ImportProgress jobId={jobId} /> : null}

      {job.status === "FAILED" ? <p className="text-destructive">{t("common.somethingWrong")}</p> : null}

      {ambiguous.length > 0 && (
        <section>
          <SectionHeader title={t("importer.review")} />
          <p className="mb-4 text-sm text-muted-foreground">{t("importer.reviewBody")}</p>
          <ul className="space-y-3">
            {ambiguous.map((row) => {
              const raw = row.raw as unknown as NormalizedRow;
              return (
                <ReviewRow key={row.id} rowId={row.id} title={raw.title} year={raw.year} candidates={(row.candidates ?? []) as unknown as MatchCandidate[]} />
              );
            })}
          </ul>
        </section>
      )}

      {job.status === "DONE" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <h2 className="marquee text-3xl">{t("importer.doneTitle")}</h2>
          <p className="text-muted-foreground">{t("importer.doneBody", { imported: job.importedRows, skipped })}</p>
          <Button asChild>
            <Link href={`/u/${viewer.username}`}>{t("importer.goProfile")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
