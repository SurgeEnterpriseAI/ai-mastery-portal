import { NextResponse } from "next/server";
import { mutateDB, readDB, newId } from "@/lib/db";
import { hashPassword, setLearnerCookie } from "@/lib/auth";
import { sendMail, welcomeEmail } from "@/lib/email";
import { FREE_HANDHOLDING_LIMIT, type Learner } from "@/lib/types";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const rl = await rateLimit(`signup:${clientIp(req)}`, 5, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many sign-ups from this network. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { name, email, password, background, goals, level } = await req.json().catch(() => ({}));
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if ((await readDB()).learners.some((l) => l.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
  }

  const learner: Learner = {
    id: newId("lrn"),
    name: String(name).trim(),
    email: String(email).trim(),
    passwordHash: hashPassword(String(password)),
    background: String(background || "").trim(),
    goals: String(goals || "").trim(),
    level: ["beginner", "intermediate", "advanced"].includes(level) ? level : "",
    handholdingCount: 0,
    approved: false,
    paid: false,
    plan: "free",
    completedDays: [],
    journey: [
      { id: newId("jrn"), type: "signup", summary: `Joined AI Mastery`, at: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  };
  if (learner.goals) {
    learner.journey.push({ id: newId("jrn"), type: "goal_set", summary: `Goal: ${learner.goals}`, at: new Date().toISOString() });
  }

  await mutateDB((db) => db.learners.push(learner));
  setLearnerCookie(learner.id);

  const portalUrl = `${new URL(req.url).origin}/learn`;
  const { subject, body } = welcomeEmail({ name: learner.name, portalUrl, freeCount: FREE_HANDHOLDING_LIMIT });
  await sendMail({ to: [learner.email], subject, body, kind: "welcome" });

  return NextResponse.json({ ok: true });
}
