import { en } from "./en";

// Minimal typed i18n: every user-facing string lives in `en.ts`, keyed by dot
// paths. Interpolation uses `{name}` (same syntax as next-intl/ICU), so moving
// to a full i18n library later is a mechanical change.

type Messages = typeof en;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

type Vars = Record<string, string | number>;

function lookup(key: string): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en);
  if (typeof value !== "string") throw new Error(`Missing message: ${key}`);
  return value;
}

export function t(key: MessageKey, vars?: Vars): string {
  const message = lookup(key);
  return vars ? message.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`)) : message;
}

/** Plural helper for keys stored as `{ one, other }` pairs: plural("common.films", 3). */
export function plural(key: PluralKey, count: number, vars?: Vars): string {
  const form = count === 1 ? "one" : "other";
  return t(`${key}.${form}` as MessageKey, { count, ...vars });
}

type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}.one` ? Base : never;
}[MessageKey];
