import { NextResponse } from "next/server";
import { prisma } from "@/lib/data";

export const dynamic = "force-dynamic";

// TEMPORARY counts-only endpoint (token-guarded). Used to read live numbers, then removed.
const TOKEN = "tp-stats-7b3e91c4d2a8";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const [learners, byBatch, leads, certified, placements, cohorts] = await Promise.all([
    prisma.learner.count(),
    prisma.learner.groupBy({ by: ["batchStatus"], _count: true }).catch(() => []),
    prisma.lead.count(),
    prisma.certificate.count({ where: { status: "valid" } }).catch(() => 0),
    prisma.placement.count().catch(() => 0),
    prisma.cohort.count().catch(() => 0),
  ]);
  const batch: Record<string, number> = {};
  for (const r of byBatch as Array<{ batchStatus: string | null; _count: number }>) {
    batch[r.batchStatus || "none"] = r._count;
  }
  return NextResponse.json({ registrations: learners, batch, leads, certified, placements, cohorts });
}
