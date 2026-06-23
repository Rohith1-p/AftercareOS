import { Check, Plug, CreditCard, Users2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClinicProfile, getIntegrations, getProtocols } from "@/lib/data";
import { getLiveStore } from "@/lib/data/store";
import { listServices } from "@/lib/square";
import { SquareIntegration } from "@/components/app/square-integration";
import { ClinicProfileForm } from "@/components/app/clinic-profile-form";
import { BillingCard } from "@/components/app/billing-card";
import { getAuditLogs } from "@/lib/audit";
import { hasTwilio } from "@/lib/twilio";
import { formatTime } from "@/lib/utils";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const [clinic, integrations, protocols] = await Promise.all([
    getClinicProfile(),
    getIntegrations(),
    getProtocols(),
  ]);
  const square = integrations.find((i) => i.provider === "square");
  const services = await listServices(square ? "mock" : "");
  const store = getLiveStore();
  const auditLogs = getAuditLogs(8);

  const compliance = [
    { label: "Twilio BAA (HIPAA SMS)", ok: hasTwilio(), note: "Sign Twilio BAA + use HIPAA tier" },
    { label: "PHI minimized (no clinical notes stored)", ok: true },
    { label: "Audit logging active", ok: true },
    { label: "Consent capture on enrollment", ok: true },
    { label: "Data export / deletion", ok: true, note: "Available on request" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" description="Clinic profile, integrations, team, and billing." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Integrations — Square */}
        <div className="lg:col-span-2">
          <SquareIntegration
            connected={Boolean(square)}
            services={services}
            protocols={protocols}
            mappings={store.serviceMappings}
          />
        </div>

        {/* Clinic profile (editable) */}
        <Card className="lg:col-span-2">
          <div className="border-b border-hairline px-6 py-4">
            <h2 className="text-base font-bold text-ink">Clinic profile</h2>
          </div>
          <ClinicProfileForm initial={clinic} />
        </Card>

        {/* Billing */}
        <div className="lg:col-span-2">
          <BillingCard currentPlan={store.org.plan} />
        </div>

        {/* Team + compliance */}
        <Card>
          <div className="border-b border-hairline px-6 py-4">
            <h2 className="text-base font-bold text-ink">Team & compliance</h2>
          </div>
          <div className="px-6 py-2">
            <Row label="Owner" value="Dr. Alex Rivera" />
            <Row label="Team seats" value="1 / 5" />
            <div className="flex items-center gap-2 py-3">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-ink">HIPAA readiness</span>
            </div>
            <ul className="space-y-1.5 pb-2">
              {compliance.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs">
                  <Check className={`h-3.5 w-3.5 ${c.ok ? "text-success" : "text-muted"}`} />
                  <span className={c.ok ? "text-field" : "text-muted"}>{c.label}</span>
                  {c.note && <span className="text-muted">· {c.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Audit log */}
        <Card className="lg:col-span-2">
          <div className="border-b border-hairline px-6 py-4">
            <h2 className="text-base font-bold text-ink">Audit log</h2>
            <p className="text-xs text-muted">Append-only trail — supports malpractice-defense documentation</p>
          </div>
          {auditLogs.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {auditLogs.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                  <Badge tone="neutral">{l.action}</Badge>
                  <span className="flex-1 truncate text-muted">{l.detail ?? l.actor}</span>
                  <span className="text-xs text-muted">{formatTime(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
