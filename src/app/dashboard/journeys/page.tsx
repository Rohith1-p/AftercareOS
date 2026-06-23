import Link from "next/link";
import { Plus, Clock, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProtocols } from "@/lib/data";

const CATEGORY_TONE: Record<string, "brand" | "success" | "info"> = {
  Injectables: "brand",
  Skin: "success",
  Body: "info",
};

export default async function JourneysPage() {
  const protocols = await getProtocols();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Journeys & Protocols"
        description="Timed, procedure-specific SMS sequences. Upload your own or start from a template."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/journeys/new">
              <Plus className="h-4 w-4" /> New protocol
            </Link>
          </Button>
        }
      />

      {/* Template library */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Templates</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {protocols.map((p) => {
          const tone = CATEGORY_TONE[p.category] ?? "neutral";
          return (
            <Link key={p.id} href={`/dashboard/journeys/${p.id}`}>
              <Card className="group h-full cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Badge tone={tone}>{p.category}</Badge>
                  <Badge tone="success">Active</Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-brand">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {p.steps.length} messages · {p.tone.replace("-", " ")}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {p.steps[0]?.label.replace(" · ", " ")} → {p.steps[p.steps.length - 1]?.label.replace(" · ", " ")}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.steps.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-pill bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-field"
                    >
                      <MessageSquare className="h-3 w-3 text-brand" />
                      {s.label}
                    </span>
                  ))}
                  {p.steps.length > 4 && (
                    <span className="inline-flex items-center rounded-pill bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-muted">
                      +{p.steps.length - 4}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
