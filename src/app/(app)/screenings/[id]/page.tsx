import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Popcorn } from "lucide-react";
import { Poster } from "@/components/film/poster";
import { LocalTime } from "@/components/local-time";
import { ScreeningPanel } from "@/components/screening/screening-panel";
import { requireOnboardedViewer } from "@/lib/auth";
import { backdropUrl } from "@/lib/tmdb/images";
import { getScreeningView } from "@/server/queries/screenings";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("screening.title") };

export default async function ScreeningPage({ params }: PageProps<"/screenings/[id]">) {
  const viewer = await requireOnboardedViewer();
  const { id } = await params;
  const view = await getScreeningView(id, viewer.id);
  if (!view) notFound();

  const backdrop = backdropUrl(view.film.backdropPath, "w1280");
  const where = view.venue ?? (view.location === "CINEMA" ? t("screening.atCinema") : view.location === "HOME" ? t("screening.atHome") : t("screening.elsewhere"));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-8 pb-4 md:-mt-8">
        {backdrop ? (
          <Image src={backdrop} alt="" fill priority className="-z-10 object-cover opacity-20" />
        ) : (
          <div className="screen-glow absolute inset-0 -z-10" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background to-transparent" />
        <div className="flex items-end gap-5">
          <Link href={`/film/${view.film.tmdbId}`}>
            <Poster {...view.film} size="md" />
          </Link>
          <div className="min-w-0 space-y-2">
            <Link href={`/circles/${view.circle.id}`} className="text-sm font-medium text-primary hover:underline">
              {view.circle.name}
            </Link>
            <h1 className="marquee text-4xl sm:text-5xl">{view.film.title}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {view.scheduledAt ? <LocalTime iso={view.scheduledAt.toISOString()} /> : null}
              <span className="flex items-center gap-1">
                {view.location === "CINEMA" ? <Popcorn className="size-3.5" /> : <MapPin className="size-3.5" />} {where}
              </span>
              {view.host ? <span>{t("screening.hostedBy", { name: view.host.displayName })}</span> : null}
            </p>
          </div>
        </div>
      </header>

      <ScreeningPanel view={view} viewerId={viewer.id} />
    </div>
  );
}
