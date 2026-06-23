import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass flex flex-col items-center justify-center rounded-card px-8 py-16 text-center shadow-sm",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-pill bg-brand/10 text-brand">
          <Icon className="h-7 w-7" />
        </div>
      ) : (
        <div className="mb-4 text-3xl text-brand">◆</div>
      )}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
