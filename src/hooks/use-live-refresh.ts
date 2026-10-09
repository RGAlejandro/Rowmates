"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

/**
 * Polls a tiny "pulse" endpoint and re-renders the server page when it changes.
 * Swap the transport (Ably, Pusher, SSE…) here without touching the pages.
 */
export function useLiveRefresh<T>(url: string, signature: (pulse: T) => string, { enabled = true, intervalMs = 2000 } = {}) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  const { data } = useQuery({
    queryKey: ["live", url],
    queryFn: async () => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Pulse failed: ${res.status}`);
      return (await res.json()) as T;
    },
    enabled,
    refetchInterval: enabled ? intervalMs : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!data) return;
    const next = signature(data);
    if (last.current !== null && last.current !== next) router.refresh();
    last.current = next;
  }, [data, signature, router]);

  return data;
}
