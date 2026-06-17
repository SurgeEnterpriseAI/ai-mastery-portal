import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { mutateDB, readDB } from "@/lib/db";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (!current || !next) return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  if (String(next).length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  const db = await readDB();
  if (!verifyPassword(String(current), db.trainer.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  await mutateDB((d) => {
    d.trainer.passwordHash = hashPassword(String(next));
  });
  return NextResponse.json({ ok: true, message: "Password updated." });
}
