export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const RESERVED = new Set([
  "admin", "api", "app", "circles", "compat", "film", "films", "home", "import", "join",
  "notifications", "onboarding", "pick", "rowmates", "screenings", "search", "settings",
  "sign-in", "sign-up", "support", "u",
]);

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value) && !RESERVED.has(value);
}

/** Best-effort conversion of a name or email handle into a valid username. */
export function slugifyUsername(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  const padded = slug.length >= 3 ? slug : `${slug}_fan`.slice(0, 20);
  return RESERVED.has(padded) ? `${padded}_1` : padded;
}
