import type { Metadata } from "next";
import Link from "next/link";
import { ImportUploader } from "@/components/import/import-uploader";
import { PageTitle, SectionHeader } from "@/components/ui-extras";
import { Badge } from "@/components/ui/badge";
import { requireViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("importer.title") };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function ImportPage() {
  const viewer = await requireViewer();
  const jobs = await db.importJob.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageTitle title={t("importer.title")} subtitle={t("importer.subtitle")} />
      <ImportUploader />
      {jobs.length > 0 && (
        <section>
          <SectionHeader title={t("importer.history")} />
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link href={`/import/${job.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/50">
                  <span>
                    <span className="font-medium">{job.source === "IMDB" ? t("importer.imdb") : t("importer.letterboxd")}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{dateFormat.format(job.createdAt)}</span>
                  </span>
                  <Badge variant={job.status === "DONE" ? "secondary" : "outline"}>{job.status.replace("_", " ").toLowerCase()}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
