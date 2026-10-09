import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui-extras";
import { DeleteAccountButton, ProfileSettingsForm, RegionServicesForm } from "@/components/settings/settings-forms";
import { requireViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRegions } from "@/lib/tmdb/api";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("settings.title") };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const [user, regions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: viewer.id },
      select: { bio: true, isPrivate: true, services: { select: { providerId: true, providerName: true, logoPath: true } } },
    }),
    getRegions(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title={t("settings.title")} />
      <Card title={t("settings.profile")}>
        <ProfileSettingsForm
          initial={{ username: viewer.username, displayName: viewer.displayName, bio: user.bio ?? "", isPrivate: user.isPrivate }}
        />
      </Card>
      <Card title={t("settings.services")}>
        <RegionServicesForm
          initialRegion={viewer.region}
          initialServices={user.services.map((s) => ({ id: s.providerId, name: s.providerName, logoPath: s.logoPath }))}
          regions={regions.map((r) => ({ code: r.iso_3166_1, name: r.english_name }))}
        />
      </Card>
      <Card title={t("settings.data")}>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/api/export?format=json" download>
              <Download /> {t("settings.exportJson")}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/export?format=csv" download>
              <Download /> {t("settings.exportCsv")}
            </a>
          </Button>
        </div>
      </Card>
      <Card title={t("settings.dangerZone")}>
        <DeleteAccountButton />
      </Card>
    </div>
  );
}
