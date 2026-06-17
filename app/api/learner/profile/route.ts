import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { mutateDB } from "@/lib/db";

export async function POST(req: Request) {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { background, goals, level } = await req.json().catch(() => ({}));
  const db = await mutateDB((d) => {
    const l = d.learners.find((x) => x.id === id);
    if (!l) return;
    if (typeof background === "string") l.background = background.trim();
    if (typeof goals === "string") l.goals = goals.trim();
    if (["beginner", "intermediate", "advanced", ""].includes(level)) l.level = level;
  });
  const l = db.learners.find((x) => x.id === id);
  return NextResponse.json({ ok: true, profile: { background: l?.background, goals: l?.goals, level: l?.level } });
}
