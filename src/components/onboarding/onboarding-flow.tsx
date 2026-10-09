"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { finishOnboarding, saveProfile, saveRegion, saveServices } from "@/server/actions/onboarding";
import { t, type MessageKey } from "@/i18n";
import { ServicePicker, type Service } from "./service-picker";
import { QuickRateGrid } from "./quick-rate-grid";

interface FilmRef {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

interface Props {
  initial: { username: string; displayName: string; region: string; services: Service[]; ratings: Record<number, number> };
  regions: { code: string; name: string }[];
  films: FilmRef[];
}

const STEPS: MessageKey[] = ["onboarding.stepProfile", "onboarding.stepRegion", "onboarding.stepServices", "onboarding.stepTaste"];
const TASTE_GOAL = 10;

export function OnboardingFlow({ initial, regions, films }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState(initial.username);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [region, setRegion] = useState(initial.region);
  const [services, setServices] = useState<Service[]>(initial.services);
  const [rated, setRated] = useState(Object.keys(initial.ratings).length);

  function next(save: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await save();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStep((s) => s + 1);
    });
  }

  function finish() {
    startTransition(async () => {
      const result = await finishOnboarding();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.replace("/home");
    });
  }

  return (
    <div>
      <h1 className="marquee text-4xl sm:text-5xl">{t("onboarding.title")}</h1>
      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((key, i) => (
          <li key={key} className="space-y-1.5">
            <div className={cn("h-1 rounded-full bg-border", i <= step && "bg-primary")} />
            <span className={cn("text-xs text-muted-foreground", i === step && "text-foreground")}>{t(key)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-border bg-card/80 p-5 sm:p-7">
        {step === 0 && (
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              next(() => saveProfile({ username, displayName }));
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="displayName">{t("onboarding.displayNameLabel")}</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">{t("onboarding.usernameLabel")}</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  pattern="[a-z0-9_]{3,20}"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("onboarding.usernameHint")}</p>
            </div>
            <Button type="submit" disabled={pending} className="justify-self-end">
              {t("common.next")}
            </Button>
          </form>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <div>
              <h2 className="text-xl font-semibold">{t("onboarding.regionTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.regionBody")}</p>
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StepButtons pending={pending} onBack={() => setStep(0)} onNext={() => next(() => saveRegion(region))} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <div>
              <h2 className="text-xl font-semibold">{t("onboarding.servicesTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.servicesBody")}</p>
            </div>
            <ServicePicker region={region} selected={services} onChange={setServices} />
            <StepButtons pending={pending} onBack={() => setStep(1)} onNext={() => next(() => saveServices(services))} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t("onboarding.tasteTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboarding.tasteBody")}</p>
              </div>
              <div className="w-40 space-y-1 text-right text-xs text-muted-foreground">
                {t("onboarding.tasteProgress", { count: Math.min(rated, TASTE_GOAL) })}
                <Progress value={(Math.min(rated, TASTE_GOAL) / TASTE_GOAL) * 100} />
              </div>
            </div>
            <Link href="/import" className="text-sm text-primary underline-offset-4 hover:underline">
              {t("onboarding.importInstead")}
            </Link>
            <QuickRateGrid films={films} initial={initial.ratings} onCountChange={setRated} />
            <div className="sticky bottom-4 flex justify-between rounded-xl border border-border bg-background/90 p-3 backdrop-blur">
              <Button variant="ghost" onClick={() => setStep(2)}>
                {t("common.back")}
              </Button>
              <Button onClick={finish} disabled={pending}>
                {t("onboarding.finish")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepButtons({ pending, onBack, onNext }: { pending: boolean; onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between">
      <Button variant="ghost" onClick={onBack}>
        {t("common.back")}
      </Button>
      <Button onClick={onNext} disabled={pending}>
        {t("common.next")}
      </Button>
    </div>
  );
}
