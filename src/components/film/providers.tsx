import Image from "next/image";
import { logoUrl } from "@/lib/tmdb/images";
import type { TmdbProvider, TmdbRegionProviders } from "@/lib/tmdb/types";
import { t } from "@/i18n";

function ProviderChip({ provider }: { provider: TmdbProvider }) {
  const logo = logoUrl(provider.logo_path, "w92");
  return (
    <span className="flex items-center gap-2 rounded-lg border border-border bg-background/60 py-1 pr-3 pl-1 text-sm">
      {logo ? (
        <Image src={logo} alt="" width={28} height={28} className="rounded-md" />
      ) : (
        <span className="grid size-7 place-items-center rounded-md bg-secondary text-xs font-bold">{provider.provider_name[0]}</span>
      )}
      {provider.provider_name}
    </span>
  );
}

/** Where to watch, with the JustWatch attribution TMDB requires. */
export function WhereToWatch({ providers, region }: { providers: TmdbRegionProviders | null; region: string }) {
  const stream = providers?.flatrate ?? [];
  const rent = providers?.rent ?? [];
  return (
    <div className="space-y-3">
      {stream.length === 0 && rent.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("film.notStreaming", { region })}</p>
      ) : null}
      {stream.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{t("film.stream")}</p>
          <div className="flex flex-wrap gap-2">
            {stream.map((p) => (
              <ProviderChip key={p.provider_id} provider={p} />
            ))}
          </div>
        </div>
      )}
      {rent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{t("film.rent")}</p>
          <div className="flex flex-wrap gap-2">
            {rent.slice(0, 4).map((p) => (
              <ProviderChip key={p.provider_id} provider={p} />
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        {providers?.link ? (
          <a href={providers.link} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
            {t("footer.justwatch")}
          </a>
        ) : (
          t("footer.justwatch")
        )}
      </p>
    </div>
  );
}
