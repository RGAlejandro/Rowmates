"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounced } from "@/hooks/use-debounced";
import type { SearchHit } from "@/app/api/search/route";
import { t } from "@/i18n";
import { Poster } from "./poster";

/** Search-as-you-type film picker backed by /api/search. */
export function FilmSearchPicker({
  onPick,
  placeholder = t("search.placeholder"),
  autoFocus,
}: {
  onPick: (film: SearchHit) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query.trim(), 250);
  const { data, isFetching } = useQuery({
    queryKey: ["film-search", debounced],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
      return ((await res.json()) as { results: SearchHit[] }).results;
    },
    enabled: debounced.length >= 2,
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
          autoFocus={autoFocus}
          aria-label={placeholder}
        />
      </div>
      {debounced.length >= 2 && (
        <ul className="max-h-72 space-y-1 overflow-y-auto" aria-busy={isFetching}>
          {(data ?? []).map((film) => (
            <li key={film.tmdbId}>
              <button
                type="button"
                onClick={() => {
                  onPick(film);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary"
              >
                <Poster tmdbId={film.tmdbId} title={film.title} year={film.year} posterPath={film.posterPath} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{film.title}</span>
                  <span className="text-xs text-muted-foreground">{film.year}</span>
                </span>
              </button>
            </li>
          ))}
          {!isFetching && data?.length === 0 && (
            <li className="p-2 text-sm text-muted-foreground">{t("search.empty", { query: debounced })}</li>
          )}
        </ul>
      )}
    </div>
  );
}
