import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "brand" | "success" | "danger" | "warn";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const accent: Record<string, string> = {
    neutral: "text-ink",
    brand: "text-brand",
    success: "text-success",
    danger: "text-danger",
    warn: "text-warn",
  };
  return (
    <div className="glass rounded-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && <Icon className={cn("h-5 w-5", accent[tone])} />}
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold", accent[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
