import crypto from "crypto";
import type { DB } from "./types";
import { hashPassword } from "./auth";
import { storeGet, storeSet } from "./store";

const DB_KEY = "aimp:db";

function defaultDB(): DB {
  return {
    trainer: {
      id: "trainer-1",
      name: "Lead Trainer",
      email: "trainer@surgesoftware.co.in",
      // default password: "teachai2026" — change after first login
      passwordHash: hashPassword("teachai2026"),
    },
    cohortName: "AI Mastery — Cohort 1",
    startDate: null,
    trainees: [],
    sessions: [],
    progress: { currentDay: 1, currentSlide: 0, completedDays: [], lastTaughtAt: null },
    outbox: [],
    learners: [],
    coachSessions: [],
    tickets: [],
    payments: [],
  };
}

// Backfill collections added after a DB was first created.
function migrate(db: DB): DB {
  db.learners ||= [];
  db.coachSessions ||= [];
  db.tickets ||= [];
  db.payments ||= [];
  db.outbox ||= [];
  return db;
}

export async function readDB(): Promise<DB> {
  const raw = await storeGet(DB_KEY);
  if (!raw) {
    const db = defaultDB();
    await storeSet(DB_KEY, JSON.stringify(db));
    return db;
  }
  try {
    return migrate(JSON.parse(raw) as DB);
  } catch {
    const db = defaultDB();
    await storeSet(DB_KEY, JSON.stringify(db));
    return db;
  }
}

export async function writeDB(db: DB): Promise<void> {
  await storeSet(DB_KEY, JSON.stringify(db));
}

/**
 * Read-modify-write. Last-write-wins (acceptable for low concurrency); for high
 * write volume, migrate to per-entity rows in Postgres.
 */
export async function mutateDB(fn: (db: DB) => void): Promise<DB> {
  const db = await readDB();
  fn(db);
  await writeDB(db);
  return db;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(5).toString("hex")}`;
}
