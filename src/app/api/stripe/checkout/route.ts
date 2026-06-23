import { NextResponse } from "next/server";
import { createCheckoutSession, PLANS, type PlanId } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// POST /api/stripe/checkout { plan, orgId } → { url }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plan = body.plan as PlanId;
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }
  const orgId = body.orgId || "org_demo_aesthetics";
  const result = await createCheckoutSession(plan, orgId);
  return NextResponse.json(result);
}
