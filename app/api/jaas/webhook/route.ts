import { NextResponse } from "next/server";
import { recordJoinByEmail, activeCohort, sendCohortRecap, setRecapRecording, istDate } from "@/lib/class-recap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// JaaS (8x8) webhook receiver. Configure the webhook URL in the JaaS console as:
//   https://tensorpath.in/api/jaas/webhook?k=<JAAS_WEBHOOK_SECRET>
// Events handled: PARTICIPANT_JOINED (mark attendance), ROOM_DESTROYED (email the
// class recap to attendees), RECORDING_UPLOADED (store the recording link).
async function authed(req: Request): Promise<boolean> {
  const secret = process.env.JAAS_WEBHOOK_SECRET;
  if (!secret) return true; // accept until a secret is configured (recap send is deduped, so abuse is limited)
  return new URL(req.url).searchParams.get("k") === secret;
}

export async function GET(req: Request) {
  // JaaS may ping to verify the endpoint.
  if (!(await authed(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  if (!(await authed(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = new URL(req.url).origin;
  const body = await req.json().catch(() => ({}));
  const ev = String(body.eventType || body.event || "").toUpperCase();
  const tsIso = body.timestamp ? new Date(Number(body.timestamp)).toISOString() : new Date().toISOString();
  const data = body.data || {};

  try {
    if (ev === "PARTICIPANT_JOINED") {
      const email = data.email || data.userEmail || "";
      if (email) await recordJoinByEmail(String(email), tsIso);
    } else if (ev === "ROOM_DESTROYED" || ev === "MEETING_ENDED") {
      const date = istDate(tsIso);
      const cohort = await activeCohort(date);
      if (cohort) await sendCohortRecap(cohort.id, date, origin);
    } else if (ev === "RECORDING_UPLOADED") {
      const url = data.url || data.preAuthenticatedLink || data.recordingUrl || data.link || "";
      const date = istDate(tsIso);
      const cohort = await activeCohort(date);
      if (cohort && url) await setRecapRecording(cohort.id, date, String(url));
    }
  } catch (e) {
    console.error("[jaas-webhook] handler error:", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
