import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments";
import { unlockLearnerByOrder } from "@/lib/unlock";

/**
 * Razorpay webhook — server-to-server confirmation (the reliable source of truth).
 * Configure the endpoint + RAZORPAY_WEBHOOK_SECRET in the Razorpay dashboard and
 * subscribe to `payment.captured`.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event?.event === "payment.captured" || event?.event === "order.paid") {
    const entity = event.payload?.payment?.entity || {};
    const orderId = entity.order_id;
    if (orderId) {
      await unlockLearnerByOrder(orderId, {
        paymentId: entity.id,
        method: entity.method,
        origin: new URL(req.url).origin,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
