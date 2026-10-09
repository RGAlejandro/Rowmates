import "server-only";
import { env } from "@/lib/env";
import { mockTmdb } from "./mock";

const BASE_URL = "https://api.themoviedb.org/3";
const MAX_RETRIES = 3;

export class TmdbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Raw TMDB v3 GET with retries on rate limiting. Callers add caching. */
export async function tmdbFetch<T>(path: string, params: Params = {}): Promise<T> {
  if (env.tmdbMock) return mockTmdb<T>(path, params);

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.TMDB_API_READ_TOKEN}`, Accept: "application/json" },
    });
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("retry-after")) || 1;
      await sleep(retryAfter * 1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new TmdbError(res.status, `TMDB ${path} failed with status ${res.status}`);
    return (await res.json()) as T;
  }
}
