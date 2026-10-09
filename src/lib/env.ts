import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  TMDB_API_READ_TOKEN: z.string().min(20).optional(),
  TMDB_MOCK: z.enum(["0", "1"]).optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = {
  ...parsed.data,
  /** Serve TMDB data from local fixtures: forced in tests, automatic when no token is configured. */
  tmdbMock: parsed.data.TMDB_MOCK === "1" || !parsed.data.TMDB_API_READ_TOKEN,
};
