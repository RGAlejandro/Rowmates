import Link from "next/link";
import { Mail, MapPin, Popcorn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Poster } from "@/components/film/poster";
import { LocalTime } from "@/components/local-time";
import { AvatarStack } from "./avatar-stack";
import { t } from "@/i18n";

export interface ScreeningCardData {
  id: string;
  status: "PLANNED" | "WATCHED" | "REVEALED" | "CANCELLED";
  scheduledAt: Date | null;
  location: "HOME" | "CINEMA" | "OTHER";
  venue: string | null;
  film: { tmdbId: number; title: string; year: number | null; posterPath: string | null };
  attendees: { user: { id: string; displayName: string; avatarUrl: string | null } }[];
  logs: { userId: string }[];
}

export function ScreeningCard({ screening }: { screening: ScreeningCardData }) {
  const where = screening.location === "CINEMA" ? t("screening.atCinema") : screening.location === "HOME" ? t("screening.atHome") : t("screening.elsewhere");
  return (
    <Link href={`/screenings/${screening.id}`} className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50">
      <Poster {...screening.film} size="sm" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{screening.film.title}</p>
          <Badge variant={screening.status === "WATCHED" ? "default" : "secondary"}>
            {screening.status === "WATCHED" ? t("screening.needsRating") : t("screening.upcoming")}
          </Badge>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {screening.scheduledAt ? <LocalTime iso={screening.scheduledAt.toISOString()} /> : null}
          <span className="flex items-center gap-1">
            {screening.location === "CINEMA" ? <Popcorn className="size-3.5" /> : <MapPin className="size-3.5" />}
            {screening.venue ?? where}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <AvatarStack people={screening.attendees.map((a) => a.user)} size="xs" />
          {screening.logs.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="size-3.5" /> {screening.logs.length} {t("screening.sealed").toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
