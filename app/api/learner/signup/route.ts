import { NextResponse } from "next/server";
import { newId, learnerEmailExists, createLearner } from "@/lib/data";
import { hashPassword, setLearnerCookie } from "@/lib/auth";
import { sendMail, welcomeEmail } from "@/lib/email";
import { FREE_HANDHOLDING_LIMIT, type JourneyEvent } from "@/lib/types";
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
  if (await learnerEmailExists(String(email))) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
  }

  const id = newId("lrn");
  const goalsStr = String(goals || "").trim();
  const now = new Date().toISOString();
  const journey: Omit<JourneyEvent, "day" | "detail">[] = [{ id: newId("jrn"), type: "signup", summary: "Joined Tensorpath", at: now }];
  if (goalsStr) journey.push({ id: newId("jrn"), type: "goal_set", summary: `Goal: ${goalsStr}`, at: now });

  const learner = await createLearner(
    {
      id,
      name: String(name).trim(),
      email: String(email).trim(),
      passwordHash: hashPassword(String(password)),
      background: String(background || "").trim(),
      goals: goalsStr,
      level: ["beginner", "intermediate", "advanced"].includes(level) ? level : "",
    },
    journey,
  );
  setLearnerCookie(learner.id);

  const portalUrl = `${new URL(req.url).origin}/learn`;
  const { subject, body } = welcomeEmail({ name: learner.name, portalUrl, freeCount: FREE_HANDHOLDING_LIMIT });
  await sendMail({ to: [learner.email], subject, body, kind: "welcome" });

  return NextResponse.json({ ok: true });
}
