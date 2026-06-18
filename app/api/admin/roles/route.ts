import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { upsertJobRole, getJobRole, deleteJobRole } from "@/lib/careers";

// Upsert a role (create new or edit salary/demand/skills). Identified by slug.
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const slug = String(b.slug || "").trim();
  const title = String(b.title || "").trim();
  if (!slug || !title) return NextResponse.json({ error: "slug and title required" }, { status: 400 });

  const existing = await getJobRole(slug);
  const role = await upsertJobRole({
    slug, title,
    description: b.description ?? existing?.description ?? "",
    skills: Array.isArray(b.skills) ? b.skills : (typeof b.skills === "string" ? b.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : existing?.skills ?? []),
    curriculumDays: Array.isArray(b.curriculumDays) ? b.curriculumDays : (typeof b.curriculumDays === "string" ? b.curriculumDays.split(",").map((s: string) => Number(s.trim())).filter((n: number) => n >= 1 && n <= 20) : existing?.curriculumDays ?? []),
    level: ["entry", "mid", "senior"].includes(b.level) ? b.level : existing?.level ?? "entry",
    salaryBand: b.salaryBand ?? existing?.salaryBand ?? "",
    demandNotes: b.demandNotes ?? existing?.demandNotes ?? "",
    capstoneFit: b.capstoneFit ?? existing?.capstoneFit ?? "",
    sortOrder: b.sortOrder ?? existing?.sortOrder ?? 0,
  });
  return NextResponse.json({ ok: true, role });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") || "";
  await deleteJobRole(slug);
  return NextResponse.json({ ok: true });
}
