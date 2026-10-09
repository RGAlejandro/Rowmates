import "server-only";
import { unstable_rethrow } from "next/navigation";
import { t } from "@/i18n";

/** An expected failure whose message is safe to show to the user. */
export class UserError extends Error {}

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Wraps a Server Action body: returns { ok, data } or a user-facing error.
 * Next.js control-flow errors (redirect, notFound) are rethrown untouched.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: t("common.somethingWrong") };
  }
}
