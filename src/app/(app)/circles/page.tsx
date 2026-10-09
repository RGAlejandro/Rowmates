import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateCircleDialog } from "@/components/circle/create-circle-dialog";
import { AvatarStack } from "@/components/circle/avatar-stack";
import { EmptyState, PageTitle } from "@/components/ui-extras";
import { requireOnboardedViewer } from "@/lib/auth";
import { getMyCircles } from "@/server/queries/circles";
import { plural, t } from "@/i18n";

export const metadata: Metadata = { title: t("circles.title") };

export default async function CirclesPage() {
  const viewer = await requireOnboardedViewer();
  const circles = await getMyCircles(viewer.id);

  return (
    <div>
      <PageTitle title={t("circles.title")} subtitle={t("circles.subtitle")} action={<CreateCircleDialog />} />
      {circles.length === 0 ? (
        <EmptyState icon={<Users className="size-8" />} message={t("circles.empty")} action={<CreateCircleDialog />} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
            <li key={circle.id}>
              <Link
                href={`/circles/${circle.id}`}
                className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="marquee text-3xl">{circle.name}</h2>
                  <Badge variant="secondary" className="shrink-0">
                    {circle.kind === "DUO" ? <Heart className="size-3" /> : <Users className="size-3" />}
                    {t(circle.kind === "DUO" ? "circles.duo" : "circles.crew")}
                  </Badge>
                </div>
                <AvatarStack people={circle.members.map((m) => m.user)} />
                <p className="mt-auto text-sm text-muted-foreground">
                  {plural("common.members", circle._count.members)} · {plural("common.films", circle._count.screenings)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
