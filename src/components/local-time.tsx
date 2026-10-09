"use client";

import { useSyncExternalStore } from "react";

const FORMATS = {
  datetime: new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }),
  time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }),
};

const subscribe = () => () => {};

/**
 * Formats in the viewer's own time zone. The server snapshot renders nothing,
 * so there is no server(UTC)/client mismatch during hydration.
 */
export function LocalTime({ iso, format = "datetime", className }: { iso: string; format?: keyof typeof FORMATS; className?: string }) {
  const onClient = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <time dateTime={iso} className={className}>
      {onClient ? FORMATS[format].format(new Date(iso)) : " "}
    </time>
  );
}
