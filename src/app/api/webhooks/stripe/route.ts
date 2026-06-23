import { NextResponse } from "next/server";
import { getLiveStore } from "@/lib/data/store";
import type { Plan } from "@/lib/data/types";

export const dynamic = "force-dynamic";

// Stripe webhook: on checkout.session.completed, upgrade the org plan.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const Stripe = (await import("stripe")).default;

  let event;
  if (process.env.STRIPE_SECRET_KEY && secret) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers.get("stripe-signature") || "";
    const raw = await req.text();
    try {
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } catch {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
  } else {
    // Dev: accept raw JSON event.
    event = await req.json().catch(() => ({}));
  }

  if (event?.type === "checkout.session.completed") {
    const plan = event.data?.object?.metadata?.plan;
    const store = getLiveStore();
    if (plan) {
      store.org.plan = plan as Plan;
      store.org.status = "ACTIVE";
    }
  }
  return NextResponse.json({ received: true });
}
