import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-shell/app-header";
import { MobileNav } from "@/components/app-shell/main-nav";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">{children}</main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
