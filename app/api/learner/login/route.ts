import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, setLearnerCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  const learner = (await readDB()).learners.find((l) => l.email.toLowerCase() === String(email).toLowerCase());
  if (!learner || !verifyPassword(String(password), learner.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  setLearnerCookie(learner.id);
  return NextResponse.json({ ok: true });
}
