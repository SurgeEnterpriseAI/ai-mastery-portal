import nodemailer from "nodemailer";
import { addOutbox, newId } from "./data";
import type { OutboxMail } from "./types";

interface SendArgs {
  to: string[];
  subject: string;
  body: string; // plain-ish text / light HTML
  kind: OutboxMail["kind"];
}

const FROM = () => process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "Tensorpath <onboarding@resend.dev>";

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const secure = process.env.SMTP_SECURE === "true"; // true=465/SSL, false=587/STARTTLS
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure,
    requireTLS: !secure, // force STARTTLS on 587 (needed for Office 365)
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
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
 * Bulk send via Resend's batch endpoint (up to 100 per call) — one HTTP request
 * instead of a per-email burst, which avoids Resend's per-second rate limit.
 * Each message is personalised (its own recipient) and logged to the Outbox.
 * Falls back to per-email sendMail when Resend isn't configured.
 */
export async function sendBatchEmails(
  items: Array<{ to: string; subject: string; body: string; kind: OutboxMail["kind"] }>,
): Promise<{ delivered: number }> {
  let delivered = 0;
  const key = process.env.RESEND_API_KEY;
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    let oks: boolean[] = chunk.map(() => false);
    if (key) {
      try {
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(chunk.map((m) => ({
            from: FROM(), to: [m.to], subject: m.subject,
            html: `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.6">${m.body.replace(/\n/g, "<br/>")}</div>`,
          }))),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const arr = Array.isArray(data?.data) ? data.data : [];
          oks = chunk.map((_, j) => Boolean(arr[j]?.id));
        } else {
          console.error("[email] Resend batch failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (e) {
        console.error("[email] Resend batch error:", (e as Error).message);
      }
    }
    for (let j = 0; j < chunk.length; j++) {
      const ok = oks[j];
      if (ok) delivered++;
      await addOutbox({
        id: newId("mail"), to: [chunk[j].to], subject: chunk[j].subject, body: chunk[j].body,
        sentAt: new Date().toISOString(), delivered: ok, via: ok ? "resend" : "outbox", kind: chunk[j].kind,
      });
    }
  }
  return { delivered };
}

/**
 * Delivery order: Resend (RESEND_API_KEY) → SMTP (SMTP_HOST/USER/PASS) → in-app Outbox.
 * The portal is fully runnable with zero config — without keys, mail lands in the Outbox.
 * Every message is always logged to the outbox for the audit trail.
 */
