import { NextResponse } from "next/server";
import { getCurrentLearner } from "@/lib/learner";
import { setLearnerPassword } from "@/lib/data";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Change password for a signed-in learner (requires the current password).
export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  if (String(newPassword).length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  if (!verifyPassword(String(currentPassword), learner.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  await setLearnerPassword(learner.id, hashPassword(String(newPassword)));
  return NextResponse.json({ ok: true });
}
