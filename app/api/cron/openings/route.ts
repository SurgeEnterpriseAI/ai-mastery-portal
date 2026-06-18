import { NextResponse } from "next/server";
import { ingestOpenings } from "@/lib/jobs-ingest";
import { getSessionTrainerId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily refresh of AI openings (Vercel Cron). Also runnable manually by signed-in staff.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authed =
    (secret && req.headers.get("authorization") === `Bearer ${secret}`) || // Vercel Cron
    Boolean(getSessionTrainerId()); // staff triggering manually
  if (secret && !authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await ingestOpenings();
  return NextResponse.json(result);
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
