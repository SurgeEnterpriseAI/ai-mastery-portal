import { NextResponse } from "next/server";
import { prisma, leadStats } from "@/lib/data";
import { placementStats } from "@/lib/careers";

export const dynamic = "force-dynamic";

// Temporary, token-guarded, COUNTS-ONLY endpoint (no PII) for a quick stats read.
const KEY = "tp-stats-3f9c2a17b8e4";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [learners, leads, cohorts, confirmed, invited, declined, certs, placements, openOpenings, coachSessions] = await Promise.all([
    prisma.learner.count(),
    leadStats(),
    prisma.cohort.count(),
    prisma.learner.count({ where: { batchStatus: "confirmed" } }),
    prisma.learner.count({ where: { batchStatus: "invited" } }),
    prisma.learner.count({ where: { batchStatus: "declined" } }),
    prisma.certificate.count({ where: { status: "valid" } }),
    prisma.placement.count(),
    prisma.opening.count({ where: { status: "open" } }),
    prisma.coachSession.count(),
  ]);
  const placement = await placementStats();
  return NextResponse.json({
    learners,
    leads,
    cohorts,
    batch: { confirmed, invited, declined },
    certified: certs,
    placements,
    placedPctOfCertified: placement.placedPct,
    openOpenings,
    coachSessions,
    at: new Date().toISOString(),
  });
}
