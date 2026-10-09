import Image from "next/image";
import { cn } from "@/lib/utils";
import { posterUrl, type PosterSize } from "@/lib/tmdb/images";

const WIDTHS = { xs: "w-10", sm: "w-16", md: "w-28", lg: "w-40", xl: "w-56", fill: "w-full" } as const;
const TMDB_SIZES: Record<keyof typeof WIDTHS, PosterSize> = {
  xs: "w92",
  sm: "w154",
  md: "w185",
  lg: "w342",
  xl: "w500",
  fill: "w342",
};

interface PosterProps {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterPath?: string | null;
  size?: keyof typeof WIDTHS;
  className?: string;
}

export function Poster({ tmdbId, title, year, posterPath, size = "md", className }: PosterProps) {
  const url = posterUrl(posterPath, TMDB_SIZES[size]);
  return (
    <div
      className={cn(
        "poster-shadow @container relative aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-muted",
        WIDTHS[size],
        className,
      )}
    >
      {url ? (
        <Image src={url} alt={title} fill className="object-cover" />
      ) : (
        <TypographicPoster tmdbId={tmdbId} title={title} year={year} />
      )}
    </div>
  );
}

/** Stand-in poster when TMDB has no artwork (or in offline mock mode). */
function TypographicPoster({ tmdbId, title, year }: { tmdbId: number; title: string; year?: number | null }) {
  const hue = (tmdbId * 47) % 360;
  // Shrink the type so the longest word fits on one line (condensed glyphs ≈ 0.55em wide).
  const longestWord = Math.max(...title.split(/\s+/).map((word) => word.length));
  const fontSize = Math.min(15, 80 / (longestWord * 0.55));
  return (
    <div
      role="img"
      aria-label={title}
      className="absolute inset-0 flex flex-col justify-between p-[9cqw]"
      style={{
        background: `linear-gradient(160deg, oklch(0.45 0.11 ${hue}), oklch(0.2 0.05 ${(hue + 50) % 360}))`,
      }}
    >
      <span className="h-[2cqw] w-1/3 rounded-full bg-white/40" />
      <span className="marquee line-clamp-5 text-white drop-shadow" style={{ fontSize: `${fontSize}cqw` }}>
        {title}
      </span>
      <span className="font-mono text-[9cqw] text-white/70">{year ?? ""}</span>
    </div>
  );
}
