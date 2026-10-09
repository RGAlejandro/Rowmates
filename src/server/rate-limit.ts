import "server-only";
import { t } from "@/i18n";
import { UserError } from "./action";

// Fixed-window limiter kept in process memory. Good enough for a single
// instance; swap for Upstash Ratelimit (or similar) before scaling out.
const windows = new Map<string, { start: number; count: number }>();

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || now - entry.start > windowMs) {
    windows.set(key, { start: now, count: 1 });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) throw new UserError(t("errors.rateLimited"));
}
