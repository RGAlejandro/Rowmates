import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="screen-glow flex flex-1 flex-col items-center px-4 py-10">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-10">{children}</div>
    </main>
  );
}
