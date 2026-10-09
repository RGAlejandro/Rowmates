import type { NextRequest } from "next/server";
import Papa from "papaparse";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

/**
 * "Your data is yours": full JSON export, or a diary CSV using Letterboxd's
 * import columns so people can move back with one upload.
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Unauthorized", { status: 401 });
  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  const logs = await db.logEntry.findMany({
    where: { userId: viewer.id },
    orderBy: [{ watchedOn: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    include: { film: { select: { tmdbId: true, title: true, year: true } } },
  });

  if (format === "csv") {
    const csv = Papa.unparse(
      logs.map((log) => ({
        tmdbID: log.film.tmdbId,
        Title: log.film.title,
        Year: log.film.year ?? "",
        Rating: log.rating ? log.rating / 2 : "",
        WatchedDate: isoDate(log.watchedOn),
        Rewatch: log.isRewatch ? "Yes" : "",
        Review: log.review ?? "",
      })),
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rowmates-diary-${viewer.username}.csv"`,
      },
    });
  }

  const [user, watchlist, favorites, memberships] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: viewer.id }, select: { username: true, displayName: true, bio: true, region: true, createdAt: true } }),
    db.watchlistItem.findMany({ where: { userId: viewer.id }, include: { film: { select: { tmdbId: true, title: true, year: true } } } }),
    db.favoriteFilm.findMany({ where: { userId: viewer.id }, orderBy: { position: "asc" }, include: { film: { select: { tmdbId: true, title: true } } } }),
    db.circleMember.findMany({ where: { userId: viewer.id }, include: { circle: { select: { name: true, kind: true } } } }),
  ]);

  const body = {
    exportedAt: new Date().toISOString(),
    user,
    diary: logs.map((log) => ({
      tmdbId: log.film.tmdbId,
      title: log.film.title,
      year: log.film.year,
      watchedOn: isoDate(log.watchedOn) || null,
      rating: log.rating,
      liked: log.liked,
      rewatch: log.isRewatch,
      review: log.review,
      hasSpoilers: log.hasSpoilers,
      loggedAt: log.createdAt.toISOString(),
    })),
    watchlist: watchlist.map((w) => ({ tmdbId: w.film.tmdbId, title: w.film.title, year: w.film.year, addedAt: w.addedAt.toISOString() })),
    favorites: favorites.map((f) => ({ position: f.position, tmdbId: f.film.tmdbId, title: f.film.title })),
    circles: memberships.map((m) => ({ name: m.circle.name, kind: m.circle.kind, role: m.role, joinedAt: m.joinedAt.toISOString() })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="rowmates-export-${viewer.username}.json"`,
    },
  });
}
