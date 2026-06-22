import { NextResponse } from "next/server";
import { prisma } from "@/lib/data";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded registrations dump. Read once, then removed.
const TOKEN = "tp-reg-5d9a14f8c7b2";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const learners = await prisma.learner.findMany({
    orderBy: { createdAt: "asc" },
    select: { name: true, email: true, createdAt: true, batchStatus: true, plan: true, paid: true, completedDays: true, cohortId: true },
  });
  const rows = learners.map((l) => ({
    name: l.name,
    email: l.email,
    createdAt: l.createdAt,
    batch: l.batchStatus || "none",
    plan: l.plan,
    paid: l.paid,
    done: (() => { try { return (JSON.parse(l.completedDays || "[]") as number[]).length; } catch { return 0; } })(),
  }));
  return NextResponse.json({ total: rows.length, rows });
}
