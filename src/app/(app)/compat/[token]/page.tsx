import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FilmCard } from "@/components/film/film-card";
import { UserAvatar } from "@/components/user-avatar";
import { CompatLinkButton, CreateDuoButton, RefreshButton, RevealScoreButton } from "@/components/compat/compat-actions";
import { QuickRateGrid } from "@/components/onboarding/quick-rate-grid";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMostVoted } from "@/lib/tmdb/api";
import { getCompatibility, ratingCount } from "@/server/taste";
import { plural, t, type MessageKey } from "@/i18n";

export const metadata: Metadata = { title: t("compat.cta") };

const CONFIDENCE: Record<string, MessageKey> = {
  LOW: "compat.confidenceLow",
  MEDIUM: "compat.confidenceMedium",
  HIGH: "compat.confidenceHigh",
};

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="screen-glow mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-border p-6 text-center sm:p-10">{children}</div>;
}

export default async function CompatPage({ params }: PageProps<"/compat/[token]">) {
  const { token } = await params;
  const invite = await db.compatInvite.findUnique({
    where: { token },
    include: {
      inviter: { select: { id: true, displayName: true, avatarUrl: true } },
      acceptedBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
  if (!invite) notFound();
  const viewer = await getViewer();
  const inviterName = invite.inviter.displayName.split(" ")[0];

  if (!viewer) {
    return (
      <Shell>
        <UserAvatar name={invite.inviter.displayName} src={invite.inviter.avatarUrl} size="lg" />
        <h1 className="marquee text-4xl sm:text-5xl">{t("compat.landingTitle", { name: inviterName })}</h1>
        <p className="text-muted-foreground">{t("compat.landingBody")}</p>
        <Button asChild size="lg">
          <Link href={`/sign-up?redirect_url=${encodeURIComponent(`/compat/${token}`)}`}>{t("nav.getStarted")}</Link>
        </Button>
      </Shell>
    );
  }

  const isInviter = viewer.id === invite.inviterId;
  const partner = isInviter ? invite.acceptedBy : invite.inviter;

  if (isInviter && !invite.acceptedBy) {
    return (
      <Shell>
        <h1 className="marquee text-4xl">{t("compat.ownLink")}</h1>
        <div className="w-full max-w-md">
          <CompatLinkButton />
        </div>
      </Shell>
    );
  }

  if (!isInviter && invite.acceptedById && invite.acceptedById !== viewer.id) {
    return (
      <Shell>
        <p>{t("compat.used")}</p>
      </Shell>
    );
  }

  if (!isInviter && !invite.acceptedById) {
    const rated = await ratingCount(viewer.id);
    if (rated < 5) {
      const [first, second] = await Promise.all([getMostVoted(1), getMostVoted(2)]);
      const films = [...first.results, ...second.results].slice(0, 24).map((f) => ({
        tmdbId: f.id,
        title: f.title,
        year: Number(f.release_date?.slice(0, 4)) || null,
        posterPath: f.poster_path,
      }));
      return (
        <div className="space-y-6">
          <Shell>
            <h1 className="marquee text-4xl">{t("compat.landingTitle", { name: inviterName })}</h1>
            <p className="text-muted-foreground">{t("compat.needRatings")}</p>
            <RefreshButton label={t("compat.cta")} />
          </Shell>
          <QuickRateGrid films={films} initial={{}} />
        </div>
      );
    }
    return (
      <Shell>
        <UserAvatar name={invite.inviter.displayName} src={invite.inviter.avatarUrl} size="lg" />
        <h1 className="marquee text-4xl sm:text-5xl">{t("compat.landingTitle", { name: inviterName })}</h1>
        <RevealScoreButton token={token} />
      </Shell>
    );
  }

  // Both sides known: show the result.
  const other = partner!;
  const result = await getCompatibility(viewer.id, other.id);
  const filmIds = [...result.bothLove, ...result.willArgue];
  const films = await db.film.findMany({ where: { tmdbId: { in: filmIds } }, select: { tmdbId: true, title: true, year: true, posterPath: true } });
  const byId = new Map(films.map((f) => [f.tmdbId, f]));

  return (
    <div className="space-y-8">
      <Shell>
        <div className="flex items-center -space-x-3">
          <UserAvatar name={viewer.displayName} src={viewer.avatarUrl} size="lg" className="ring-4 ring-background" />
          <UserAvatar name={other.displayName} src={other.avatarUrl} size="lg" className="ring-4 ring-background" />
        </div>
        <h1 className="marquee text-5xl sm:text-6xl">{t("compat.resultTitle", { score: result.score })}</h1>
        <p className="text-muted-foreground">
          {t(CONFIDENCE[result.confidence])} · {plural("compat.inCommon", result.commonCount)}
        </p>
        {invite.circleId ? (
          <Button asChild size="lg">
            <Link href={`/circles/${invite.circleId}`}>{t("compat.createDuo")}</Link>
          </Button>
        ) : (
          <CreateDuoButton token={token} />
        )}
      </Shell>

      <div className="grid gap-6 sm:grid-cols-2">
        {result.bothLove.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold">{t("compat.bothLove")}</h2>
            <div className="grid grid-cols-3 gap-3">
              {result.bothLove.map((id) => (byId.get(id) ? <FilmCard key={id} film={byId.get(id)!} /> : null))}
            </div>
          </section>
        )}
        {result.willArgue.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold">{t("compat.willArgue")}</h2>
            <div className="grid grid-cols-3 gap-3">
              {result.willArgue.map((id) => (byId.get(id) ? <FilmCard key={id} film={byId.get(id)!} /> : null))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
