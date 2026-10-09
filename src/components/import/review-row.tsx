"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Poster } from "@/components/film/poster";
import type { MatchCandidate } from "@/lib/import/matcher";
import { resolveImportRow } from "@/server/actions/import";
import { t } from "@/i18n";

export function ReviewRow({ rowId, title, year, candidates }: { rowId: string; title: string; year: number | null; candidates: MatchCandidate[] }) {
  const [pending, startTransition] = useTransition();

  function resolve(tmdbId: number | null) {
    startTransition(async () => {
      const result = await resolveImportRow(rowId, tmdbId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4" aria-busy={pending}>
      <p className="font-medium">
        {title} <span className="text-muted-foreground">{year}</span>
      </p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {candidates.map((candidate) => (
          <button
            key={candidate.tmdbId}
            type="button"
            disabled={pending}
            onClick={() => resolve(candidate.tmdbId)}
            className="w-24 shrink-0 text-left"
          >
            <Poster tmdbId={candidate.tmdbId} title={candidate.title} year={candidate.year} posterPath={candidate.posterPath} size="fill" />
            <span className="mt-1 block truncate text-xs">{candidate.title}</span>
            <span className="text-xs text-muted-foreground">{candidate.year}</span>
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-2" disabled={pending} onClick={() => resolve(null)}>
        {t("importer.notListed")}
      </Button>
    </li>
  );
}
