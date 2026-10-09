import { LogoMark } from "@/components/brand/logo";
import { t } from "@/i18n";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 pb-24 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span>{t("footer.values")}</span>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <span>{t("footer.tmdb")}</span>
          <span>{t("footer.justwatch")}</span>
        </div>
      </div>
    </footer>
  );
}
