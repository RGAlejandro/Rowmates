import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { getScreeningView } from "@/server/queries/screenings";
import { t } from "@/i18n";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
const GOLD = "#f9bb51";

function StarRow({ rating, size }: { rating: number; size: number }) {
  return (
    <div style={{ display: "flex", gap: size * 0.15 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const value = rating - (star - 1) * 2;
        const fill = value >= 2 ? 1 : value === 1 ? 0.5 : 0;
        return (
          <svg key={star} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`g${star}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset={fill} stopColor={GOLD} />
                <stop offset={fill} stopColor="rgba(255,255,255,0.15)" />
              </linearGradient>
            </defs>
            <path d={STAR} fill={`url(#g${star})`} />
          </svg>
        );
      })}
    </div>
  );
}

/** 1080×1920 story card of a revealed screening, for sharing on Instagram/TikTok. Members only. */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/og/reveal/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Unauthorized", { status: 401 });
  const view = await getScreeningView((await params).id, viewer.id);
  if (!view || view.status !== "REVEALED" || !view.summary) return new Response("Not found", { status: 404 });

  const label = view.summary.label === "DIVISIVE" ? t("screening.divisive") : view.summary.label === "UNANIMOUS" ? t("screening.unanimous") : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 96,
          color: "#f6f0e6",
          background: "radial-gradient(circle at 50% 0%, #4a3410 0%, #1a1012 45%, #0f0808 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 6, color: GOLD }}>ROWMATES · {view.circle.name.toUpperCase()}</div>
        <div style={{ display: "flex", marginTop: 80, fontSize: 44, color: "#ada397" }}>{t("screening.revealed")}</div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1, marginTop: 16 }}>{view.film.title}</div>
        {label ? (
          <div style={{ display: "flex", marginTop: 40 }}>
            <div style={{ display: "flex", background: "#b63039", borderRadius: 999, padding: "16px 36px", fontSize: 44 }}>{label}</div>
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 36, marginTop: 96 }}>
          {view.ratings.slice(0, 8).map((entry) => (
            <div key={entry.user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", fontSize: 56 }}>{entry.user.displayName.split(" ")[0]}</div>
              <StarRow rating={entry.rating} size={64} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, color: "#ada397" }}>{t("screening.average")}</div>
          <div style={{ display: "flex", fontSize: 160, fontWeight: 800, color: GOLD }}>{(view.summary.average / 2).toFixed(1)}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
