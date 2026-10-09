import type { NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { getScreeningPulse } from "@/server/queries/screenings";

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/live/screening/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pulse = await getScreeningPulse((await params).id, viewer.id);
  if (!pulse) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(pulse, { headers: { "Cache-Control": "no-store" } });
}
