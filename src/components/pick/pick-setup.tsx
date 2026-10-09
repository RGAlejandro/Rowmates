"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { PICK_GENRES, genreName } from "@/lib/tmdb/genres";
import { startPickNight } from "@/server/actions/pick";
import { t } from "@/i18n";

interface Member {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

const RUNTIMES = [null, 90, 120, 150] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/50",
        active && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PickSetup({ circleId, members, viewerId }: { circleId: string; members: Member[]; viewerId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState(() => new Set(members.map((m) => m.id)));
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null);
  const [genres, setGenres] = useState<number[]>([]);
  const [onlyStreamable, setOnlyStreamable] = useState(true);
  const [allowRewatch, setAllowRewatch] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleParticipant(id: string) {
    if (id === viewerId) return;
    const next = new Set(participants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setParticipants(next);
  }

  function start() {
    startTransition(async () => {
      const result = await startPickNight({
        circleId,
        participantIds: [...participants],
        filters: { maxRuntime, genres, onlyStreamable, allowRewatch },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/pick/${result.data.pickId}`);
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold">{t("pick.whoIsWatching")}</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const on = participants.has(member.id);
            return (
              <button
                key={member.id}
                type="button"
                aria-pressed={on}
                disabled={member.id === viewerId}
                onClick={() => toggleParticipant(member.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 transition-colors",
                  on ? "border-primary bg-primary/10" : "opacity-60",
                )}
              >
                <UserAvatar name={member.displayName} src={member.avatarUrl} size="xs" />
                <span className="text-sm">{member.displayName}</span>
                {on ? <Check className="size-3.5 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t("pick.maxRuntime")}</h2>
        <div className="flex flex-wrap gap-2">
          {RUNTIMES.map((value) => (
            <Chip key={value ?? "any"} active={maxRuntime === value} onClick={() => setMaxRuntime(value)}>
              {value ? t("pick.underMinutes", { count: value }) : t("pick.anyLength")}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t("pick.filters")}</h2>
        <div className="flex flex-wrap gap-2">
          {PICK_GENRES.map((id) => (
            <Chip
              key={id}
              active={genres.includes(id)}
              onClick={() => setGenres(genres.includes(id) ? genres.filter((g) => g !== id) : [...genres, id].slice(-6))}
            >
              {genreName(id)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <span className="text-sm">{t("pick.onlyStreamable")}</span>
          <Switch checked={onlyStreamable} onCheckedChange={setOnlyStreamable} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <span className="text-sm">{t("pick.allowRewatch")}</span>
          <Switch checked={allowRewatch} onCheckedChange={setAllowRewatch} />
        </label>
      </section>

      <Button size="lg" className="h-12 w-full text-base" onClick={start} disabled={pending}>
        <Shuffle /> {pending ? t("pick.starting") : t("pick.start")}
      </Button>
    </div>
  );
}
