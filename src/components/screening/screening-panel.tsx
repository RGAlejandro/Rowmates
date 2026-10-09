"use client";

import { useCallback, useState, useTransition } from "react";
import { Lock, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stars } from "@/components/film/stars";
import { StarInput } from "@/components/film/star-input";
import { UserAvatar } from "@/components/user-avatar";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { cn } from "@/lib/utils";
import { joinNames } from "@/lib/text";
import type { ScreeningView } from "@/server/queries/screenings";
import { cancelScreening, forceReveal, markWatched, sealRating, setRsvp } from "@/server/actions/screenings";
import { t } from "@/i18n";
import { RevealBoard } from "./reveal-board";

type Pulse = { status: string; sealedCount: number };
type RsvpValue = "GOING" | "MAYBE" | "DECLINED";

export function ScreeningPanel({ view, viewerId }: { view: ScreeningView; viewerId: string }) {
  const signature = useCallback((p: Pulse) => `${p.status}:${p.sealedCount}`, []);
  const live = view.status !== "REVEALED" && view.status !== "CANCELLED";
  useLiveRefresh<Pulse>(`/api/live/screening/${view.id}`, signature, { enabled: live });
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error);
    });
  }

  if (view.status === "REVEALED") return <RevealBoard view={view} viewerId={viewerId} />;
  if (view.status === "CANCELLED") return <p className="text-center text-muted-foreground">{t("screening.cancelled")}</p>;

  const sealedIds = new Set(view.sealed.map((u) => u.id));
  const isAttendee = view.viewerRsvp === "GOING";

  return (
    <div className="space-y-8">
      {view.status === "PLANNED" && !view.canRate && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">{t("screening.rsvp")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["GOING", t("screening.going")],
                ["MAYBE", t("screening.maybe")],
                ["DECLINED", t("screening.notGoing")],
              ] as [RsvpValue, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={view.viewerRsvp === value ? "default" : "outline"}
                disabled={pending}
                onClick={() => run(() => setRsvp(view.id, value))}
              >
                {label}
              </Button>
            ))}
          </div>
          {isAttendee ? (
            <Button variant="secondary" className="w-full" disabled={pending} onClick={() => run(() => markWatched(view.id))}>
              {t("screening.markWatched")}
            </Button>
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">{t("screening.attendees")}</h2>
        <ul className="flex flex-wrap gap-3">
          {view.attendees
            .filter((a) => a.rsvp !== "DECLINED")
            .map(({ user, rsvp }) => {
              const sealed = sealedIds.has(user.id);
              return (
                <li key={user.id} className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1">
                  <UserAvatar name={user.displayName} src={user.avatarUrl} size="xs" />
                  <span className={cn("text-sm", rsvp === "MAYBE" && "text-muted-foreground")}>
                    {user.id === viewerId ? t("common.you") : user.displayName}
                  </span>
                  {sealed ? (
                    <span role="img" aria-label={t("screening.sealed")}>
                      <MailCheck className="size-4 text-primary" aria-hidden />
                    </span>
                  ) : view.status !== "PLANNED" ? (
                    <span role="img" aria-label={t("screening.waitingShort")}>
                      <Mail className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                  ) : null}
                </li>
              );
            })}
        </ul>
      </section>

      {view.canRate && !view.mine && !isAttendee && (
        <Button variant="outline" disabled={pending} onClick={() => run(() => setRsvp(view.id, "GOING"))}>
          {t("screening.imThere")}
        </Button>
      )}

      {view.canRate && !view.mine && isAttendee && <SealForm screeningId={view.id} />}

      {view.mine && (
        <section className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
          <Lock className="mx-auto size-6 text-primary" />
          <p className="font-semibold">{t("screening.sealed")}</p>
          {view.mine.rating ? <Stars rating={view.mine.rating} size="md" className="justify-center" /> : null}
          {view.pending.length ? (
            <p className="text-sm text-muted-foreground">
              {t("screening.waiting", { names: joinNames(view.pending.map((u) => u.displayName.split(" ")[0])) })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("screening.everyoneRated")}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("screening.revealHint")}</p>
          {view.canForceReveal ? (
            <Button disabled={pending} onClick={() => run(() => forceReveal(view.id))}>
              {t("screening.revealNow")}
            </Button>
          ) : null}
        </section>
      )}

      {view.isHost && view.status === "PLANNED" ? (
        <Button variant="ghost" className="text-muted-foreground" disabled={pending} onClick={() => run(() => cancelScreening(view.id))}>
          {t("screening.cancel")}
        </Button>
      ) : null}
    </div>
  );
}

function SealForm({ screeningId }: { screeningId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">{t("screening.rateTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("screening.rateBody")}</p>
      </div>
      <StarInput value={rating} onChange={setRating} label={t("screening.rateTitle")} />
      <Textarea rows={3} maxLength={5000} placeholder={t("log.reviewPlaceholder")} value={review} onChange={(e) => setReview(e.target.value)} />
      <Button
        size="lg"
        className="w-full"
        disabled={!rating || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await sealRating({ screeningId, rating: rating!, review: review.trim() || null });
            if (!result.ok) toast.error(result.error);
          })
        }
      >
        <Lock /> {t("screening.submitSecret")}
      </Button>
    </section>
  );
}
