import Papa from "papaparse";
import { fromTenPoint } from "@/lib/ratings";
import { InvalidExportError, toDate, toYear, type NormalizedRow } from "./types";

type ImdbRecord = Record<string, string | undefined>;

const MOVIE_TYPES = /^(movie|tv ?movie|tvmovie)$/i;

/** IMDb "Your ratings" or watchlist export (CSV). Watchlists are detected by the Position column. */
export function parseImdbCsv(text: string): NormalizedRow[] {
  const { data, meta } = Papa.parse<ImdbRecord>(text, { header: true, skipEmptyLines: true });
  const fields = meta.fields ?? [];
  if (!fields.includes("Const") || !fields.includes("Title")) throw new InvalidExportError("Not an IMDb export");
  const isWatchlist = fields.includes("Position");

  return data
    .filter((record) => record.Const?.startsWith("tt") && (!record["Title Type"] || MOVIE_TYPES.test(record["Title Type"])))
    .map((record) => ({
      kind: isWatchlist ? "WATCHLIST" : "RATING",
      title: record.Title!.trim(),
      year: toYear(record.Year),
      imdbId: record.Const,
      rating: isWatchlist ? null : fromTenPoint(record["Your Rating"]),
      watchedOn: isWatchlist ? null : toDate(record["Date Rated"]),
    }));
}
