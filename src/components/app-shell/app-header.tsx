import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthButtons } from "@/components/auth-buttons";
import { Skeleton } from "@/components/ui/skeleton";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { t } from "@/i18n";
import { DesktopNav } from "./main-nav";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo href="/home" />
        <DesktopNav />
        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch />
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <ViewerControls />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Session-dependent corner of the header; streams in behind its own boundary. */
async function ViewerControls() {
  const viewer = await getViewer();
  if (!viewer) return <AuthButtons />;

  const unread = await db.notification.count({ where: { userId: viewer.id, readAt: null } });
  return (
    <>
      <Link
        href="/notifications"
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t("nav.notifications")}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-velvet px-1 text-[10px] font-bold text-velvet-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <UserMenu username={viewer.username} displayName={viewer.displayName} avatarUrl={viewer.avatarUrl} />
    </>
  );
}
