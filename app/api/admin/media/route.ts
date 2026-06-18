import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createMedia, deleteMedia } from "@/lib/media";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.title || !b.url) return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
  const media = await createMedia({
    type: b.type === "orientation" ? "orientation" : "interview",
    title: String(b.title), description: String(b.description || ""),
    roleId: b.roleId || undefined, url: String(b.url),
    gatedLevel: ["public", "enrolled", "certified"].includes(b.gatedLevel) ? b.gatedLevel : "enrolled",
    tags: typeof b.tags === "string" ? b.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(b.tags) ? b.tags : []),
    sortOrder: Number(b.sortOrder) || 0,
  });
  return NextResponse.json({ ok: true, media });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  await deleteMedia(id);
  return NextResponse.json({ ok: true });
}
