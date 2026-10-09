/**
 * Ranked horizontal bars with the value at each tip. Every value is printed,
 * so it reads as a table and needs no hover layer.
 */
export function BarList({ items, label }: { items: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul aria-label={label} className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-2 rounded-r-[4px] bg-chart-1" style={{ width: `${(item.value / max) * 85}%` }} />
            <span className="text-xs text-foreground tabular-nums">{item.value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
