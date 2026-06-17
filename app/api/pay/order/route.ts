import { NextResponse } from "next/server";
import { newId, createPayment } from "@/lib/data";
import { getCurrentLearner } from "@/lib/learner";
import { createOrder, PRO_PRICE_PAISE } from "@/lib/payments";

export async function POST() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (learner.paid) return NextResponse.json({ error: "Already unlocked" }, { status: 400 });

  try {
    const order = await createOrder(PRO_PRICE_PAISE, `aimp-${learner.id}`);
    await createPayment({
      id: newId("pay"),
      learnerId: learner.id,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      provider: order.provider,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      prefill: { name: learner.name, email: learner.email },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
