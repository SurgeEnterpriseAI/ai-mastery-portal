import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { getTicket, resolveTicket } from "@/lib/data";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, response } = await req.json().catch(() => ({}));
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  await resolveTicket(id, String(response || "").trim());

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
