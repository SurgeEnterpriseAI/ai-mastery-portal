import crypto from "crypto";

export const PRO_PRICE_PAISE = Number(process.env.PRO_PRICE_PAISE || 99900); // ₹999.00
export const CURRENCY = process.env.PAY_CURRENCY || "INR";

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayPublicKey(): string | null {
  return process.env.RAZORPAY_KEY_ID || null;
}

export interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "mock";
  keyId: string | null;
}

/**
 * Creates a payment order. With Razorpay keys set, creates a real order (UPI,
 * cards, netbanking all available in Checkout). Without keys, returns a mock
 * order so the paywall + unlock flow is fully testable.
 */
export async function createOrder(amount: number, receipt: string): Promise<CreatedOrder> {
  if (!isRazorpayConfigured()) {
    return {
      orderId: `order_mock_${crypto.randomBytes(6).toString("hex")}`,
      amount,
      currency: CURRENCY,
      provider: "mock",
      keyId: null,
    };
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: CURRENCY, receipt, payment_capture: 1 }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return { orderId: order.id, amount: order.amount, currency: order.currency, provider: "razorpay", keyId: razorpayPublicKey() };
}

/** Verifies the Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies a Razorpay webhook payload signature against RAZORPAY_WEBHOOK_SECRET. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
