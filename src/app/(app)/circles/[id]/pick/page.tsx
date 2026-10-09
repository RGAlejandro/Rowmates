import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui-extras";
import { PickSetup } from "@/components/pick/pick-setup";
import { requireOnboardedViewer } from "@/lib/auth";
import { getCircle } from "@/server/queries/circles";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("pick.title") };

export default async function PickSetupPage({ params }: PageProps<"/circles/[id]/pick">) {
  const viewer = await requireOnboardedViewer();
  const { id } = await params;
  const circle = await getCircle(id, viewer.id);
  if (!circle) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t("pick.title")} subtitle={`${circle.name} · ${t("pick.subtitle")}`} />
      <PickSetup circleId={circle.id} viewerId={viewer.id} members={circle.members.map((m) => m.user)} />
    </div>
  );
}
