"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logoUrl } from "@/lib/tmdb/images";

export interface Service {
  id: number;
  name: string;
  logoPath: string | null;
}

export function useRegionServices(region: string) {
  return useQuery({
    queryKey: ["providers", region],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/providers?region=${region}`);
      return ((await res.json()) as { results: Service[] }).results;
    },
  });
}

/** Grid of toggleable streaming services for a region. */
export function ServicePicker({
  region,
  selected,
  onChange,
}: {
  region: string;
  selected: Service[];
  onChange: (services: Service[]) => void;
}) {
  const { data, isLoading } = useRegionServices(region);
  const selectedIds = new Set(selected.map((s) => s.id));

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {(data ?? []).map((service) => {
        const active = selectedIds.has(service.id);
        const logo = logoUrl(service.logoPath, "w92");
        return (
          <button
            key={service.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? selected.filter((s) => s.id !== service.id) : [...selected, service])}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left text-sm transition-colors hover:border-primary/50",
              active && "border-primary bg-primary/10",
            )}
          >
            {logo ? (
              <Image src={logo} alt="" width={36} height={36} className="rounded-lg" />
            ) : (
              <span className="grid size-9 place-items-center rounded-lg bg-secondary font-bold">{service.name[0]}</span>
            )}
            <span className="min-w-0 flex-1 truncate">{service.name}</span>
            {active ? <Check className="size-4 text-primary" /> : null}
          </button>
        );
      })}
    </div>
  );
}
