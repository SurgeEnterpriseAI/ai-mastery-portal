import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.PORTAL_SECRET || "dev-secret-change-me-ai-mastery-portal";
const COOKIE = "aimp_session";
const LEARNER_COOKIE = "aimp_learner";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function createSessionToken(trainerId: string): string {
  const payload = `${trainerId}.${Date.now()}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [trainerId, ts, sig] = parts;
  const expected = sign(`${trainerId}.${ts}`);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return trainerId;
}

export function setSessionCookie(trainerId: string) {
  cookies().set(COOKIE, createSessionToken(trainerId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function getSessionTrainerId(): string | null {
  const token = cookies().get(COOKIE)?.value;
  return verifySessionToken(token);
}

// ---- learner sessions (separate cookie) ----

export function setLearnerCookie(learnerId: string) {
  cookies().set(LEARNER_COOKIE, createSessionToken(learnerId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearLearnerCookie() {
  cookies().set(LEARNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function getSessionLearnerId(): string | null {
  const token = cookies().get(LEARNER_COOKIE)?.value;
  return verifySessionToken(token);
}
