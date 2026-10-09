"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Poster } from "@/components/film/poster";
import { StarInput } from "@/components/film/star-input";
import { quickRate } from "@/server/actions/onboarding";

export interface QuickRateFilm {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

/** Grid of well-known films with inline star inputs; every change is saved immediately. */
export function QuickRateGrid({
  films,
  initial,
  onCountChange,
}: {
  films: QuickRateFilm[];
  initial: Record<number, number>;
  onCountChange?: (count: number) => void;
}) {
  const [ratings, setRatings] = useState(initial);

  function rate(film: QuickRateFilm, rating: number | null) {
    const next = { ...ratings };
    if (rating === null) delete next[film.tmdbId];
    else next[film.tmdbId] = rating;
    setRatings(next);
    onCountChange?.(Object.keys(next).length);
    void quickRate({ tmdbId: film.tmdbId, rating }).then((result) => {
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {films.map((film) => (
        <div key={film.tmdbId} className="space-y-2">
          <Poster {...film} size="fill" />
          <p className="truncate text-sm font-medium" title={film.title}>
            {film.title}
          </p>
          <StarInput size="md" value={ratings[film.tmdbId] ?? null} onChange={(r) => rate(film, r)} label={film.title} />
        </div>
      ))}
    </div>
  );
}
