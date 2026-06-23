// Stripe: checkout session creation + webhook handling.
// Mock mode (no STRIPE_SECRET_KEY) returns a fake session URL so billing is demoable.

export const PLANS = {
  STARTER: { id: "STARTER", name: "Starter", price: 99, patients: "up to 100", priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_STARTER" },
  PROFESSIONAL: { id: "PROFESSIONAL", name: "Professional", price: 149, patients: "up to 500", priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_PRO" },
  GROWTH: { id: "GROWTH", name: "Growth", price: 199, patients: "up to 1,000", priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_GROWTH" },
} as const;

export type PlanId = keyof typeof PLANS;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutResult {
  url: string;
  mock: boolean;
}

export async function createCheckoutSession(plan: PlanId, orgId: string): Promise<CheckoutResult> {
  const priceId = process.env[PLANS[plan].priceEnv];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!isStripeConfigured() || !priceId) {
    // Dev/demo: pretend checkout completed by redirecting to a success URL.
    return { url: `${appUrl}/api/stripe/dev-success?plan=${plan}&org=${orgId}`, mock: true };
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?stripe=success`,
    cancel_url: `${appUrl}/dashboard/settings?stripe=cancel`,
    client_reference_id: orgId,
    metadata: { orgId, plan },
  });
  return { url: session.url!, mock: false };
}
