"use client";

import { useState } from "react";
import { formatStars } from "@/lib/ratings";
import { plural } from "@/i18n";

/**
 * Column chart of how often someone gives each rating (1..10 = ½★..5★).
 * Single series: one validated hue, no legend; every bar is a focusable hit target
 * with a tooltip, and a visually hidden table carries the same numbers.
 */
export function RatingHistogram({ counts, label }: { counts: number[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...counts);
  const peak = counts.indexOf(Math.max(...counts));

  return (
    <figure aria-label={label}>
      <div className="relative flex h-28 items-end gap-0.5 border-b border-border" onPointerLeave={() => setActive(null)}>
        {counts.map((count, i) => {
          const rating = i + 1;
          const height = count === 0 ? 0 : Math.max(4, (count / max) * 100);
          return (
            <button
              key={rating}
              type="button"
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${formatStars(rating)}: ${plural("common.films", count)}`}
            >
              {i === peak && count > 0 ? (
                <span className="absolute text-[11px] text-muted-foreground" style={{ bottom: `calc(${height}% + 4px)` }}>
                  {count}
                </span>
              ) : null}
              <span
                className="w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                style={{ height: `${height}%` }}
              />
              {active === i ? (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute z-10 -translate-y-2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-lg"
                  style={{ bottom: `${height}%` }}
                >
                  <strong className="block font-semibold text-foreground">{plural("common.films", count)}</strong>
                  <span className="text-muted-foreground">{formatStars(rating)}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>½★</span>
        <span>5★</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {counts.map((count, i) => (
            <tr key={i}>
              <th scope="row">{formatStars(i + 1)}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
