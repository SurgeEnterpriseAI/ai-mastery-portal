import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/payments";
import { unlockLearnerByOrder } from "@/lib/unlock";

export async function POST(req: Request) {
  if (!getSessionLearnerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderId, paymentId, signature } = await req.json().catch(() => ({}));
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment confirmation fields" }, { status: 400 });
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }
  const result = await unlockLearnerByOrder(orderId, { paymentId, method: "razorpay", origin: new URL(req.url).origin });
  if (!result.ok) return NextResponse.json({ error: result.reason || "Could not unlock" }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Payment verified — you're now Pro!" });
}
