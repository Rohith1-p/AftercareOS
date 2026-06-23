import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { ReplyComposer } from "@/components/app/reply-composer";
import { AlertResolver } from "@/components/app/alert-resolver";
import { getConversations, getAlerts, getPatients, getClinicProfile } from "@/lib/data";
import { initials, formatTime, maskPhone, toE164 } from "@/lib/utils";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const [conversations, alerts, patients, clinic] = await Promise.all([
    getConversations(),
    getAlerts(),
    getPatients(),
    getClinicProfile(),
  ]);
  const openAlerts = alerts
    .filter((a) => a.status === "OPEN")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const nameOf = (id: string) => patients.find((p) => p.id === id)?.name ?? "Patient";
  const selected = conversations.find((x) => x.id === c) ?? conversations[0];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Inbox"
        description="Two-way patient conversations and escalations — sorted by urgency."
        action={<Badge tone="danger">{openAlerts.length} open escalations</Badge>}
      />

      {/* Escalation queue */}
      {openAlerts.length > 0 && (
        <Card className="mb-5 overflow-hidden border-danger/20">
          <div className="flex items-center gap-2 border-b border-danger/15 bg-danger/5 px-6 py-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <h2 className="text-sm font-bold text-ink">Escalation queue</h2>
            <span className="ml-auto text-xs text-muted">AI-triaged by severity</span>
          </div>
          <ul className="divide-y divide-hairline">
            {openAlerts.map((a) => (
              <li key={a.id} className="px-6 py-3">
                <div className="flex items-start gap-3">
                  <SeverityBadge severity={a.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {nameOf(a.patientId ?? "")} · <span className="text-muted">{a.category}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-field">“{a.message}”</p>
                  </div>
                  <span className="text-xs text-muted">{formatTime(a.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <AlertResolver alertId={a.id} currentStatus={a.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Conversations */}
      <Card className="grid h-[520px] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* List */}
        <div className="border-r border-hairline">
          <div className="border-b border-hairline p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                placeholder="Search conversations…"
                className="h-9 w-full rounded-pill border border-black/10 bg-white pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <ul className="divide-y divide-hairline overflow-y-auto" style={{ maxHeight: 460 }}>
            {conversations.map((conv) => {
              const last = conv.messages[conv.messages.length - 1];
              const active = conv.id === selected?.id;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/dashboard/inbox?c=${conv.id}`}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-black/[0.02] ${active ? "bg-brand/5" : ""}`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-ink text-xs font-bold text-white">
                      {initials(nameOf(conv.patientId))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-ink">{nameOf(conv.patientId)}</p>
                        {conv.unreadCount > 0 && (
                          <span className="rounded-pill bg-brand px-1.5 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {last?.direction === "OUTBOUND" && "You: "}
                        {last?.body}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Thread */}
        {selected ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-pill bg-brand text-xs font-bold text-white">
                {initials(nameOf(selected.patientId))}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{nameOf(selected.patientId)}</p>
                <p className="font-mono text-xs text-muted">
                  {maskPhone(patients.find((p) => p.id === selected.patientId)?.phone ?? toE164("+1555"))}
                </p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-black/[0.015] p-5">
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.direction === "INBOUND" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-card px-4 py-2.5 text-sm shadow-sm ${
                      m.direction === "INBOUND" ? "glass text-field" : "bg-brand text-white"
                    }`}
                  >
                    {m.body}
                    <div
                      className={`mt-1 text-[10px] ${m.direction === "INBOUND" ? "text-muted" : "text-white/70"}`}
                    >
                      {formatTime(m.sentAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ReplyComposer conversationId={selected.id} bookLink={clinic.bookingUrl} />
          </div>
        ) : (
          <div className="grid place-items-center text-sm text-muted">No conversation selected</div>
        )}
      </Card>
    </div>
  );
}
