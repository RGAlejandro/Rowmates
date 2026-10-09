"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Ban, Check, CircleHelp, Clock, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Poster } from "@/components/film/poster";
import { UserAvatar } from "@/components/user-avatar";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { cn } from "@/lib/utils";
import { joinNames } from "@/lib/text";
import type { VoteValue } from "@/lib/pick/voting";
import type { PickView } from "@/server/queries/pick";
import { castVote, closeVoting, planFromPick, submitVotes } from "@/server/actions/pick";
import { t } from "@/i18n";
import { reasonLabel } from "./reasons";

type Pulse = { status: string; submitted: string[] };

// Cards fly out to the side of the vote (left for no/veto, right for yes/maybe).
const cardVariants = {
  enter: { opacity: 0, y: 24, scale: 0.96 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction * 220, rotate: direction * 8 }),
};

export function PickRoom({ view, viewerId }: { view: PickView; viewerId: string }) {
  const signature = useCallback((p: Pulse) => `${p.status}:${p.submitted.length}`, []);
  useLiveRefresh<Pulse>(`/api/live/pick/${view.id}`, signature, { enabled: view.status === "VOTING" });

  if (view.status === "DONE") return <PickResult view={view} />;
  if (view.viewerSubmitted) return <WaitingRoom view={view} viewerId={viewerId} />;
  return <VoteDeck view={view} />;
}

