import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createOpening, setOpeningStatus, deleteOpening, listNotifyCandidates } from "@/lib/careers";
import { sendMail, newOpeningEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.title || !b.company) return NextResponse.json({ error: "Title and company are required" }, { status: 400 });
  const opening = await createOpening({
    roleId: b.roleId || undefined,
    title: String(b.title), company: String(b.company), location: String(b.location || ""),
    mode: ["onsite", "remote", "hybrid"].includes(b.mode) ? b.mode : "onsite",
    packageBand: String(b.packageBand || ""), applyUrl: b.applyUrl ? String(b.applyUrl) : undefined,
  });

  // Module H — notify placement-ready candidates when explicitly asked.
  let notified = 0;
  if (b.notify) {
    const origin = new URL(req.url).origin;
    const candidates = await listNotifyCandidates();
    for (const c of candidates) {
      const m = newOpeningEmail({ name: c.name, roleTitle: opening.title, company: opening.company, portalUrl: origin });
      await sendMail({ to: [c.email], subject: m.subject, body: m.body, kind: "announcement" });
      notified++;
    }
  }
  return NextResponse.json({ ok: true, opening, notified });
}

export async function PATCH(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!id || !["open", "closed"].includes(status)) return NextResponse.json({ error: "id + valid status required" }, { status: 400 });
  await setOpeningStatus(String(id), status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  await deleteOpening(id);
  return NextResponse.json({ ok: true });
}
