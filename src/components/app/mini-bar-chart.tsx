export function MiniBarChart({ data, height = 80 }: { data: { day: string; sent: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.sent));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.sent / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand to-brand-soft transition-all"
                style={{ height: `${pct}%` }}
                title={`${d.sent} messages`}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}
