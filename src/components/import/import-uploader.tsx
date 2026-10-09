"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { parseLetterboxdCsv, parseLetterboxdZip, kindForFile } from "@/lib/import/letterboxd";
import { parseImdbCsv } from "@/lib/import/imdb";
import { InvalidExportError, type ImportSourceName, type NormalizedRow } from "@/lib/import/types";
import { addImportRows, createImportJob, startImport } from "@/server/actions/import";
import { t } from "@/i18n";

const CHUNK = 500;

async function parseFile(source: ImportSourceName, file: File): Promise<NormalizedRow[]> {
  if (source === "IMDB") return parseImdbCsv(await file.text());
  if (file.name.toLowerCase().endsWith(".zip")) return parseLetterboxdZip(new Uint8Array(await file.arrayBuffer()));
  const kind = kindForFile(file.name.toLowerCase());
  if (!kind) throw new InvalidExportError("Unknown Letterboxd file");
  return parseLetterboxdCsv(kind, await file.text());
}

/** Parses the export in the browser, then uploads normalized rows in chunks. */
export function ImportUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<ImportSourceName>("LETTERBOXD");
  const [phase, setPhase] = useState<"idle" | "parsing" | "uploading">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function handle(file: File) {
    try {
      setPhase("parsing");
      const rows = await parseFile(source, file);
      if (rows.length === 0) throw new InvalidExportError("Empty export");

      const created = await createImportJob(source, rows.length);
      if (!created.ok) throw new Error(created.error);
      const { jobId } = created.data;

      setPhase("uploading");
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const result = await addImportRows(jobId, chunk);
        if (!result.ok) throw new Error(result.error);
        setProgress({ done: Math.min(i + CHUNK, rows.length), total: rows.length });
      }
      await startImport(jobId);
      router.push(`/import/${jobId}`);
    } catch (error) {
      const label = source === "IMDB" ? t("importer.imdb") : t("importer.letterboxd");
      toast.error(error instanceof InvalidExportError ? t("importer.invalidFile", { source: label }) : t("common.somethingWrong"));
      setPhase("idle");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const busy = phase !== "idle";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-2">
        {(["LETTERBOXD", "IMDB"] as const).map((option) => (
          <button
            key={option}
            type="button"
            disabled={busy}
            onClick={() => setSource(option)}
            aria-pressed={source === option}
            className={cn(
              "rounded-xl border border-border p-3 text-left transition-colors",
              source === option && "border-primary bg-primary/10",
            )}
          >
            <span className="font-semibold">{option === "LETTERBOXD" ? t("importer.letterboxd") : t("importer.imdb")}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{source === "LETTERBOXD" ? t("importer.letterboxdHow") : t("importer.imdbHow")}</p>

      <input
        ref={input}
        type="file"
        accept={source === "LETTERBOXD" ? ".zip,.csv" : ".csv"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
        }}
      />

      {busy ? (
        <div className="mt-5 space-y-2">
          <p className="text-sm">
            {phase === "parsing" ? t("importer.parsing") : t("importer.uploading", { done: progress.done, total: progress.total })}
          </p>
          <Progress value={progress.total ? (progress.done / progress.total) * 100 : 10} />
        </div>
      ) : (
        <Button className="mt-5" size="lg" onClick={() => input.current?.click()}>
          <FileUp /> {t("importer.choose")}
        </Button>
      )}
    </div>
  );
}
