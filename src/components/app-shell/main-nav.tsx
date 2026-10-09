"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type MessageKey } from "@/i18n";

const LINKS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/home", label: "nav.home", icon: Home },
  { href: "/circles", label: "nav.circles", icon: Users },
  { href: "/search", label: "nav.search", icon: Search },
];
const MOBILE_LINKS = [...LINKS, { href: "/me", label: "nav.profile" as MessageKey, icon: User }];

function isActive(pathname: string | null, href: string) {
  return pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
}

function DesktopLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            isActive(pathname, href) && "bg-secondary text-foreground",
          )}
        >
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}

function MobileLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {MOBILE_LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                isActive(pathname, href) && "text-primary",
              )}
            >
              <Icon className="size-5" />
              {t(label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ActiveDesktopLinks() {
  return <DesktopLinks pathname={usePathname()} />;
}

function ActiveMobileLinks() {
  return <MobileLinks pathname={usePathname()} />;
}

// The pathname is URL data, so the active state streams in; the static links are the fallback.
export function DesktopNav() {
  return (
    <Suspense fallback={<DesktopLinks pathname={null} />}>
      <ActiveDesktopLinks />
    </Suspense>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={<MobileLinks pathname={null} />}>
      <ActiveMobileLinks />
    </Suspense>
  );
}
