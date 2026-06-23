import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Clock, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPatients, getEnrollments, getScheduled, getProtocols, getAlerts } from "@/lib/data";
import { maskPhone, formatDate, formatTime } from "@/lib/utils";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patients, enrollments, scheduled, protocols, alerts] = await Promise.all([
    getPatients(),
    getEnrollments(),
    getScheduled(),
    getProtocols(),
    getAlerts(),
  ]);
  const patient = patients.find((p) => p.id === id);
  if (!patient) notFound();

  const patientEnrollments = enrollments.filter((e) => e.patientId === id);
  const protoName = (pid: string) => protocols.find((p) => p.id === pid)?.name ?? "Protocol";
  const patientAlerts = alerts.filter((a) => a.patientId === id);

  return (
    <div className="animate-fade-up">
      <Button asChild variant="ghost" size="sm" className="mb-2 px-2 text-muted">
        <Link href="/dashboard/patients"><ArrowLeft className="h-4 w-4" /> Patients</Link>
      </Button>

      <PageHeader
        title={patient.name}
        description={
          <span className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" /> {maskPhone(patient.phone)}
            {patient.consentAt && <span>· consented {formatDate(patient.consentAt)}</span>}
          </span>
        }
        action={
          patientEnrollments[0] ? (
            <StatusBadge status={patientEnrollments[0].status} />
          ) : (
            <Badge tone="neutral">Not enrolled</Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Timeline of scheduled/sent messages */}
        <Card className="p-6">
          <h2 className="mb-5 text-base font-bold text-ink">Aftercare timeline</h2>
          {patientEnrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No active journeys. Enroll this patient to begin.</p>
          ) : (
            <div className="space-y-6">
              {patientEnrollments.map((enr) => {
                const msgs = scheduled.filter((s) => s.enrollmentId === enr.id);
                const proto = protocols.find((p) => p.id === enr.protocolId);
                const steps = proto ? [...proto.steps].sort((a, b) => a.offsetMinutes - b.offsetMinutes) : [];
                return (
                  <div key={enr.id}>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink">{protoName(enr.protocolId)}</h3>
                      {enr.procedureLabel && <Badge tone="neutral">{enr.procedureLabel}</Badge>}
                      <span className="text-xs text-muted">started {formatDate(enr.startedAt)}</span>
                    </div>
                    <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-black/10">
                      {steps.map((step) => {
                        const sm = msgs.find((m) => m.protocolStepId === step.id);
                        const sent = sm?.status === "SENT";
                        return (
                          <li key={step.id} className="relative flex items-start gap-3 pl-7">
                            <span className="absolute left-0 top-1">
                              {sent ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-black/25" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-ink">{step.label}</span>
                                {sm && (
                                  <Badge tone={sent ? "success" : "neutral"}>
                                    <Clock className="mr-1 h-3 w-3" />
                                    {sent && sm.sentAt ? formatTime(sm.sentAt) : sm ? formatTime(sm.sendAt) : ""}
                                  </Badge>
                                )}
                                {step.includeEscalation && <Badge tone="danger">triage</Badge>}
                              </div>
                              <p className="mt-0.5 text-sm text-muted line-clamp-2">{step.body}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Alerts */}
        <Card className="h-fit p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Concerns</h3>
          {patientAlerts.length === 0 ? (
            <p className="text-sm text-muted">No escalations. Patient is on track.</p>
          ) : (
            <ul className="space-y-3">
              {patientAlerts.map((a) => (
                <li key={a.id} className="rounded-btn bg-black/[0.03] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-muted">{formatTime(a.createdAt)}</span>
                  </div>
                  <p className="text-sm text-field">“{a.message}”</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
