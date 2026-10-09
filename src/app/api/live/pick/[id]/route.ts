import type { NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { getPickPulse } from "@/server/queries/pick";

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/live/pick/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pulse = await getPickPulse((await params).id, viewer.id);
  if (!pulse) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(pulse, { headers: { "Cache-Control": "no-store" } });
}
