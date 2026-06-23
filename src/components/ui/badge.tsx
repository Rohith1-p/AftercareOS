import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Severity, AlertStatus, EnrollmentStatus } from "@/lib/data/types";

const badge = cva(
  "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-black/8 text-field",
        brand: "bg-brand/12 text-brand",
        success: "bg-success/15 text-success",
        warn: "bg-warn/18 text-[#8a4b00]",
        danger: "bg-danger/12 text-danger",
        dark: "bg-ink text-white",
        info: "bg-[#3b82f6]/12 text-[#2563eb]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, { tone: "danger" | "warn" | "neutral" | "info"; label: string }> = {
    URGENT: { tone: "danger", label: "Urgent" },
    HIGH: { tone: "danger", label: "High" },
    MEDIUM: { tone: "warn", label: "Medium" },
    LOW: { tone: "neutral", label: "Low" },
  };
  const { tone, label } = map[severity];
  return <Badge tone={tone}>{label}</Badge>;
}

export function StatusBadge({ status }: { status: AlertStatus | EnrollmentStatus }) {
  switch (status) {
    case "OPEN":
      return <Badge tone="danger">Open</Badge>;
    case "REVIEWED":
      return <Badge tone="info">Reviewed</Badge>;
    case "RESPONDED":
      return <Badge tone="info">Responded</Badge>;
    case "BOOKED":
      return <Badge tone="brand">Booked</Badge>;
    case "ESCALATED_MD":
      return <Badge tone="danger">Escalated to MD</Badge>;
    case "RESOLVED":
      return <Badge tone="success">Resolved</Badge>;
    case "ACTIVE":
      return <Badge tone="success">Active</Badge>;
    case "PAUSED":
      return <Badge tone="warn">Paused</Badge>;
    case "COMPLETED":
      return <Badge tone="neutral">Completed</Badge>;
    case "CANCELED":
      return <Badge tone="neutral">Canceled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
