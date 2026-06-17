import { mutateDB, readDB, newId } from "./db";
import { sendMail, paymentReceiptEmail } from "./email";

/**
 * Marks a payment paid, unlocks the learner (pro + approved), records the
 * journey event, and emails a receipt. Idempotent — safe to call from both the
 * client verify handler and the webhook.
 */
export async function unlockLearnerByOrder(orderId: string, opts: { paymentId?: string; method?: string; origin: string }) {
  const db = await readDB();
  const payment = db.payments.find((p) => p.orderId === orderId);
  if (!payment) return { ok: false, reason: "payment not found" };
  if (payment.status === "paid") return { ok: true, already: true };

  const learner = db.learners.find((l) => l.id === payment.learnerId);
  if (!learner) return { ok: false, reason: "learner not found" };

  await mutateDB((d) => {
    const p = d.payments.find((x) => x.orderId === orderId);
    if (p) {
      p.status = "paid";
      p.paymentId = opts.paymentId;
      p.method = opts.method;
      p.paidAt = new Date().toISOString();
    }
    const l = d.learners.find((x) => x.id === payment.learnerId);
    if (l) {
      l.paid = true;
      l.approved = true;
      l.plan = "pro";
      l.journey.push({
        id: newId("jrn"),
        type: "payment",
        summary: `Upgraded to Pro — unlimited coaching unlocked`,
        at: new Date().toISOString(),
      });
    }
  });

  const { subject, body } = paymentReceiptEmail({
    name: learner.name,
    amount: payment.amount,
    currency: payment.currency,
    portalUrl: `${opts.origin}/learn`,
  });
  await sendMail({ to: [learner.email], subject, body, kind: "payment" });
  return { ok: true };
}
