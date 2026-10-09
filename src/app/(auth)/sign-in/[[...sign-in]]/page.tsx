import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("auth.signInTitle") };

// Clerk's form reads the pathname (URL data), so it streams in behind a boundary.
export default function SignInPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] w-[360px] rounded-2xl" />}>
      <SignIn />
    </Suspense>
  );
}
