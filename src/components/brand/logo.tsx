import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** Two seats side by side: the brand mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect x="3" y="9" width="11" height="14" rx="3" className="fill-velvet" />
      <rect x="18" y="9" width="11" height="14" rx="3" className="fill-primary" />
      <rect x="1" y="20" width="30" height="5" rx="2.5" className="fill-foreground/85" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)} aria-label={t("brand.name")}>
      <LogoMark />
      <span className="marquee text-2xl text-foreground">{t("brand.name")}</span>
    </Link>
  );
}
