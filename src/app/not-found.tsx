import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { t } from "@/i18n";

export default function NotFound() {
  return (
    <main className="screen-glow flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Logo />
      <p className="marquee text-8xl text-primary">404</p>
      <p className="max-w-sm text-muted-foreground">{t("common.notFound")}</p>
      <Button asChild>
        <Link href="/">{t("common.back")}</Link>
      </Button>
    </main>
  );
}
