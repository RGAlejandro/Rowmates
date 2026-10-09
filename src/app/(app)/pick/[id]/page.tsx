import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PickRoom } from "@/components/pick/pick-room";
import { requireOnboardedViewer } from "@/lib/auth";
import { getPickView } from "@/server/queries/pick";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("pick.title") };

export default async function PickPage({ params }: PageProps<"/pick/[id]">) {
  const viewer = await requireOnboardedViewer();
  const { id } = await params;
  const view = await getPickView(id, viewer.id);
  if (!view) notFound();
  return <PickRoom view={view} viewerId={viewer.id} />;
}
