import Link from "next/link";
import { AlertTriangle, MessageSquareText, Route, Star, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getHomeSnapshot,
  getAlerts,
  getPatients,
  getClinicProfile,
} from "@/lib/data";
import { getEngagementMetrics } from "@/lib/analytics";
import { MiniBarChart } from "@/components/app/mini-bar-chart";
import { formatTime } from "@/lib/utils";

export default async function HomePage() {
  const [snap, alerts, patients, clinic, metrics] = await Promise.all([
    getHomeSnapshot(),
    getAlerts(),
    getPatients(),
    getClinicProfile(),
    Promise.resolve(getEngagementMetrics()),
  ]);
  const openAlerts = alerts.filter((a) => a.status === "OPEN").sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const patientName = (id: string) => patients.find((p) => p.id === id)?.name ?? "Patient";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Today"
        description={`${today} · welcome back to ${clinic.name}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/journeys">View journeys <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        }
      />

      {/* Needs attention */}
      {openAlerts.length > 0 && (
        <Card className="mb-6 overflow-hidden border-danger/20">
          <div className="flex items-center gap-3 border-b border-danger/15 bg-danger/5 px-6 py-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <p className="text-sm font-bold text-ink">
              {snap.urgentAlerts > 0
                ? `${snap.urgentAlerts} urgent concern${snap.urgentAlerts > 1 ? "s" : ""} need attention`
                : `${openAlerts.length} open concern${openAlerts.length > 1 ? "s" : ""} to review`}
            </p>
            <Link
              href="/dashboard/inbox"
              className="ml-auto text-sm font-semibold text-brand hover:underline"
            >
              Go to inbox →
            </Link>
          </div>
          <ul className="divide-y divide-hairline">
            {openAlerts.slice(0, 3).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-6 py-3.5">
                <div className="mt-0.5">
                  <SeverityBadge severity={a.severity} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {patientName(a.patientId ?? "")} · {a.category}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted">“{a.message}”</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted">
                  {formatTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active journeys" value={snap.activeJourneys} icon={Route} tone="brand" hint="patients in a sequence" />
        <StatCard label="Open alerts" value={snap.openAlerts} icon={AlertTriangle} tone={snap.urgentAlerts > 0 ? "danger" : "warn"} hint="needs review" />
        <StatCard label="Messages · 7d" value={snap.messagesSent7d} icon={MessageSquareText} hint={`${snap.messagesSentToday} today`} />
        <StatCard label="Review asks · 7d" value={snap.reviewRequests7d} icon={Star} tone="success" />
      </div>

      {/* Active journeys by day-bucket */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-base font-bold text-ink">Active journeys by day</h2>
          <p className="text-sm text-muted">Where patients are in their aftercare right now</p>
        </div>
        <div className="space-y-3 px-6 py-5">
          {snap.byDay.map((b) => {
            const max = Math.max(1, ...snap.byDay.map((x) => x.count));
            const pct = (b.count / max) * 100;
            return (
              <div key={b.label} className="flex items-center gap-4">
                <span className="w-16 text-sm font-semibold text-ink">{b.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-pill bg-black/5">
                  <div
                    className="flex h-full items-center justify-end rounded-pill bg-brand pr-2 text-[11px] font-bold text-white"
                    style={{ width: `${Math.max(pct, b.count > 0 ? 8 : 0)}%` }}
                  >
                    {b.count > 0 && b.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Engagement analytics */}
      <Card>
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-base font-bold text-ink">Messages sent · last 7 days</h2>
          <p className="text-sm text-muted">{metrics.messagesSent7d} total · {metrics.responseRate}% reply rate</p>
        </div>
        <div className="px-6 py-5">
          <MiniBarChart data={metrics.series7d} />
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-extrabold text-success">{metrics.journeyCompletionRate}%</p>
              <p className="text-xs text-muted">Journey completion</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-warn">{metrics.escalationsPer100}</p>
              <p className="text-xs text-muted">Escalations / 100</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-brand">{metrics.avgResponseMin}m</p>
              <p className="text-xs text-muted">Avg response</p>
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
