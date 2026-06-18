import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createPlacement, deletePlacement, setPlacementStatus } from "@/lib/careers";
import type { PlacementStatus } from "@/lib/types";

const STATUSES: PlacementStatus[] = ["ready", "in_process", "placed"];

// Record a placement (also flips the learner's profile to "placed").
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.learnerId || !b.learnerName || !b.role || !b.company) {
    return NextResponse.json({ error: "learnerId, learnerName, role and company are required" }, { status: 400 });
  }
  const placement = await createPlacement({
    learnerId: String(b.learnerId), learnerName: String(b.learnerName), role: String(b.role),
    company: String(b.company), packageBand: String(b.packageBand || ""),
    date: String(b.date || new Date().toISOString().slice(0, 10)),
  });
  return NextResponse.json({ ok: true, placement });
}

// Set a learner's placement-profile status (ready | in_process | placed) + headline.
export async function PATCH(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.learnerId || !b.name || !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: "learnerId, name and valid status required" }, { status: 400 });
  }
  const profile = await setPlacementStatus(String(b.learnerId), String(b.name), b.status, b.headline !== undefined ? String(b.headline) : undefined);
  return NextResponse.json({ ok: true, profile });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  await deletePlacement(id);
  return NextResponse.json({ ok: true });
}
