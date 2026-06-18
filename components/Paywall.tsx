"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Paywall({
  open,
  onClose,
  onUnlocked,
  price,
  currency,
  payConfigured,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  price: number;
  currency: string;
  payConfigured: boolean;
  reason?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const amount = `${currency === "INR" ? "₹" : ""}${(price / 100).toFixed(0)}`;

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const orderRes = await fetch("/api/pay/order", { method: "POST" });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start payment");

      if (order.provider === "mock") {
        // No gateway configured — simulate a successful UPI payment for testing
        const r = await fetch("/api/pay/mock-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.orderId }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Payment failed");
        onUnlocked();
        return;
      }

      // Real Razorpay Checkout (UPI, cards, netbanking)
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) throw new Error("Couldn't load the payment gateway. Check your connection.");
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "AI Mastery",
        description: "AI Mastery Pro — unlimited coaching",
        prefill: order.prefill,
        theme: { color: "#6366f1" },
        method: { upi: true, card: true, netbanking: true, wallet: true },
        handler: async (resp: any) => {
          const v = await fetch("/api/pay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            }),
          });
          const d = await v.json();
          if (v.ok) onUnlocked();
          else setError(d.error || "Verification failed");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7">
        <div className="text-4xl">🚀</div>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Unlock unlimited coaching</h2>
        <p className="mt-2 text-slate-600">
          {reason || "You've used your free coaching sessions."} Go Pro for unlimited personalised hand-holding,
          recommendations, and human help whenever you need it.
        </p>
        <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{amount}</span>
            <span className="text-sm text-slate-500">one-time · full access</span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>✓ Unlimited AI coaching sessions</li>
            <li>✓ Personalised next-step recommendations</li>
            <li>✓ Priority human help from a trainer</li>
          </ul>
        </div>
        {!payConfigured && (
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
            Demo mode: no gateway configured, so payment is simulated. Set Razorpay keys for real UPI checkout.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-50">
            Maybe later
          </button>
          <button
            onClick={pay}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Processing…" : `Pay ${amount} with UPI`}
          </button>
        </div>
      </div>
    </div>
  );
}
