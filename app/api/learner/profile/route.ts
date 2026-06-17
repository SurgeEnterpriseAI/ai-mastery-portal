import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { updateLearnerProfile } from "@/lib/data";

export async function POST(req: Request) {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { background, goals, level } = await req.json().catch(() => ({}));
  const l = await updateLearnerProfile(id, { background, goals, level });
  return NextResponse.json({ ok: true, profile: { background: l?.background, goals: l?.goals, level: l?.level } });
}
