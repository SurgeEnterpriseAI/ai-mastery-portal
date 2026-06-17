import { NextResponse } from "next/server";
import { mutateDB, newId } from "@/lib/db";
import { getCurrentLearner } from "@/lib/learner";
import { createOrder, PRO_PRICE_PAISE } from "@/lib/payments";
import type { Payment } from "@/lib/types";

export async function POST() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (learner.paid) return NextResponse.json({ error: "Already unlocked" }, { status: 400 });

  try {
    const order = await createOrder(PRO_PRICE_PAISE, `aimp-${learner.id}`);
    const payment: Payment = {
      id: newId("pay"),
      learnerId: learner.id,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      provider: order.provider,
      createdAt: new Date().toISOString(),
    };
    await mutateDB((d) => d.payments.unshift(payment));

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
