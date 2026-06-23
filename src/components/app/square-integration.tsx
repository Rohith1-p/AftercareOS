"use client";

import { useState, useTransition } from "react";
import { Check, Plug, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveServiceMappingAction, importCsvAction } from "@/app/dashboard/settings/actions";
import type { Protocol, ServiceMapping } from "@/lib/data/types";

export function SquareIntegration({
  connected,
  services,
  protocols,
  mappings,
}: {
  connected: boolean;
  services: { id: string; name: string }[];
  protocols: Protocol[];
  mappings: ServiceMapping[];
}) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink">Square Appointments</h2>
          {connected ? (
            <Badge tone="success"><Check className="mr-1 h-3 w-3" /> Connected</Badge>
          ) : (
            <Badge tone="neutral">Not connected</Badge>
          )}
        </div>
        {connected ? null : (
          <Button asChild size="sm" variant="outline">
            <a href="/api/square/connect"><Plug className="h-4 w-4" /> Connect Square</a>
          </Button>
        )}
      </div>

      {connected ? (
        <ServiceMappingTable services={services} protocols={protocols} mappings={mappings} />
      ) : (
        <div className="px-6 py-5">
          <p className="text-sm text-muted">
            Connecting Square auto-starts the right aftercare sequence the moment an appointment is
            marked complete — zero extra clicks. Add your Square app credentials to{" "}
            <code className="rounded bg-black/5 px-1 text-xs">.env</code> to enable live OAuth.
          </p>
          <SimulateButton services={services} />
        </div>
      )}
    </Card>
  );
}

function ServiceMappingTable({
  services,
  protocols,
  mappings,
}: {
  services: { id: string; name: string }[];
  protocols: Protocol[];
  mappings: ServiceMapping[];
}) {
  return (
    <div className="px-6 py-4">
      <p className="mb-3 text-sm text-muted">Map each Square service to an aftercare protocol:</p>
      <div className="space-y-2">
        {services.map((s) => {
          const mapping = mappings.find((m) => m.externalServiceId === s.id);
          return <MappingRow key={s.id} service={s} protocols={protocols} mapping={mapping} />;
        })}
      </div>
    </div>
  );
}

function MappingRow({
  service,
  protocols,
  mapping,
}: {
  service: { id: string; name: string };
  protocols: Protocol[];
  mapping?: ServiceMapping;
}) {
  const [protocolId, setProtocolId] = useState(mapping?.protocolId ?? "");
  const [autoEnroll, setAutoEnroll] = useState(mapping?.autoEnroll ?? true);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveServiceMappingAction(service.id, service.name, protocolId, autoEnroll);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-btn bg-black/[0.02] px-3 py-2">
      <span className="min-w-[160px] flex-1 text-sm font-semibold text-ink">{service.name}</span>
      <select
        value={protocolId}
        onChange={(e) => setProtocolId(e.target.value)}
        className="h-9 rounded-btn border border-black/12 bg-white px-2 text-xs focus:border-brand focus:outline-none"
      >
        <option value="">— no protocol —</option>
        {protocols.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-xs font-semibold text-field">
        <input type="checkbox" checked={autoEnroll} onChange={(e) => setAutoEnroll(e.target.checked)} className="h-4 w-4 accent-[#e85d2c]" />
        Auto
      </label>
      <Button size="sm" variant="subtle" onClick={save} disabled={pending || !protocolId}>
        {pending ? "…" : "Save"}
      </Button>
    </div>
  );
}

function SimulateButton({ services }: { services: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const svc = services[0];

  function simulate() {
    setResult(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/dev/simulate-appointment?secret=dev&service=${svc.id}&serviceName=${encodeURIComponent(svc.name)}&name=Simulated%20Patient&phone=${encodeURIComponent("+15552007777")}`,
      ).then((r) => r.json());
      setResult(
        res.matched
          ? `Enrolled into ${res.protocolId} → patient ${res.patientId}`
          : `No mapping — guessed protocol ${res.protocolId}`,
      );
    });
  }

  return (
    <div className="mt-4 rounded-btn border border-dashed border-brand/30 bg-brand/5 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
        <Sparkles className="h-3.5 w-3.5 text-brand" /> Demo: simulate a completed Square appointment
      </p>
      <p className="mt-1 text-xs text-muted">
        Triggers the zero-click auto-enroll with a mock booking so you can see the flow live.
      </p>
      <Button size="sm" className="mt-2" onClick={simulate} disabled={pending}>
        {pending ? "Simulating…" : `Simulate “${svc.name}”`}
      </Button>
      {result && <p className="mt-2 text-xs font-semibold text-success">{result}</p>}
    </div>
  );
}
