"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { t } from "@/i18n";

interface Status {
  status: "PENDING" | "RUNNING" | "NEEDS_REVIEW" | "DONE" | "FAILED";
  totalRows: number;
  processed: number;
}

/** Polls the job until it settles, then refreshes the server-rendered page. */
export function ImportProgress({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["import", jobId],
    queryFn: async () => (await (await fetch(`/api/import/${jobId}`)).json()) as Status,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" || !status ? 1500 : false;
    },
  });

  const settled = data && data.status !== "PENDING" && data.status !== "RUNNING";
  useEffect(() => {
    if (settled) router.refresh();
  }, [settled, router]);

  const total = data?.totalRows ?? 0;
  const processed = data?.processed ?? 0;
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
      <p className="text-sm">{t("importer.matching")}</p>
      <Progress value={total ? (processed / total) * 100 : 5} />
      <p className="text-xs text-muted-foreground">{t("importer.progress", { done: processed, total })}</p>
    </div>
  );
}
