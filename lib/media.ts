import { prisma, newId } from "./data";
import type { MediaItem } from "./types";

function arr<T>(v: string | null | undefined): T[] {
  try { const x = JSON.parse(v || "[]"); return Array.isArray(x) ? x : []; } catch { return []; }
}
function mapMedia(m: any): MediaItem {
  return {
    id: m.id, type: m.type, title: m.title, description: m.description,
    roleId: m.roleId ?? undefined, url: m.url, gatedLevel: m.gatedLevel,
    tags: arr<string>(m.tags), sortOrder: m.sortOrder, createdAt: m.createdAt,
  };
}

export async function listMedia(type?: "interview" | "orientation"): Promise<MediaItem[]> {
  return (await prisma.media.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })).map(mapMedia);
}
export async function createMedia(input: Omit<MediaItem, "id" | "createdAt">): Promise<MediaItem> {
  const m = await prisma.media.create({
    data: {
      id: newId("media"), createdAt: new Date().toISOString(),
      type: input.type, title: input.title, description: input.description,
      roleId: input.roleId || null, url: input.url, gatedLevel: input.gatedLevel,
      tags: JSON.stringify(input.tags || []), sortOrder: input.sortOrder ?? 0,
    },
  });
  return mapMedia(m);
}
export async function deleteMedia(id: string): Promise<void> {
  await prisma.media.deleteMany({ where: { id } });
}

/** Turn a YouTube/Vimeo watch URL into an embeddable URL; otherwise return null. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) return url;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}
