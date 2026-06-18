import { NextResponse } from "next/server";
import { ingestOpenings } from "@/lib/jobs-ingest";
import { reseedIndiaOpenings } from "@/lib/seed-demo";
import { getSessionTrainerId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled refresh of AI openings (Vercel Cron, every 3 days). Also runnable
// manually by signed-in staff. Refreshes both the live RemoteOK feed and the
// curated India job-search listings.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authed =
    (secret && req.headers.get("authorization") === `Bearer ${secret}`) || // Vercel Cron
    Boolean(getSessionTrainerId()); // staff triggering manually
  if (secret && !authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const india = await reseedIndiaOpenings();
  const result = await ingestOpenings();
  return NextResponse.json({ ...result, indiaListings: india });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