function VoteDeck({ view }: { view: PickView }) {
  const [votes, setVotes] = useState(() => new Map(view.myVotes.map((v) => [v.filmId, v.value as VoteValue])));
  const [index, setIndex] = useState(() => Math.max(0, view.candidates.findIndex((c) => !votes.has(c.filmId))));
  const [direction, setDirection] = useState(1);
  const [pending, startTransition] = useTransition();
  const vetoUsed = [...votes.values()].includes("VETO");
  const candidate = view.candidates[index];
  const total = view.candidates.length;

  function vote(value: VoteValue) {
    if (!candidate) return;
    setDirection(value === "NO" || value === "VETO" ? -1 : 1);
    const next = new Map(votes).set(candidate.filmId, value);
    setVotes(next);
    const isLast = index >= total - 1;
    setIndex(index + 1);
    startTransition(async () => {
      const result = await castVote({ sessionId: view.id, filmId: candidate.filmId, value });
      if (!result.ok) {
        toast.error(result.error);
        setIndex(index);
        return;
      }
      if (isLast) {
        const submitted = await submitVotes(view.id);
        if (!submitted.ok) toast.error(submitted.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="marquee text-4xl">{t("pick.voteTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pick.voteBody")}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Progress value={(Math.min(index, total) / total) * 100} />
        <span className="shrink-0">{t("pick.progress", { current: Math.min(index + 1, total), total })}</span>
      </div>

      <div className="relative min-h-[440px]">
        <AnimatePresence mode="popLayout" custom={direction}>
          {candidate ? (
            <motion.article
              key={candidate.filmId}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="rounded-3xl border border-border bg-card p-4 shadow-2xl"
            >
              <div className="flex gap-4">
                <Poster {...candidate.film} size="lg" className="w-32" />
                <div className="min-w-0 space-y-2">
                  <h2 className="marquee text-3xl">{candidate.film.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[candidate.film.year, candidate.film.runtime ? t("film.runtime", { count: candidate.film.runtime }) : null].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.reasons.map((reason, i) => (
                      <Badge key={i} variant="secondary" className="whitespace-normal">
                        {reasonLabel(reason)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {candidate.film.overview ? <p className="mt-4 line-clamp-4 text-sm text-muted-foreground">{candidate.film.overview}</p> : null}
            </motion.article>
          ) : (
            <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-20 text-center text-muted-foreground">
              {t("pick.submitted")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {candidate ? (
        <div className="grid grid-cols-4 gap-2">
          <VoteButton icon={<X />} label={t("pick.no")} onClick={() => vote("NO")} disabled={pending} />
          <VoteButton icon={<CircleHelp />} label={t("pick.maybe")} onClick={() => vote("MAYBE")} disabled={pending} />
          <VoteButton icon={<Check />} label={t("pick.yes")} onClick={() => vote("YES")} disabled={pending} primary />
          <VoteButton
            icon={<Ban />}
            label={vetoUsed ? t("pick.vetoUsed") : t("pick.veto")}
            onClick={() => vote("VETO")}
            disabled={pending || vetoUsed}
            danger
          />
        </div>
      ) : null}
    </div>
  );
}

function VoteButton({
  icon,
  label,
  onClick,
  disabled,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-xs font-medium transition-colors disabled:opacity-40 [&_svg]:size-6",
        primary && "border-primary bg-primary text-primary-foreground",
        danger && "text-velvet hover:border-velvet",
        !primary && !danger && "hover:border-primary/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function WaitingRoom({ view, viewerId }: { view: PickView; viewerId: string }) {
  const [pending, startTransition] = useTransition();
  const waiting = view.participants.filter((p) => !p.submittedAt).map((p) => p.user.displayName.split(" ")[0]);
  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <Clock className="mx-auto size-10 text-primary" />
      <h1 className="marquee text-4xl">{t("pick.submitted")}</h1>
      {waiting.length ? <p className="text-muted-foreground">{t("pick.waitingFor", { names: joinNames(waiting) })}</p> : null}
      <ul className="flex flex-wrap justify-center gap-3">
        {view.participants.map((p) => (
          <li key={p.user.id} className="flex flex-col items-center gap-1 text-xs">
            <span className="relative">
              <UserAvatar name={p.user.displayName} src={p.user.avatarUrl} size="md" className={cn(!p.submittedAt && "opacity-40")} />
              {p.submittedAt ? <Check className="absolute -right-1 -bottom-1 size-4 rounded-full bg-success p-0.5 text-background" /> : null}
            </span>
            {p.user.id === viewerId ? t("common.you") : p.user.displayName.split(" ")[0]}
          </li>
        ))}
      </ul>
      {view.isHost && waiting.length > 0 ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await closeVoting(view.id);
              if (!result.ok) toast.error(result.error);
            })
          }
        >
          {t("pick.closeVoting")}
        </Button>
      ) : null}
    </div>
  );
}

function PickResult({ view }: { view: PickView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const winner = view.candidates.find((c) => c.filmId === view.resultFilmId);
  const tallies = new Map((view.tallies ?? []).map((tally) => [tally.filmId, tally]));
  const ranked = [...view.candidates].sort((a, b) => (tallies.get(b.filmId)?.points ?? 0) - (tallies.get(a.filmId)?.points ?? 0));

  function plan() {
    startTransition(async () => {
      const result = await planFromPick(view.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/screenings/${result.data.screeningId}`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {winner ? (
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="screen-glow flex flex-col items-center gap-4 rounded-3xl border border-primary/40 p-8 text-center"
        >
          <p className="flex items-center gap-2 text-sm font-medium tracking-widest text-primary uppercase">
            <Trophy className="size-4" /> {t("pick.resultTitle")}
          </p>
          <Poster {...winner.film} size="xl" className="w-44" />
          <h1 className="marquee text-5xl">{winner.film.title}</h1>
          <p className="text-muted-foreground">
            {t("pick.resultBody", { yes: tallies.get(winner.filmId)?.yes ?? 0, maybe: tallies.get(winner.filmId)?.maybe ?? 0 })}
          </p>
          {view.screening ? (
            <Button asChild size="lg">
              <Link href={`/screenings/${view.screening.id}`}>{t("screening.title")}</Link>
            </Button>
          ) : (
            <Button size="lg" onClick={plan} disabled={pending}>
              {t("pick.planIt")}
            </Button>
          )}
        </motion.section>
      ) : (
        <section className="space-y-4 text-center">
          <p className="text-lg">{t("pick.noWinner")}</p>
          <Button asChild>
            <Link href={`/circles/${view.circle.id}/pick`}>{t("pick.tryAgain")}</Link>
          </Button>
        </section>
      )}

      <ol className="space-y-2">
        {ranked.map((c, i) => {
          const tally = tallies.get(c.filmId);
          return (
            <motion.li
              key={c.filmId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-2", tally?.vetoed && "opacity-50")}
            >
              <Poster {...c.film} size="xs" />
              <span className={cn("flex-1 text-sm font-medium", tally?.vetoed && "line-through")}>{c.film.title}</span>
              <span className="text-xs text-muted-foreground">
                {tally?.vetoed ? t("pick.veto") : `${tally?.yes ?? 0} ${t("pick.yes").toLowerCase()} · ${tally?.maybe ?? 0} ${t("pick.maybe").toLowerCase()}`}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
