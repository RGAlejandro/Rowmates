"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { isValidUsername } from "@/lib/usernames";
import { t } from "@/i18n";
import { ensureFilm } from "@/server/films";
import { recomputeTasteProfile } from "@/server/taste";
import { runAction, UserError } from "@/server/action";

const profileSchema = z.object({
  username: z.string().trim().toLowerCase(),
  displayName: z.string().trim().min(1).max(50),
});

export async function saveProfile(input: z.input<typeof profileSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = profileSchema.parse(input);
    if (!isValidUsername(data.username)) throw new UserError(t("onboarding.usernameInvalid"));
    const taken = await db.user.findFirst({ where: { username: data.username, NOT: { id: viewer.id } }, select: { id: true } });
    if (taken) throw new UserError(t("onboarding.usernameTaken"));
    await db.user.update({ where: { id: viewer.id }, data });
    return null;
  });
}

const regionSchema = z.string().regex(/^[A-Z]{2}$/);

export async function saveRegion(region: string) {
  return runAction(async () => {
    const viewer = await requireViewer();
    await db.user.update({ where: { id: viewer.id }, data: { region: regionSchema.parse(region) } });
    return null;
  });
}

const servicesSchema = z
  .array(z.object({ id: z.number().int().positive(), name: z.string().min(1).max(80), logoPath: z.string().nullable() }))
  .max(40);

export async function saveServices(services: z.input<typeof servicesSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = servicesSchema.parse(services);
    await db.$transaction([
      db.userService.deleteMany({ where: { userId: viewer.id } }),
      db.userService.createMany({
        data: data.map((s) => ({ userId: viewer.id, providerId: s.id, providerName: s.name, logoPath: s.logoPath })),
      }),
    ]);
    return null;
  });
}

const quickRateSchema = z.object({
  tmdbId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).nullable(),
});

/** Onboarding/compat quick rating: one undated diary entry per film, updated in place. */
export async function quickRate(input: z.input<typeof quickRateSchema>) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const { tmdbId, rating } = quickRateSchema.parse(input);
    const existing = await db.logEntry.findFirst({
      where: { userId: viewer.id, filmId: tmdbId, watchedOn: null, screeningId: null, review: null },
      select: { id: true },
    });
    if (rating === null) {
      if (existing) await db.logEntry.delete({ where: { id: existing.id } });
    } else if (existing) {
      await db.logEntry.update({ where: { id: existing.id }, data: { rating } });
    } else {
      await ensureFilm(tmdbId);
      await db.logEntry.create({ data: { userId: viewer.id, filmId: tmdbId, rating } });
    }
    after(() => recomputeTasteProfile(viewer.id));
    return null;
  });
}

export async function finishOnboarding() {
  return runAction(async () => {
    const viewer = await requireViewer();
    await db.user.update({ where: { id: viewer.id }, data: { onboardedAt: new Date() } });
    await recomputeTasteProfile(viewer.id);
    return null;
  });
}
