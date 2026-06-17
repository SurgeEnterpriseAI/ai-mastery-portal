import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./auth";
import type {
  Trainer, Trainee, Session as SchedSession, Progress, OutboxMail,
  Learner, JourneyEvent, CoachSession, ChatMessage, HelpTicket, Payment,
} from "./types";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(5).toString("hex")}`;
}

const APP = "app";

// ---------------------------------------------------------------------------
// Seed (idempotent) — creates the trainer + app singleton on first use
// ---------------------------------------------------------------------------
let seeded = false;
export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  await prisma.trainer.upsert({
    where: { id: "trainer-1" },
    update: {},
    create: {
      id: "trainer-1",
      name: "Lead Trainer",
      email: process.env.TRAINER_EMAIL || "trainer@surgesoftware.co.in",
      passwordHash: hashPassword(process.env.TRAINER_PASSWORD || "teachai2026"),
    },
  });
  await prisma.appState.upsert({
    where: { id: APP },
    update: {},
    create: { id: APP, cohortName: "AI Mastery — Cohort 1", startDate: null, currentDay: 1, currentSlide: 0, completedDays: "[]", lastTaughtAt: null },
  });
  seeded = true;
}

// ---------------------------------------------------------------------------
// Mappers (Prisma row -> app type)
// ---------------------------------------------------------------------------
// Arrays are stored as JSON strings (portable across Postgres & SQLite).
function parseNums(v: string | null | undefined): number[] {
  try {
    const x = JSON.parse(v || "[]");
    return Array.isArray(x) ? (x as number[]) : [];
  } catch {
    return [];
  }
}
function parseArr<T>(v: string | null | undefined): T[] {
  try {
    const x = JSON.parse(v || "[]");
    return Array.isArray(x) ? (x as T[]) : [];
  } catch {
    return [];
  }
}

function mapLearner(l: any): Learner {
  return {
    id: l.id, name: l.name, email: l.email, passwordHash: l.passwordHash,
    background: l.background, goals: l.goals, level: l.level,
    handholdingCount: l.handholdingCount, approved: l.approved, paid: l.paid, plan: l.plan,
    completedDays: parseNums(l.completedDays),
    profileEmbedding: l.profileEmbedding ? (parseArr<number>(l.profileEmbedding)) : undefined,
    profileEmbeddingText: l.profileEmbeddingText || undefined,
    createdAt: l.createdAt,
    journey: (l.journey || []).map((j: any): JourneyEvent => ({ id: j.id, type: j.type, day: j.day ?? undefined, summary: j.summary, detail: j.detail ?? undefined, at: j.at })),
  };
}
function mapProgress(a: any): Progress {
  return { currentDay: a.currentDay, currentSlide: a.currentSlide, completedDays: parseNums(a.completedDays), lastTaughtAt: a.lastTaughtAt };
}

// ---------------------------------------------------------------------------
// Trainer / app state
// ---------------------------------------------------------------------------
export async function getTrainer(): Promise<Trainer> {
  await ensureSeed();
  const t = await prisma.trainer.findUniqueOrThrow({ where: { id: "trainer-1" } });
  return { id: t.id, name: t.name, email: t.email, passwordHash: t.passwordHash };
}
export async function updateTrainerPassword(hash: string): Promise<void> {
  await prisma.trainer.update({ where: { id: "trainer-1" }, data: { passwordHash: hash } });
}
export async function getAppState(): Promise<{ cohortName: string; startDate: string | null; progress: Progress }> {
  await ensureSeed();
  const a = await prisma.appState.findUniqueOrThrow({ where: { id: APP } });
  return { cohortName: a.cohortName, startDate: a.startDate, progress: mapProgress(a) };
}
export async function updateCohort(data: { cohortName?: string; startDate?: string | null }): Promise<{ cohortName: string; startDate: string | null }> {
  await ensureSeed();
  const a = await prisma.appState.update({
    where: { id: APP },
    data: {
      ...(typeof data.cohortName === "string" && data.cohortName.trim() ? { cohortName: data.cohortName.trim() } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate || null } : {}),
    },
  });
  return { cohortName: a.cohortName, startDate: a.startDate };
}
export async function setProgress(p: { currentDay?: number; currentSlide?: number }): Promise<Progress> {
  await ensureSeed();
  const a = await prisma.appState.update({
    where: { id: APP },
    data: {
      ...(typeof p.currentDay === "number" ? { currentDay: p.currentDay } : {}),
      ...(typeof p.currentSlide === "number" ? { currentSlide: p.currentSlide } : {}),
      lastTaughtAt: new Date().toISOString(),
    },
  });
  return mapProgress(a);
}
export async function completeCohortDay(day: number, totalDays: number): Promise<Progress> {
  await ensureSeed();
  return prisma.$transaction(async (tx) => {
    const a = await tx.appState.findUniqueOrThrow({ where: { id: APP } });
    const done = new Set(parseNums(a.completedDays));
    done.add(day);
    const updated = await tx.appState.update({
      where: { id: APP },
      data: {
        completedDays: JSON.stringify(Array.from(done).sort((x, y) => x - y)),
        currentDay: Math.min(day + 1, totalDays),
        currentSlide: 0,
        lastTaughtAt: new Date().toISOString(),
      },
    });
    await tx.scheduledSession.updateMany({ where: { day }, data: { status: "completed" } });
    return mapProgress(updated);
  });
}

// ---------------------------------------------------------------------------
// Trainees
// ---------------------------------------------------------------------------
export async function listTrainees(): Promise<Trainee[]> {
  return prisma.trainee.findMany({ orderBy: { addedAt: "asc" } });
}
export async function addTrainees(rawEmail: string, name?: string): Promise<Trainee[]> {
  const emails = String(rawEmail).split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
  const existing = new Set((await prisma.trainee.findMany({ select: { email: true } })).map((t) => t.email.toLowerCase()));
  for (const e of emails) {
    if (existing.has(e.toLowerCase())) continue;
    existing.add(e.toLowerCase());
    await prisma.trainee.create({ data: { id: newId("tr"), name: emails.length === 1 && name ? name : e.split("@")[0], email: e, addedAt: new Date().toISOString() } });
  }
  return listTrainees();
}
export async function deleteTrainee(id: string): Promise<Trainee[]> {
  await prisma.trainee.deleteMany({ where: { id } });
  return listTrainees();
}

// ---------------------------------------------------------------------------
// Scheduled sessions
// ---------------------------------------------------------------------------
function mapSched(s: any): SchedSession {
  return { id: s.id, day: s.day, date: s.date, time: s.time, title: s.title, status: s.status, invitesSent: s.invitesSent, createdAt: s.createdAt };
}
export async function listSessions(): Promise<SchedSession[]> {
  return (await prisma.scheduledSession.findMany()).map(mapSched).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
export async function createScheduledSession(day: number, date: string, time: string, title: string): Promise<SchedSession[]> {
  await prisma.scheduledSession.create({ data: { id: newId("sess"), day, date, time, title, status: "scheduled", invitesSent: false, createdAt: new Date().toISOString() } });
  return listSessions();
}
export async function deleteSession(id: string): Promise<SchedSession[]> {
  await prisma.scheduledSession.deleteMany({ where: { id } });
  return listSessions();
}
export async function getScheduledSession(id: string): Promise<SchedSession | null> {
  const s = await prisma.scheduledSession.findUnique({ where: { id } });
  return s ? mapSched(s) : null;
}
export async function markInvited(id: string): Promise<void> {
  await prisma.scheduledSession.update({ where: { id }, data: { invitesSent: true } });
}
export async function sessionsForDay(day: number): Promise<SchedSession[]> {
  return (await prisma.scheduledSession.findMany({ where: { day } })).map(mapSched);
}

// ---------------------------------------------------------------------------
// Learners
// ---------------------------------------------------------------------------
export async function getLearnerById(id: string): Promise<Learner | null> {
  const l = await prisma.learner.findUnique({ where: { id }, include: { journey: { orderBy: { at: "asc" } } } });
  return l ? mapLearner(l) : null;
}
export async function getLearnerByEmail(email: string): Promise<Learner | null> {
  // emails are stored lower-cased (portable case-insensitivity across Postgres/SQLite)
  const l = await prisma.learner.findFirst({ where: { email: email.trim().toLowerCase() }, include: { journey: true } });
  return l ? mapLearner(l) : null;
}
export async function learnerEmailExists(email: string): Promise<boolean> {
  return Boolean(await prisma.learner.findFirst({ where: { email: email.trim().toLowerCase() }, select: { id: true } }));
}
export async function createLearner(input: {
  id: string; name: string; email: string; passwordHash: string; background: string; goals: string; level: string;
}, journey: Omit<JourneyEvent, "day" | "detail">[]): Promise<Learner> {
  const l = await prisma.learner.create({
    data: {
      ...input, email: input.email.trim().toLowerCase(), handholdingCount: 0, approved: false, paid: false, plan: "free", completedDays: "[]", createdAt: new Date().toISOString(),
      journey: { create: journey.map((j) => ({ id: j.id, type: j.type, summary: j.summary, at: j.at })) },
    },
    include: { journey: true },
  });
  return mapLearner(l);
}
export async function updateLearnerProfile(id: string, data: { background?: string; goals?: string; level?: string }): Promise<Learner | null> {
  await prisma.learner.update({
    where: { id },
    data: {
      ...(typeof data.background === "string" ? { background: data.background.trim() } : {}),
      ...(typeof data.goals === "string" ? { goals: data.goals.trim() } : {}),
      ...(["beginner", "intermediate", "advanced", ""].includes(data.level || "_") ? { level: data.level } : {}),
    },
  });
  return getLearnerById(id);
}
export async function setLearnerEmbedding(id: string, vec: number[], text: string): Promise<void> {
  await prisma.learner.update({ where: { id }, data: { profileEmbedding: JSON.stringify(vec), profileEmbeddingText: text } });
}
export async function pushJourney(learnerId: string, event: Omit<JourneyEvent, "id" | "at">): Promise<void> {
  await prisma.journeyEvent.create({
    data: { id: newId("jrn"), learnerId, type: event.type, day: event.day ?? null, summary: event.summary, detail: event.detail ?? null, at: new Date().toISOString() },
  });
}

// ---------------------------------------------------------------------------
// Coach sessions + messages
// ---------------------------------------------------------------------------
export async function listCoachSessionMeta(learnerId: string): Promise<{ id: string; title: string; updatedAt: string; count: number }[]> {
  const rows = await prisma.coachSession.findMany({
    where: { learnerId }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { messages: true } } },
  });
  return rows.map((s) => ({ id: s.id, title: s.title, updatedAt: s.updatedAt, count: s._count.messages }));
}
export async function getCoachSession(id: string, learnerId: string): Promise<CoachSession | null> {
  const s = await prisma.coachSession.findFirst({ where: { id, learnerId }, include: { messages: { orderBy: { ord: "asc" } } } });
  if (!s) return null;
  return {
    id: s.id, learnerId: s.learnerId, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt,
    messages: s.messages.map((m): ChatMessage => ({ role: m.role as "user" | "assistant", content: m.content, at: m.at })),
  };
}
/** Creates a coaching session, increments the learner's count, logs a journey event — atomically. */
export async function createCoachSessionTx(learnerId: string, title: string): Promise<string> {
  const id = newId("cs");
  const now = new Date().toISOString();
  await prisma.$transaction([
    prisma.coachSession.create({ data: { id, learnerId, title, createdAt: now, updatedAt: now } }),
    prisma.learner.update({ where: { id: learnerId }, data: { handholdingCount: { increment: 1 } } }),
    prisma.journeyEvent.create({ data: { id: newId("jrn"), learnerId, type: "coach_session", summary: `Started ${title}`, at: now } }),
  ]);
  return id;
}
export async function appendMessage(sessionId: string, role: "user" | "assistant", content: string): Promise<void> {
  const at = new Date().toISOString();
  const ord = await prisma.chatMessage.count({ where: { sessionId } });
  await prisma.$transaction([
    prisma.chatMessage.create({ data: { sessionId, role, content, at, ord } }),
    prisma.coachSession.update({ where: { id: sessionId }, data: { updatedAt: at } }),
  ]);
}
export async function setSessionTitle(sessionId: string, title: string): Promise<void> {
  await prisma.coachSession.update({ where: { id: sessionId }, data: { title } });
}

export async function completeLearnerDay(learnerId: string, day: number, done: boolean, dayTitle: string): Promise<number[]> {
  return prisma.$transaction(async (tx) => {
    const l = await tx.learner.findUniqueOrThrow({ where: { id: learnerId } });
    const set = new Set(parseNums(l.completedDays));
    const has = set.has(day);
    if (done && !has) {
      set.add(day);
      await tx.journeyEvent.create({ data: { id: newId("jrn"), learnerId, type: "day_completed", day, summary: `Completed Day ${day}: ${dayTitle}`, at: new Date().toISOString() } });
    } else if (!done && has) {
      set.delete(day);
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    await tx.learner.update({ where: { id: learnerId }, data: { completedDays: JSON.stringify(arr) } });
    return arr;
  });
}

// ---------------------------------------------------------------------------
// Help tickets
// ---------------------------------------------------------------------------
function mapTicket(t: any): HelpTicket {
  return { id: t.id, learnerId: t.learnerId, learnerName: t.learnerName, learnerEmail: t.learnerEmail, coachSessionId: t.coachSessionId ?? undefined, question: t.question, context: t.context, status: t.status, response: t.response ?? undefined, createdAt: t.createdAt, resolvedAt: t.resolvedAt ?? undefined };
}
export async function createTicket(t: Omit<HelpTicket, "status" | "response" | "resolvedAt">): Promise<void> {
  await prisma.helpTicket.create({ data: { id: t.id, learnerId: t.learnerId, learnerName: t.learnerName, learnerEmail: t.learnerEmail, coachSessionId: t.coachSessionId ?? null, question: t.question, context: t.context, status: "open", createdAt: t.createdAt } });
}
export async function listTicketsForLearner(learnerId: string): Promise<HelpTicket[]> {
  return (await prisma.helpTicket.findMany({ where: { learnerId }, orderBy: { createdAt: "desc" } })).map(mapTicket);
}
export async function getTicket(id: string): Promise<HelpTicket | null> {
  const t = await prisma.helpTicket.findUnique({ where: { id } });
  return t ? mapTicket(t) : null;
}
export async function resolveTicket(id: string, response: string): Promise<void> {
  await prisma.helpTicket.update({ where: { id }, data: { status: "resolved", response, resolvedAt: new Date().toISOString() } });
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export async function createPayment(p: Omit<Payment, "paymentId" | "method" | "paidAt" | "status"> & { status?: string }): Promise<void> {
  await prisma.payment.create({ data: { id: p.id, learnerId: p.learnerId, orderId: p.orderId, amount: p.amount, currency: p.currency, status: "created", provider: p.provider, createdAt: p.createdAt } });
}
export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
  const p = await prisma.payment.findUnique({ where: { orderId } });
  if (!p) return null;
  return { id: p.id, learnerId: p.learnerId, orderId: p.orderId, paymentId: p.paymentId ?? undefined, amount: p.amount, currency: p.currency, status: p.status as Payment["status"], method: p.method ?? undefined, provider: p.provider as Payment["provider"], createdAt: p.createdAt, paidAt: p.paidAt ?? undefined };
}
/** Marks payment paid + unlocks learner (pro/approved) + logs journey, atomically. Idempotent. */
export async function unlockByOrderTx(orderId: string, opts: { paymentId?: string; method?: string }): Promise<{ ok: boolean; already?: boolean; reason?: string; learner?: Learner }> {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) return { ok: false, reason: "payment not found" };
  if (payment.status === "paid") return { ok: true, already: true };
  const exists = await prisma.learner.findUnique({ where: { id: payment.learnerId } });
  if (!exists) return { ok: false, reason: "learner not found" };
  const now = new Date().toISOString();
  const [, learner] = await prisma.$transaction([
    prisma.payment.update({ where: { orderId }, data: { status: "paid", paymentId: opts.paymentId ?? null, method: opts.method ?? null, paidAt: now } }),
    prisma.learner.update({ where: { id: payment.learnerId }, data: { paid: true, approved: true, plan: "pro" }, include: { journey: true } }),
    prisma.journeyEvent.create({ data: { id: newId("jrn"), learnerId: payment.learnerId, type: "payment", summary: "Upgraded to Pro — unlimited coaching unlocked", at: now } }),
  ]);
  return { ok: true, learner: mapLearner(learner) };
}

// ---------------------------------------------------------------------------
// Outbox + settings
// ---------------------------------------------------------------------------
export async function addOutbox(m: OutboxMail): Promise<void> {
  await prisma.outboxMail.create({ data: { id: m.id, to: JSON.stringify(m.to), subject: m.subject, body: m.body, sentAt: m.sentAt, delivered: m.delivered, via: m.via, kind: m.kind } });
}
export async function getSetting(key: string): Promise<unknown | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s) return null;
  try {
    return JSON.parse(s.value);
  } catch {
    return null;
  }
}
export async function setSetting(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.setting.upsert({ where: { key }, update: { value: v }, create: { key, value: v } });
}

// ---------------------------------------------------------------------------
// Trainer dashboard snapshot (reads only — safe to read everything)
// ---------------------------------------------------------------------------
export async function getTrainerSnapshot() {
  await ensureSeed();
  const [app, trainees, sessions, learners, tickets, payments, outbox] = await Promise.all([
    prisma.appState.findUniqueOrThrow({ where: { id: APP } }),
    listTrainees(),
    listSessions(),
    prisma.learner.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.helpTicket.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.outboxMail.findMany({ orderBy: { sentAt: "desc" }, take: 12 }),
  ]);
  return {
    cohortName: app.cohortName,
    startDate: app.startDate,
    progress: mapProgress(app),
    trainees,
    sessions,
    outbox: outbox.map((m) => ({ id: m.id, to: parseArr<string>(m.to), subject: m.subject, body: m.body, sentAt: m.sentAt, delivered: m.delivered, via: m.via, kind: m.kind })) as OutboxMail[],
    learners: learners.map((l) => ({ id: l.id, name: l.name, email: l.email, plan: l.plan, paid: l.paid, handholdingCount: l.handholdingCount, goals: l.goals, createdAt: l.createdAt })),
    tickets: tickets.map(mapTicket),
    payments: payments.map((p) => ({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, provider: p.provider, createdAt: p.createdAt })),
  };
}
