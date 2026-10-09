"use client";

import { useState, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ServicePicker, type Service } from "@/components/onboarding/service-picker";
import { deleteAccount, updateSettings } from "@/server/actions/settings";
import { saveRegion, saveServices } from "@/server/actions/onboarding";
import { t } from "@/i18n";

export function ProfileSettingsForm({
  initial,
}: {
  initial: { username: string; displayName: string; bio: string; isPrivate: boolean };
}) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateSettings(form);
          if (result.ok) toast.success(t("settings.saved"));
          else toast.error(result.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="displayName">{t("onboarding.displayNameLabel")}</Label>
          <Input id="displayName" value={form.displayName} maxLength={50} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="username">{t("onboarding.usernameLabel")}</Label>
          <Input
            id="username"
            value={form.username}
            pattern="[a-z0-9_]{3,20}"
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bio">{t("settings.bio")}</Label>
        <Textarea id="bio" rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <label className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <span>
          <span className="block font-medium">{t("settings.privateProfile")}</span>
          <span className="text-sm text-muted-foreground">{t("settings.privateProfileBody")}</span>
        </span>
        <Switch checked={form.isPrivate} onCheckedChange={(isPrivate) => setForm({ ...form, isPrivate })} />
      </label>
      <Button type="submit" disabled={pending} className="justify-self-end">
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

export function RegionServicesForm({
  initialRegion,
  initialServices,
  regions,
}: {
  initialRegion: string;
  initialServices: Service[];
  regions: { code: string; name: string }[];
}) {
  const [region, setRegion] = useState(initialRegion);
  const [services, setServices] = useState(initialServices);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label>{t("settings.region")}</Label>
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
      </div>
      <div className="grid gap-1.5">
        <Label>{t("settings.services")}</Label>
        <ServicePicker region={region} selected={services} onChange={setServices} />
      </div>
      <Button
        disabled={pending}
        className="justify-self-end"
        onClick={() =>
          startTransition(async () => {
            const [a, b] = await Promise.all([saveRegion(region), saveServices(services)]);
            if (a.ok && b.ok) toast.success(t("settings.saved"));
            else toast.error(t("common.somethingWrong"));
          })
        }
      >
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </div>
  );
}

export function DeleteAccountButton() {
  const { signOut } = useClerk();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{t("settings.deleteAccount")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.deleteAccount")}</AlertDialogTitle>
          <AlertDialogDescription>{t("settings.deleteConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteAccount();
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                await signOut({ redirectUrl: "/" });
              })
            }
          >
            {t("settings.deleteAccount")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
