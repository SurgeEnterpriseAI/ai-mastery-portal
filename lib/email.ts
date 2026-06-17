import nodemailer from "nodemailer";
import { addOutbox, newId } from "./data";
import type { OutboxMail } from "./types";

interface SendArgs {
  to: string[];
  subject: string;
  body: string; // plain-ish text / light HTML
  kind: OutboxMail["kind"];
}

const FROM = () => process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "AI Mastery <onboarding@resend.dev>";

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendViaResend(to: string[], subject: string, body: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM(),
        to,
        subject,
        html: `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.6">${body.replace(/\n/g, "<br/>")}</div>`,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] Resend error:", (e as Error).message);
    return false;
  }
}

/**
 * Delivery order: Resend (RESEND_API_KEY) → SMTP (SMTP_HOST/USER/PASS) → in-app Outbox.
 * The portal is fully runnable with zero config — without keys, mail lands in the Outbox.
 * Every message is always logged to the outbox for the audit trail.
 */
export async function sendMail({ to, subject, body, kind }: SendArgs): Promise<{ delivered: boolean; via: OutboxMail["via"] }> {
  let delivered = false;
  let via: OutboxMail["via"] = "outbox";

  if (to.length > 0 && (await sendViaResend(to, subject, body))) {
    delivered = true;
    via = "resend";
  } else if (to.length > 0) {
    const transport = getSmtpTransport();
    if (transport) {
      try {
        await transport.sendMail({ from: FROM(), to: to.join(", "), subject, html: body.replace(/\n/g, "<br/>") });
        delivered = true;
        via = "smtp";
      } catch (e) {
        console.error("[email] SMTP send failed, falling back to outbox:", (e as Error).message);
      }
    }
  }

  const record: OutboxMail = {
    id: newId("mail"),
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    delivered,
    via,
    kind,
  };
  await addOutbox(record);
  return { delivered, via };
}

export function inviteEmail(args: {
  cohortName: string;
  dayNumber: number;
  dayTitle: string;
  date: string;
  time: string;
  portalUrl: string;
}) {
  const subject = `📅 ${args.cohortName} — Day ${args.dayNumber}: ${args.dayTitle} (${args.date} @ ${args.time})`;
  const body =
    `Hello,\n\n` +
    `You're invited to the next live session of "${args.cohortName}".\n\n` +
    `🧠 Day ${args.dayNumber}: ${args.dayTitle}\n` +
    `🗓️  Date: ${args.date}\n` +
    `⏰ Time: ${args.time}\n\n` +
    `Join the session here: ${args.portalUrl}\n\n` +
    `The session will pick up exactly where we left off. See you there!\n\n` +
    `— ${args.cohortName} Trainer`;
  return { subject, body };
}

export function welcomeEmail(args: { name: string; portalUrl: string; freeCount: number }) {
  const subject = `🎓 Welcome to AI Mastery, ${args.name}!`;
  const body =
    `Hi ${args.name},\n\n` +
    `Welcome aboard! Your personal AI learning journey starts now.\n\n` +
    `You have a personal AI coach that will hand-hold you through the entire program — answering questions, ` +
    `giving you scenarios and materials, and recommending exactly what to learn next based on your goals.\n\n` +
    `🎁 Your first ${args.freeCount} coaching sessions are on us.\n\n` +
    `Start here: ${args.portalUrl}\n\n` +
    `— The AI Mastery team`;
  return { subject, body };
}

export function paymentReceiptEmail(args: { name: string; amount: number; currency: string; portalUrl: string }) {
  const amt = `${args.currency === "INR" ? "₹" : ""}${(args.amount / 100).toFixed(2)}`;
  const subject = `✅ Payment received — AI Mastery Pro unlocked`;
  const body =
    `Hi ${args.name},\n\n` +
    `We've received your payment of ${amt}. Your account is now fully unlocked — ` +
    `unlimited AI coaching, personalised guidance, and human help whenever you need it.\n\n` +
    `Jump back in: ${args.portalUrl}\n\n` +
    `Thank you for investing in your growth. — The AI Mastery team`;
  return { subject, body };
}

export function helpRequestEmail(args: {
  trainerEmail: string;
  learnerName: string;
  learnerEmail: string;
  question: string;
  context: string;
  portalUrl: string;
}) {
  const subject = `🙋 Human help requested by ${args.learnerName}`;
  const body =
    `A learner has asked for human help during their AI coaching session.\n\n` +
    `👤 ${args.learnerName} (${args.learnerEmail})\n\n` +
    `❓ Their question:\n${args.question}\n\n` +
    `🧭 What the coach was discussing:\n${args.context}\n\n` +
    `Respond from the trainer console: ${args.portalUrl}`;
  return { subject, body };
}

export function announcementEmail(args: {
  cohortName: string;
  dayNumber: number;
  dayTitle: string;
  teaser: string;
  date?: string;
  time?: string;
  portalUrl: string;
}) {
  const when = args.date ? `\n🗓️  Next session: ${args.date}${args.time ? ` @ ${args.time}` : ""}\n` : "";
  const subject = `🚀 Coming up next — Day ${args.dayNumber}: ${args.dayTitle}`;
  const body =
    `Hello team,\n\n` +
    `Great work today! Here's a taste of what's coming next in "${args.cohortName}":\n\n` +
    `🧠 Day ${args.dayNumber}: ${args.dayTitle}\n\n` +
    `${args.teaser}\n` +
    when +
    `\nReview & join here: ${args.portalUrl}\n\n` +
    `Come curious. — ${args.cohortName} Trainer`;
  return { subject, body };
}
