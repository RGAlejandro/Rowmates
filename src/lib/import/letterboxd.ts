import Papa from "papaparse";
import { strFromU8, unzipSync } from "fflate";
import { fromLetterboxd } from "@/lib/ratings";
import { InvalidExportError, toDate, toYear, type ImportKind, type NormalizedRow } from "./types";

// Letterboxd → Settings → Data → Export your data produces a ZIP with these CSVs.
const FILE_KINDS: [suffix: string, kind: ImportKind][] = [
  ["likes/films.csv", "LIKE"],
  ["diary.csv", "DIARY"],
  ["ratings.csv", "RATING"],
  ["watched.csv", "WATCHED"],
  ["watchlist.csv", "WATCHLIST"],
  ["reviews.csv", "REVIEW"],
];

export function kindForFile(path: string): ImportKind | null {
  const lower = path.toLowerCase();
  // Newer exports keep removed entries in deleted/ or orphaned/ folders: skip them.
  if (/(^|\/)(deleted|orphaned)\//.test(lower)) return null;
  const match = FILE_KINDS.find(([suffix]) => lower === suffix || lower.endsWith(`/${suffix}`));
  return match ? match[1] : null;
}

type LetterboxdRecord = Record<string, string | undefined>;

export function parseLetterboxdCsv(kind: ImportKind, text: string): NormalizedRow[] {
  const { data, meta } = Papa.parse<LetterboxdRecord>(text, { header: true, skipEmptyLines: true });
  if (!meta.fields?.includes("Name") || !meta.fields.includes("Year")) {
    throw new InvalidExportError(`Not a Letterboxd ${kind.toLowerCase()} file`);
  }
  return data
    .filter((record) => record.Name?.trim())
    .map((record) => ({
      kind,
      title: record.Name!.trim(),
      year: toYear(record.Year),
      rating: fromLetterboxd(record.Rating),
      // Only diary/review rows carry a real watch date; "Date" elsewhere is when it was added.
      watchedOn: kind === "DIARY" || kind === "REVIEW" ? toDate(record["Watched Date"]) ?? toDate(record.Date) : null,
      review: record.Review?.trim() || null,
      rewatch: record.Rewatch === "Yes",
    }));
}

export function parseLetterboxdZip(data: Uint8Array): NormalizedRow[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data, { filter: (file) => kindForFile(file.name) !== null });
  } catch {
    throw new InvalidExportError("Not a ZIP file");
  }
  const entries = Object.entries(files);
  if (entries.length === 0) throw new InvalidExportError("No Letterboxd CSVs found in the ZIP");
  return entries.flatMap(([path, bytes]) => parseLetterboxdCsv(kindForFile(path)!, strFromU8(bytes)));
}
