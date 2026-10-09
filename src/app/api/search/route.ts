import type { NextRequest } from "next/server";
import { searchMovies } from "@/lib/tmdb/api";

export interface SearchHit {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

/** Lightweight film search for client-side pickers (favorites, watchlists, screenings). */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });
  const data = await searchMovies(query.slice(0, 100));
  const results: SearchHit[] = data.results.slice(0, 10).map((film) => ({
    tmdbId: film.id,
    title: film.title,
    year: Number(film.release_date?.slice(0, 4)) || null,
    posterPath: film.poster_path,
  }));
  return Response.json({ results });
}
