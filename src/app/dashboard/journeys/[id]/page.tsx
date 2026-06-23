import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, AlertTriangle, Star, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProtocol } from "@/lib/data";

function offsetToHuman(min: number): string {
  if (min <= 0) return "Immediately";
  const mins = min % 60;
  const hours = Math.floor(min / 60) % 24;
  const days = Math.floor(min / 1440);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  return `+${parts.join(" ")}`;
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const protocol = await getProtocol(id);
  if (!protocol) notFound();
  const steps = [...protocol.steps].sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  return (
    <div className="animate-fade-up">
      <Button asChild variant="ghost" size="sm" className="mb-2 px-2 text-muted">
        <Link href="/dashboard/journeys"><ArrowLeft className="h-4 w-4" /> Journeys</Link>
      </Button>
      <PageHeader
        title={protocol.name}
        description={`${protocol.category} · ${protocol.tone.replace("-", " ")} tone`}
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/journeys/${protocol.id}/edit`}>Edit</Link>
            </Button>
            <Badge tone="success">Active</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Timeline */}
        <Card className="p-6">
          <h2 className="mb-5 text-base font-bold text-ink">Message timeline</h2>
          <ol className="relative space-y-6 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-black/10">
            {steps.map((s) => (
              <li key={s.id} className="relative pl-7">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink">{s.label}</span>
                  <Badge tone="neutral">
                    <Clock className="mr-1 h-3 w-3" /> {offsetToHuman(s.offsetMinutes)}
                  </Badge>
                  {s.includeEscalation && (
                    <Badge tone="danger"><AlertTriangle className="mr-1 h-3 w-3" /> escalation</Badge>
                  )}
                  {s.includeReviewAsk && (
                    <Badge tone="warn"><Star className="mr-1 h-3 w-3" /> review ask</Badge>
                  )}
                  {s.includeRebook && (
                    <Badge tone="brand"><CalendarClock className="mr-1 h-3 w-3" /> rebook</Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-field">{s.body}</p>
              </li>
            ))}
          </ol>
        </Card>

        {/* Live SMS preview */}
        <Card className="h-fit p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Preview</h2>
          <div className="space-y-3">
            {steps.slice(0, 3).map((s) => (
              <div key={s.id} className="rounded-card bg-[#f8f8f8] p-3.5 shadow-sm">
                <p className="mb-1 text-[11px] font-semibold text-muted">{s.label}</p>
                <p className="text-sm leading-snug text-field">{s.body}</p>
                {s.includeEscalation && (
                  <span className="mt-2 inline-block rounded-pill bg-brand px-3 py-1 text-xs font-semibold text-white">
                    Something's wrong
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Editable timeline + AI upload arrive in Phase 1.
          </p>
        </Card>
      </div>
    </div>
  );
}
