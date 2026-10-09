import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="screen-glow flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Logo href="/" />
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
