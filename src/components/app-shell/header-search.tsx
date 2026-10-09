"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { t } from "@/i18n";

export function HeaderSearch() {
  const router = useRouter();
  return (
    <form
      role="search"
      className="relative hidden sm:block"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get("q")?.toString().trim();
        if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        type="search"
        placeholder={t("nav.searchPlaceholder")}
        aria-label={t("nav.search")}
        className="h-8 w-56 rounded-lg border border-input bg-input/30 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </form>
  );
}
