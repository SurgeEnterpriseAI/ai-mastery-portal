import { NextResponse } from "next/server";
import { getSessionTrainerId, hashPassword, verifyPassword } from "@/lib/auth";
import { getTrainer, updateTrainerPassword } from "@/lib/data";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (!current || !next) return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  if (String(next).length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  const trainer = await getTrainer();
  if (!verifyPassword(String(current), trainer.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  await updateTrainerPassword(hashPassword(String(next)));
  return NextResponse.json({ ok: true, message: "Password updated." });
}
