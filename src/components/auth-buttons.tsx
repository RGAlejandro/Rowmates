"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

/** Header CTAs for public pages. Client-side so the page shell stays static. */
export function AuthButtons() {
  return (
    <>
      <Show when="signed-out">
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">{t("nav.signIn")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">{t("nav.getStarted")}</Link>
        </Button>
      </Show>
      <Show when="signed-in">
        <Button asChild size="sm">
          <Link href="/home">{t("nav.home")}</Link>
        </Button>
      </Show>
    </>
  );
}
