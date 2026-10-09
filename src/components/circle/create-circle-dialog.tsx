"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCircle } from "@/server/actions/circles";
import { t } from "@/i18n";

export function CreateCircleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"DUO" | "CREW">("CREW");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createCircle({ name, kind });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("circles.created"));
      router.push(`/circles/${result.data.circleId}?invite=1`);
    });
  }

  const kinds = [
    { id: "DUO" as const, icon: Heart, title: t("circles.duo"), body: t("circles.duoBody") },
    { id: "CREW" as const, icon: Users, title: t("circles.crew"), body: t("circles.crewBody") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t("circles.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="marquee text-3xl">{t("circles.create")}</DialogTitle>
        </DialogHeader>
        <form
          id="create-circle"
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="circle-name">{t("circles.nameLabel")}</Label>
            <Input
              id="circle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("circles.namePlaceholder")}
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium">{t("circles.kindLabel")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {kinds.map(({ id, icon: Icon, title, body }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={kind === id}
                  onClick={() => setKind(id)}
                  className={cn(
                    "rounded-xl border border-border p-3 text-left transition-colors",
                    kind === id && "border-primary bg-primary/10",
                  )}
                >
                  <Icon className="mb-2 size-5 text-primary" />
                  <span className="block font-semibold">{title}</span>
                  <span className="text-xs text-muted-foreground">{body}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          <Button type="submit" form="create-circle" disabled={pending || !name.trim()}>
            {t("circles.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
