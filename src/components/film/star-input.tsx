"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { MAX_RATING, MIN_RATING } from "@/lib/ratings";
import { StarShape } from "./stars";

interface StarInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "md" | "lg";
  label?: string;
  disabled?: boolean;
}

/**
 * Half-star rating input. Each star has two hit areas (left = half, right = full).
 * Keyboard: arrows move by half a star, Backspace clears. Clicking the current value clears it.
 */
export function StarInput({ value, onChange, size = "lg", label = "Rating", disabled }: StarInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const starSize = size === "lg" ? "size-9" : "size-7";

  function set(next: number | null) {
    if (disabled) return;
    onChange(next === value ? null : next);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    const current = value ?? 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(MAX_RATING, current + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(current <= MIN_RATING ? null : current - 1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      onChange(null);
    }
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={(value ?? 0) / 2}
      aria-valuetext={value ? `${value / 2} stars` : "No rating"}
      aria-disabled={disabled}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className={cn("inline-flex rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50", disabled && "opacity-50")}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const full = star * 2;
        const half = full - 1;
        const fill = shown >= full ? "full" : shown === half ? "half" : "empty";
        return (
          <span key={star} className={cn("relative", starSize)}>
            <StarShape fill={fill} className={cn(starSize, "transition-transform", hover !== null && shown >= half && "scale-105")} />
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHover(half)}
              onClick={() => set(half)}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHover(full)}
              onClick={() => set(full)}
            />
          </span>
        );
      })}
    </div>
  );
}
