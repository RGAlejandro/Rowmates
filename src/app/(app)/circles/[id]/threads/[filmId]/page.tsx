import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poster } from "@/components/film/poster";
import { LogDialog } from "@/components/film/log-dialog";
import { LocalTime } from "@/components/local-time";
import { EmptyState } from "@/components/ui-extras";
import { UserAvatar } from "@/components/user-avatar";
import { CommentComposer, DeleteCommentButton } from "@/components/thread/comment-composer";
import { requireOnboardedViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasLoggedFilm } from "@/server/guards";
import { getCircle, getThread } from "@/server/queries/circles";
import { plural, t } from "@/i18n";

export const metadata: Metadata = { title: t("threads.title") };

export default async function ThreadPage({ params }: PageProps<"/circles/[id]/threads/[filmId]">) {
  const viewer = await requireOnboardedViewer();
  const { id, filmId: rawFilmId } = await params;
  const filmId = Number(rawFilmId);
  const circle = await getCircle(id, viewer.id);
  if (!circle || !Number.isInteger(filmId)) notFound();

  const film = await db.film.findUnique({ where: { tmdbId: filmId }, select: { tmdbId: true, title: true, year: true, posterPath: true } });
  if (!film) notFound();
  const [unlocked, thread] = await Promise.all([hasLoggedFilm(viewer.id, filmId), getThread(circle.id, filmId)]);
  const count = thread?._count.comments ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <Poster {...film} size="sm" />
        <div>
          <Link href={`/circles/${circle.id}?tab=discussions`} className="text-sm text-primary hover:underline">
            {circle.name}
          </Link>
          <h1 className="marquee text-4xl">{film.title}</h1>
          <p className="text-sm text-muted-foreground">{plural("common.comments", count)}</p>
        </div>
      </header>

      {!unlocked ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-primary/40 bg-primary/5 p-10 text-center">
          <Lock className="size-10 text-primary" />
          <h2 className="marquee text-3xl">{t("threads.locked")}</h2>
          <p className="text-muted-foreground">{t("threads.lockedBody", { title: film.title })}</p>
          {count > 0 ? <p className="font-medium">{plural("threads.waiting", count)}</p> : null}
          <LogDialog
            film={film}
            circles={circle.members.length ? [{ id: circle.id, name: circle.name }] : []}
            trigger={
              <Button size="lg">
                <Plus /> {t("log.button")}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {count === 0 ? (
            <EmptyState message={t("threads.empty")} />
          ) : (
            <ul className="space-y-4">
              {thread!.comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <UserAvatar name={comment.author.displayName} src={comment.author.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{comment.author.displayName}</span>
                      <LocalTime iso={comment.createdAt.toISOString()} format="datetime" />
                    </div>
                    {comment.deletedAt ? (
                      <p className="mt-1 text-sm text-muted-foreground italic">{t("threads.deleted")}</p>
                    ) : (
                      <p className="mt-1 whitespace-pre-line">{comment.body}</p>
                    )}
                    {comment.author.id === viewer.id && !comment.deletedAt ? (
                      <div className="mt-1 text-right">
                        <DeleteCommentButton commentId={comment.id} />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <CommentComposer circleId={circle.id} filmId={film.tmdbId} />
        </>
      )}
    </div>
  );
}
