import type { PickReason } from "@/lib/pick/score";
import { plural, t } from "@/i18n";

/** Human-readable "why this film" chips for a Pick Night candidate. */
export function reasonLabel(reason: PickReason): string {
  switch (reason.key) {
    case "watchlists":
      return plural("pick.reasonWatchlists", reason.count);
    case "circleList":
      return t("pick.reasonCircleList");
    case "streaming":
      return t("pick.reasonStreaming", { service: reason.service });
    case "taste":
      return t("pick.reasonTaste", { name: reason.name });
    case "groupTaste":
      return t("pick.reasonGroupTaste");
    case "popular":
      return t("pick.reasonPopular");
  }
}
