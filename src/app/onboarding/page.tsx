import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMostVoted, getRegions } from "@/lib/tmdb/api";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("onboarding.title") };

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  if (viewer.onboardedAt) redirect("/home");

  const [regions, first, second, user] = await Promise.all([
    getRegions(),
    getMostVoted(1),
    getMostVoted(2),
    db.user.findUniqueOrThrow({
      where: { id: viewer.id },
      select: {
        services: { select: { providerId: true, providerName: true, logoPath: true } },
        logs: { where: { rating: { not: null }, watchedOn: null, screeningId: null }, select: { filmId: true, rating: true } },
      },
    }),
  ]);

  const seen = new Set<number>();
  const films = [...first.results, ...second.results]
    .filter((film) => !seen.has(film.id) && seen.add(film.id))
    .slice(0, 40)
    .map((film) => ({
      tmdbId: film.id,
      title: film.title,
      year: Number(film.release_date?.slice(0, 4)) || null,
      posterPath: film.poster_path,
    }));

  return (
    <OnboardingFlow
      initial={{
        username: viewer.username,
        displayName: viewer.displayName,
        region: viewer.region,
        services: user.services.map((s) => ({ id: s.providerId, name: s.providerName, logoPath: s.logoPath })),
        ratings: Object.fromEntries(user.logs.map((l) => [l.filmId, l.rating!])),
      }}
      regions={regions.map((r) => ({ code: r.iso_3166_1, name: r.english_name }))}
      films={films}
    />
  );
}
