import type { NextRequest } from "next/server";
import { getProviderList } from "@/lib/tmdb/api";

/** Streaming services available in a region (for onboarding and settings pickers). */
export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? "US";
  if (!/^[A-Z]{2}$/.test(region)) return Response.json({ results: [] }, { status: 400 });
  const providers = await getProviderList(region);
  return Response.json({
    results: providers.slice(0, 40).map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path })),
  });
}
