import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB, readDB } from "@/lib/db";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, response } = await req.json().catch(() => ({}));
  const db = await readDB();
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  await mutateDB((d) => {
    const t = d.tickets.find((x) => x.id === id);
    if (t) {
      t.status = "resolved";
      t.response = String(response || "").trim();
      t.resolvedAt = new Date().toISOString();
    }
  });

  if (response && String(response).trim()) {
    const portalUrl = `${new URL(req.url).origin}/learn`;
    await sendMail({
      to: [ticket.learnerEmail],
      subject: `💬 A trainer answered your question`,
      body: `Hi ${ticket.learnerName},\n\nYou asked:\n${ticket.question}\n\nA trainer replied:\n${String(response).trim()}\n\nBack to your journey: ${portalUrl}`,
      kind: "help",
    });
  }
  return NextResponse.json({ ok: true, message: "Ticket resolved" + (response ? " and learner emailed." : ".") });
}
