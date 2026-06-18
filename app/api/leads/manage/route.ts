import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { getLead, setLeadStatus, setLeadNotes, markLeadConverted } from "@/lib/data";
import { sendMail, enrollInviteEmail } from "@/lib/email";

const STATUSES = ["new", "contacted", "enrolled", "dropped"] as const;

// Staff — update a lead's status or notes.
export async function PATCH(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, notes } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let lead = await getLead(String(id));
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (typeof notes === "string") lead = (await setLeadNotes(lead.id, notes)) || lead;
  if (status && (STATUSES as readonly string[]).includes(status)) lead = (await setLeadStatus(lead.id, status)) || lead;

  return NextResponse.json({ ok: true, lead });
}

// Staff — convert a lead to a student: email an enroll invite and mark Enrolled.
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const lead = await getLead(String(id));
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const origin = new URL(req.url).origin;
  const joinUrl = `${origin}/join?email=${encodeURIComponent(lead.email)}`;
  const invite = enrollInviteEmail({ name: lead.name, joinUrl });
  const { delivered, via } = await sendMail({ to: [lead.email], subject: invite.subject, body: invite.body, kind: "enroll" });

  const updated = await markLeadConverted(lead.id, null);
  return NextResponse.json({ ok: true, lead: updated, invite: { delivered, via, joinUrl } });
}
