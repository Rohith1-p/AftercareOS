"use client";

import { useState, useTransition } from "react";
import { Check, Stethoscope, CalendarCheck, Eye, MessageCircle } from "lucide-react";
import { resolveAlertAction } from "@/app/dashboard/inbox/actions";
import type { AlertStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const ACTIONS: { status: AlertStatus; label: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
  { status: "REVIEWED", label: "Reviewed", icon: Eye, tone: "bg-black/5 text-ink hover:bg-black/10" },
  { status: "RESPONDED", label: "Responded", icon: MessageCircle, tone: "bg-[#3b82f6]/10 text-[#2563eb] hover:bg-[#3b82f6]/20" },
  { status: "BOOKED", label: "Booked follow-up", icon: CalendarCheck, tone: "bg-brand/10 text-brand hover:bg-brand/20" },
  { status: "ESCALATED_MD", label: "Escalate to MD", icon: Stethoscope, tone: "bg-danger/10 text-danger hover:bg-danger/20" },
  { status: "RESOLVED", label: "Resolve", icon: Check, tone: "bg-success/10 text-success hover:bg-success/20" },
];

export function AlertResolver({
  alertId,
  currentStatus,
}: {
  alertId: string;
  currentStatus: AlertStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  function resolve(status: AlertStatus) {
    startTransition(async () => {
      await resolveAlertAction(alertId, status, note || undefined);
      setNote("");
      setShowNote(false);
    });
  }

  return (
    <div className="px-6 pb-4">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const active = currentStatus === a.status;
          return (
            <button
              key={a.status}
              type="button"
              disabled={isPending}
              onClick={() => resolve(a.status)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50",
                active ? "bg-ink text-white" : a.tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {a.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2">
        {showNote ? (
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note (optional)…"
              className="h-9 flex-1 rounded-btn border border-black/12 bg-white px-3 text-xs focus:border-brand focus:outline-none"
            />
            <button onClick={() => setShowNote(false)} className="text-xs font-semibold text-muted hover:text-ink">
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNote(true)}
            className="text-xs font-semibold text-muted hover:text-ink"
          >
            + Add internal note
          </button>
        )}
      </div>
    </div>
  );
}
