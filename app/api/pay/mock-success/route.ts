import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { isRazorpayConfigured } from "@/lib/payments";
import { unlockLearnerByOrder } from "@/lib/unlock";

/**
 * Simulates a successful payment. ONLY available when Razorpay is NOT configured,
 * so the freemium → unlock flow is fully testable with zero setup. With real keys,
 * this route is disabled and verification goes through /api/pay/verify.
 */
export async function POST(req: Request) {
  if (!getSessionLearnerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isRazorpayConfigured()) {
    return NextResponse.json({ error: "Mock payment disabled — Razorpay is configured. Use the real checkout." }, { status: 400 });
  }
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  const result = await unlockLearnerByOrder(orderId, { method: "upi (simulated)", origin: new URL(req.url).origin });
  if (!result.ok) return NextResponse.json({ error: result.reason || "Could not unlock" }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Payment simulated — Pro unlocked!" });
}
