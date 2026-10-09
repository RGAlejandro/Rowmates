import Link from "next/link";
import { cn } from "@/lib/utils";
import { Poster } from "./poster";
import { Stars } from "./stars";

export interface FilmCardData {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterPath?: string | null;
}

/** Poster + caption linking to the film page. Used in grids and rows. */
export function FilmCard({
  film,
  rating,
  caption,
  className,
}: {
  film: FilmCardData;
  rating?: number | null;
  caption?: string;
  className?: string;
}) {
  return (
    <Link href={`/film/${film.tmdbId}`} className={cn("group block min-w-0", className)}>
      <Poster
        tmdbId={film.tmdbId}
        title={film.title}
        year={film.year}
        posterPath={film.posterPath}
        size="fill"
        className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-primary/60"
      />
      <p className="mt-2 truncate text-sm font-medium">{film.title}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {film.year ? <span>{film.year}</span> : null}
        {rating ? <Stars rating={rating} size="xs" /> : null}
        {caption ? <span className="truncate">{caption}</span> : null}
      </div>
    </Link>
  );
}

export function FilmGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6", className)}>{children}</div>;
}

export function FilmRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [&>*]:w-28 [&>*]:shrink-0 sm:[&>*]:w-32", className)}>
      {children}
    </div>
  );
}
