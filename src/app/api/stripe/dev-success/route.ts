import { NextResponse } from "next/server";
import { getLiveStore } from "@/lib/data/store";
import type { PlanId } from "@/lib/stripe";
import type { Plan } from "@/lib/data/types";

export const dynamic = "force-dynamic";

// Dev/demo "checkout success": upgrade the org's plan without a real Stripe call.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") as PlanId;
  const store = getLiveStore();
  if (plan) {
    store.org.plan = plan as Plan;
    store.org.status = "ACTIVE";
  }
  return NextResponse.redirect(new URL("/dashboard/settings?stripe=success", url.origin));
}
