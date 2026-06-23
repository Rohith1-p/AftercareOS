"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanId } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export function BillingCard({ currentPlan }: { currentPlan: string }) {
  const [pending, startTransition] = useTransition();
  const [justUpgraded, setJustUpgraded] = useState<PlanId | null>(null);

  function checkout(plan: PlanId) {
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, orgId: "org_demo_aesthetics" }),
      }).then((r) => r.json());
      setJustUpgraded(plan);
      if (res.url) window.location.href = res.url;
    });
  }

  const plans = Object.values(PLANS);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-hairline px-6 py-4">
        <h2 className="text-base font-bold text-ink">Plan & billing</h2>
        <p className="text-xs text-muted">Flat monthly · no setup fee · cancel anytime</p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
        {plans.map((p) => {
          const current = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-card border p-4 transition",
                current ? "border-brand bg-brand/5 ring-1 ring-brand/20" : "border-hairline bg-white/60",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">{p.name}</p>
                {current && <Badge tone="brand">Current</Badge>}
                {justUpgraded === p.id && <Badge tone="success"><Check className="mr-1 h-3 w-3" />Upgraded</Badge>}
              </div>
              <p className="mt-2 text-2xl font-extrabold text-ink">
                ${p.price}<span className="text-sm font-medium text-muted">/mo</span>
              </p>
              <p className="mt-1 text-xs text-muted">{p.patients} active patients</p>
              <Button
                size="sm"
                variant={current ? "subtle" : "primary"}
                className="mt-3 w-full"
                disabled={current || pending}
                onClick={() => checkout(p.id)}
              >
                {current ? "Current plan" : pending ? "…" : <>Upgrade</>}
              </Button>
            </div>
          );
        })}
      </div>
      <div className="border-t border-hairline px-6 py-3 text-xs text-muted">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-brand" />
        One prevented 1-star review pays for a year of subscription. Live Stripe checkout activates when you add STRIPE keys.
      </div>
    </Card>
  );
}
