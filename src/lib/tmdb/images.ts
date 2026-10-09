const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";
export type LogoSize = "w45" | "w92" | "w154";

export function posterUrl(path: string | null | undefined, size: PosterSize = "w342"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null | undefined, size: BackdropSize = "w1280"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function logoUrl(path: string | null | undefined, size: LogoSize = "w92"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