export async function sendMail({ to, subject, body, kind }: SendArgs): Promise<{ delivered: boolean; via: OutboxMail["via"] }> {
  let delivered = false;
  let via: OutboxMail["via"] = "outbox";

  if (to.length > 0) {
    // Prefer real SMTP (own domain) when configured — Resend's sandbox sender
    // only delivers to the account owner, so SMTP must win when present.
    const transport = getSmtpTransport();
    if (transport) {
      try {
        await transport.sendMail({ from: FROM(), to: to.join(", "), subject, html: body.replace(/\n/g, "<br/>") });
        delivered = true;
        via = "smtp";
      } catch (e) {
        console.error("[email] SMTP send failed, trying next transport:", (e as Error).message);
      }
    }
    if (!delivered && (await sendViaResend(to, subject, body))) {
      delivered = true;
      via = "resend";
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
  const subject = `🎓 Welcome to Tensorpath, ${args.name}!`;
  const body =
    `Hi ${args.name},\n\n` +
    `Welcome aboard! Your personal AI learning journey starts now.\n\n` +
    `You have a personal AI coach that will hand-hold you through the entire program — answering questions, ` +
    `giving you scenarios and materials, and recommending exactly what to learn next based on your goals.\n\n` +
    `🎁 Your first ${args.freeCount} coaching sessions are on us.\n\n` +
    `Start here: ${args.portalUrl}\n\n` +
    `— The Tensorpath team`;
  return { subject, body };
}

export function paymentReceiptEmail(args: { name: string; amount: number; currency: string; portalUrl: string }) {
  const amt = `${args.currency === "INR" ? "₹" : ""}${(args.amount / 100).toFixed(2)}`;
  const subject = `✅ Payment received — Tensorpath Pro unlocked`;
  const body =
    `Hi ${args.name},\n\n` +
    `We've received your payment of ${amt}. Your account is now fully unlocked — ` +
    `unlimited AI coaching, personalised guidance, and human help whenever you need it.\n\n` +
    `Jump back in: ${args.portalUrl}\n\n` +
    `Thank you for investing in your growth. — The Tensorpath team`;
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

export function leadAckEmail(args: { name: string; portalUrl: string }) {
  const subject = `👋 Thanks for your interest in Tensorpath`;
  const body =
    `Hi ${args.name || "there"},\n\n` +
    `Thanks for reaching out about Tensorpath — our 20-day, instructor-led AI training that takes you from ` +
    `fundamentals to building real AI applications, ending in a verifiable certificate and placement support.\n\n` +
    `Our team will be in touch shortly. In the meantime, you can explore the program here: ${args.portalUrl}\n\n` +
    `— The Tensorpath team`;
  return { subject, body };
}

export function leadNotifyEmail(args: {
  name: string; email: string; phone: string; background: string;
  interest: string; heardFrom: string; source: string; portalUrl: string;
}) {
  const subject = `📥 New Tensorpath enquiry — ${args.name}${args.source === "surge_crosssell" ? " (Surge cross-sell)" : ""}`;
  const body =
    `A new enquiry just came in.\n\n` +
    `👤 ${args.name}\n📧 ${args.email}\n📞 ${args.phone}\n\n` +
    `Background: ${args.background}\nInterest: ${args.interest || "—"}\nHeard via: ${args.heardFrom || "—"}\n` +
    `Source: ${args.source}\n\n` +
    `Manage in the admin pipeline: ${args.portalUrl}/admin`;
  return { subject, body };
}

export function enrollInviteEmail(args: { name: string; joinUrl: string }) {
  const subject = `🎟️ You're invited to enroll in Tensorpath`;
  const body =
    `Hi ${args.name || "there"},\n\n` +
    `Great news — you're invited to enroll in the next Tensorpath AI cohort. ` +
    `It's free to begin, and you'll learn live with an expert trainer plus a personal AI coach.\n\n` +
    `Enroll here to set up your account: ${args.joinUrl}\n\n` +
    `See you inside! — The Tensorpath team`;
  return { subject, body };
}

export function classReminderEmail(args: { name: string; cohortName: string; date: string; classTime?: string; joinUrl: string }) {
  const when = args.classTime ? `today (${args.date}) at ${args.classTime}` : `today (${args.date})`;
  const subject = `⏰ Your Tensorpath class is today — ${args.cohortName}`;
  const body =
    `Hi ${args.name},\n\n` +
    `Reminder: you have a live Tensorpath class ${when} for ${args.cohortName}.\n\n` +
    `Join right in the portal — video, screen-share and chat: ${args.joinUrl}\n\n` +
    `See you in class! — The Tensorpath team`;
  return { subject, body };
}

export function batchInviteEmail(args: { name: string; cohortName: string; startDate?: string; classTime?: string; sessionDates: string[]; portalUrl: string }) {
  const start = args.startDate ? `\n🗓️ Starts: ${args.startDate}` : "";
  const time = args.classTime ? `\n🕖 Class time: ${args.classTime}` : "";
  const sessions = args.sessionDates.length
    ? `\n📅 Sessions:\n${args.sessionDates.slice(0, 24).map((d) => `   • ${d}`).join("\n")}`
    : "";
  const subject = `🎓 You're in! Confirm your seat — ${args.cohortName}`;
  const body =
    `Hi ${args.name},\n\n` +
    `Great news — you've been approved and assigned to a Tensorpath batch:\n\n` +
    `Batch: ${args.cohortName}${start}${time}${sessions}\n\n` +
    `Please confirm your seat so your trainer knows you're coming. Open your dashboard and click ` +
    `Confirm (or Can't make it): ${args.portalUrl}\n\n` +
    `Classes are held live inside the portal — video, screen-share and chat — and every session is recorded.\n\n` +
    `See you in class! — The Tensorpath team`;
  return { subject, body };
}

export function classStartingNowEmail(args: { name: string; cohortName: string; classTime?: string; joinUrl: string }) {
  const subject = `🔴 Your Tensorpath class is starting now`;
  const body =
    `Hi ${args.name},\n\n` +
    `Your live class for ${args.cohortName} is starting now${args.classTime ? ` (${args.classTime})` : ""}.\n\n` +
    `Join here — it's live in the portal with video, screen-share and chat:\n${args.joinUrl}\n\n` +
    `See you in class! — The Tensorpath team`;
  return { subject, body };
}

export function passwordResetEmail(args: { name: string; resetUrl: string }) {
  const subject = `Reset your Tensorpath password`;
  const body =
    `Hi ${args.name},\n\n` +
    `We received a request to reset your Tensorpath password. Click the link below to set a new one (valid for 1 hour):\n\n` +
    `${args.resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email — your password won't change.\n\n` +
    `— The Tensorpath team`;
  return { subject, body };
}

export function capstoneReviewedEmail(args: { name: string; title: string; approved: boolean; feedback?: string; portalUrl: string }) {
  if (args.approved) {
    const subject = `🎉 Your capstone is approved — certificate issued!`;
    const body =
      `Hi ${args.name},\n\n` +
      `Great news — your capstone "${args.title}" has been approved by your trainer, and your Tensorpath ` +
      `certificate has been issued! 🎓\n\n` +
      `View, download (PDF) and share your verifiable credential here: ${args.portalUrl}\n\n` +
      `Next up: your placement profile is now active. — The Tensorpath team`;
    return { subject, body };
  }
  const subject = `📝 Capstone feedback — a few revisions requested`;
  const body =
    `Hi ${args.name},\n\n` +
    `Your trainer reviewed your capstone "${args.title}" and asked for a few revisions before approval:\n\n` +
    `${args.feedback || "See the notes on your capstone page."}\n\n` +
    `Update and resubmit here: ${args.portalUrl}\n\n` +
    `You've got this. — The Tensorpath team`;
  return { subject, body };
}

export function certificateIssuedEmail(args: { name: string; credentialId: string; verifyUrl: string; portalUrl: string }) {
  const subject = `🎓 Your Tensorpath certificate is ready`;
  const body =
    `Hi ${args.name},\n\n` +
    `Congratulations — you're now Tensorpath-certified! Your credential ID is ${args.credentialId}.\n\n` +
    `Verify / share: ${args.verifyUrl}\n` +
    `Download the PDF and add it to LinkedIn from your dashboard: ${args.portalUrl}\n\n` +
    `— The Tensorpath team`;
  return { subject, body };
}

export function sessionReminderEmail(args: { cohortName: string; dayNumber: number; dayTitle: string; date: string; time: string; portalUrl: string }) {
  const subject = `⏰ Reminder — ${args.cohortName} Day ${args.dayNumber} is ${args.date} @ ${args.time}`;
  const body =
    `Hello,\n\nA quick reminder about your next live Tensorpath session:\n\n` +
    `🧠 Day ${args.dayNumber}: ${args.dayTitle}\n🗓️ ${args.date} @ ${args.time}\n\n` +
    `Join here: ${args.portalUrl}\n\nSee you there! — ${args.cohortName} Trainer`;
  return { subject, body };
}

export function capstoneDueEmail(args: { name: string; dueDate: string; portalUrl: string }) {
  const subject = `📌 Your capstone is due ${args.dueDate}`;
  const body =
    `Hi ${args.name},\n\nA reminder that your Tensorpath capstone is due on ${args.dueDate}. ` +
    `Submitting it unlocks trainer review and your certificate.\n\nSubmit here: ${args.portalUrl}\n\n— The Tensorpath team`;
  return { subject, body };
}

export function newOpeningEmail(args: { name: string; roleTitle: string; company: string; portalUrl: string }) {
  const subject = `💼 New opening: ${args.roleTitle}${args.company ? ` @ ${args.company}` : ""}`;
  const body =
    `Hi ${args.name},\n\nA new opportunity matching your training just landed on the Tensorpath careers board:\n\n` +
    `${args.roleTitle}${args.company ? ` · ${args.company}` : ""}\n\n` +
    `See details and apply: ${args.portalUrl}/careers\n\n— The Tensorpath team`;
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
