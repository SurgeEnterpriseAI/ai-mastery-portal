import { unlockByOrderTx, getPaymentByOrder } from "./data";
import { sendMail, paymentReceiptEmail } from "./email";

/**
 * Marks a payment paid, unlocks the learner (pro + approved), logs the journey
 * event (all in one DB transaction), then emails a receipt. Idempotent.
 */
export async function unlockLearnerByOrder(orderId: string, opts: { paymentId?: string; method?: string; origin: string }) {
  const result = await unlockByOrderTx(orderId, { paymentId: opts.paymentId, method: opts.method });
  if (!result.ok) return { ok: false, reason: result.reason };
  if (result.already || !result.learner) return { ok: true, already: result.already };

  const learner = result.learner;
  const payment = await getPaymentByOrder(orderId);
  const { subject, body } = paymentReceiptEmail({
    name: learner.name,
    amount: payment?.amount ?? 0,
    currency: payment?.currency ?? "INR",
    portalUrl: `${opts.origin}/learn`,
  });
  await sendMail({ to: [learner.email], subject, body, kind: "payment" });
  return { ok: true };
}
