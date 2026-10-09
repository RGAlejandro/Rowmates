import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/circle/avatar-stack";
import { JoinButton } from "@/components/circle/join-button";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("circles.join") };

/** Invite landing: works signed out (shows who's inviting) and signed in (one-tap join). */
export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const invite = await db.circleInvite.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      uses: true,
      maxUses: true,
      createdBy: { select: { displayName: true } },
      circle: {
        select: {
          id: true,
          name: true,
          members: { take: 8, select: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
        },
      },
    },
  });
  if (!invite) notFound();

  const viewer = await getViewer();
  if (viewer && invite.circle.members.some((m) => m.user.id === viewer.id)) redirect(`/circles/${invite.circle.id}`);
  const usable = invite.expiresAt > new Date() && (invite.maxUses === null || invite.uses < invite.maxUses);

  return (
    <div className="screen-glow mx-auto flex max-w-lg flex-col items-center gap-6 rounded-3xl border border-border p-10 text-center">
      <AvatarStack people={invite.circle.members.map((m) => m.user)} />
      <h1 className="marquee text-4xl">{t("circles.joinTitle", { name: invite.createdBy.displayName, circle: invite.circle.name })}</h1>
      <p className="text-muted-foreground">{t("circles.joinBody")}</p>
      {!usable ? (
        <p className="text-destructive">{t("circles.inviteExpired")}</p>
      ) : viewer ? (
        <JoinButton token={token} circleName={invite.circle.name} />
      ) : (
        <Button asChild size="lg">
          <Link href={`/sign-up?redirect_url=${encodeURIComponent(`/join/${token}`)}`}>{t("nav.getStarted")}</Link>
        </Button>
      )}
    </div>
  );
}
