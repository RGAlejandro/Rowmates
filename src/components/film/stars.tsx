import { cn } from "@/lib/utils";
import { formatStars } from "@/lib/ratings";

const SIZES = { xs: "size-3", sm: "size-4", md: "size-5", lg: "size-7" } as const;
const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** One star, filled by clipping an overlay (no SVG ids, so it can repeat freely on a page). */
export function StarShape({ fill, className }: { fill: "full" | "half" | "empty"; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block shrink-0", className)}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full fill-foreground/15">
        <path d={STAR_PATH} />
      </svg>
      {fill !== "empty" && (
        <span className={cn("absolute inset-y-0 left-0 overflow-hidden", fill === "half" ? "w-1/2" : "w-full")}>
          <svg
            viewBox="0 0 24 24"
            className={cn("absolute inset-y-0 left-0 h-full fill-primary", fill === "half" ? "w-[200%]" : "w-full")}
          >
            <path d={STAR_PATH} />
          </svg>
        </span>
      )}
    </span>
  );
}

/** Read-only 5-star display for a 1..10 rating. */
export function Stars({ rating, size = "sm", className }: { rating: number; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center", className)}
      role="img"
      aria-label={`${rating / 2} out of 5 stars`}
      title={formatStars(rating)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const value = rating - (star - 1) * 2;
        return <StarShape key={star} fill={value >= 2 ? "full" : value === 1 ? "half" : "empty"} className={SIZES[size]} />;
      })}
    </span>
  );
}
