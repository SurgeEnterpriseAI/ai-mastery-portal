import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/data";
import { getSessionTrainerId } from "@/lib/auth";
import { sendMail, leadAckEmail, leadNotifyEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const BACKGROUNDS = ["student", "working_professional", "surge_track", "other"];

// Public — capture an enquiry. Auto-tags Surge cross-sell when source=surge.
export async function POST(req: Request) {
  const rl = await rateLimit(`lead:${clientIp(req)}`, 6, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many submissions from this network. Try again in ${rl.retryAfter}s.` }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const phone = String(b.phone || "").trim();
  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Name, email and phone are required." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  // India phone: 10 digits, optional +91/0 prefix
  if (!/^(\+?91[-\s]?)?[0]?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""))) {
    return NextResponse.json({ error: "Please enter a valid Indian phone number." }, { status: 400 });
  }
  if (!b.consent) {
    return NextResponse.json({ error: "Please agree to be contacted to continue." }, { status: 400 });
  }

  // Whitelist the source so a malformed/abusive link can't pollute analytics.
  const src = String(b.src || b.source || "").toLowerCase();
  const ALLOWED_SOURCES = ["organic", "surge_crosssell", "linkedin", "whatsapp", "ad", "referral"];
  const source = src === "surge" ? "surge_crosssell" : ALLOWED_SOURCES.includes(src) ? src : "organic";
  const background = BACKGROUNDS.includes(b.background) ? b.background : "other";

  const lead = await createLead({
    name, email, phone, background,
    interest: String(b.interest || "").trim().slice(0, 500),
    heardFrom: String(b.heardFrom || "").trim().slice(0, 200),
    source,
    consent: true,
  });

  const origin = new URL(req.url).origin;
  // Acknowledge the prospect + notify staff (best-effort; never block the response on mail).
  const ack = leadAckEmail({ name: lead.name, portalUrl: origin });
  await sendMail({ to: [lead.email], subject: ack.subject, body: ack.body, kind: "lead" });
  const adminEmail = process.env.ADMIN_EMAIL || process.env.TRAINER_EMAIL || "venumuvva@gmail.com";
  const notify = leadNotifyEmail({ ...lead, portalUrl: origin });
  await sendMail({ to: [adminEmail], subject: notify.subject, body: notify.body, kind: "lead" });

  return NextResponse.json({ ok: true });
}

// Staff — list leads (optionally filtered by source).
export async function GET(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const source = new URL(req.url).searchParams.get("source") || undefined;
  return NextResponse.json({ leads: await listLeads(source || undefined) });
}
