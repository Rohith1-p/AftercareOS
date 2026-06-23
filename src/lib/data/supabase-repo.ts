// Supabase-backed data access (PostgREST via the secret key).
// Mirrors the mock store's getters + writes so the facade can switch over.
import { supabaseAdmin } from "@/lib/supabase-server";
import { buildEnrollmentPlan } from "@/lib/enrollment";
import { sendSms } from "@/lib/twilio";
import { nanoid } from "nanoid";
import type {
  Organization, ClinicProfile, Protocol, ProtocolStep, Patient, Enrollment,
  ScheduledMessage, Alert, Conversation, MessageLog, ReviewRequest, Integration,
  ServiceMapping, Severity, AlertStatus, Plan,
} from "@/lib/data/types";

const ORG_ID = "org_demo_aesthetics";

// ── READS ────────────────────────────────────────────
export async function getOrg(): Promise<Organization> {
  const { data } = await supabaseAdmin!.from("Organization").select("*").eq("id", ORG_ID).single();
  return data as Organization;
}

export async function getClinicProfile(): Promise<ClinicProfile> {
  const { data } = await supabaseAdmin!.from("ClinicProfile").select("*").eq("orgId", ORG_ID).single();
  return {
    orgId: data.orgId, name: data.senderName || "AftercareOS",
    brandColor: data.brandColor, senderName: data.senderName,
    twilioNumber: data.twilioNumber, bookingUrl: data.bookingUrl, reviewLink: data.reviewLink,
    quietHoursStart: data.quietHoursStart, quietHoursEnd: data.quietHoursEnd,
    consentText: data.consentText, language: data.language,
  } as ClinicProfile;
}

export async function getProtocols(): Promise<Protocol[]> {
  const { data } = await supabaseAdmin!.from("Protocol").select("*, ProtocolStep(*)").eq("orgId", ORG_ID);
  return (data || []).map((p: Record<string, unknown>) => mapProtocol(p));
}

export async function getProtocol(id: string): Promise<Protocol | undefined> {
  const { data } = await supabaseAdmin!.from("Protocol").select("*, ProtocolStep(*)").eq("id", id).single();
  return data ? mapProtocol(data as Record<string, unknown>) : undefined;
}

function mapProtocol(p: Record<string, unknown>): Protocol {
  const steps = (p.ProtocolStep as ProtocolStep[]) || [];
  return {
    id: p.id as string, orgId: p.orgId as string, name: p.name as string,
    category: p.category as string, segment: p.segment as string,
    source: p.source as Protocol["source"], status: p.status as Protocol["status"],
    tone: p.tone as string, version: p.version as number,
    steps: steps.map((s) => ({
      id: s.id, protocolId: s.protocolId, order: s.order, offsetMinutes: s.offsetMinutes,
      label: s.label, body: s.body, includeEscalation: s.includeEscalation,
      includeReviewAsk: s.includeReviewAsk, includeRebook: s.includeRebook, mediaUrl: s.mediaUrl,
    })).sort((a, b) => a.offsetMinutes - b.offsetMinutes),
    createdAt: p.createdAt as string, updatedAt: p.updatedAt as string,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const { data } = await supabaseAdmin!.from("Patient").select("*").eq("orgId", ORG_ID).order("createdAt", { ascending: false });
  return (data || []) as Patient[];
}

export async function getEnrollments(): Promise<Enrollment[]> {
  const { data } = await supabaseAdmin!.from("Enrollment").select("*").eq("orgId", ORG_ID).order("appointmentAt", { ascending: false });
  return (data || []) as Enrollment[];
}

export async function getScheduled(): Promise<ScheduledMessage[]> {
  const { data } = await supabaseAdmin!.from("ScheduledMessage").select("*");
  return (data || []) as ScheduledMessage[];
}

export async function getAlerts(): Promise<Alert[]> {
  const { data } = await supabaseAdmin!.from("Alert").select("*").eq("orgId", ORG_ID).order("createdAt", { ascending: false });
  return (data || []) as Alert[];
}

export async function getConversations(): Promise<Conversation[]> {
  const [convRes, msgRes] = await Promise.all([
    supabaseAdmin!.from("Conversation").select("*").eq("orgId", ORG_ID),
    supabaseAdmin!.from("MessageLog").select("*, Enrollment(patientId)").order("sentAt", { ascending: true }),
  ]);
  const enrollments = await getEnrollments();
  const enrByPatient = new Map(enrollments.map((e) => [e.patientId, e.id]));
  const msgsByPatient = new Map<string, MessageLog[]>();
  for (const m of (msgRes.data || []) as (MessageLog & { Enrollment?: { patientId?: string } })[]) {
    // resolve patient via enrollment id -> patient
    const enr = enrollments.find((e) => e.id === m.enrollmentId);
    const pid = enr?.patientId ?? m.Enrollment?.patientId;
    if (!pid) continue;
    if (!msgsByPatient.has(pid)) msgsByPatient.set(pid, []);
    msgsByPatient.get(pid)!.push(m);
  }
  return ((convRes.data || []) as Conversation[]).map((c) => ({
    ...c,
    messages: msgsByPatient.get(c.patientId) || [],
  }));
}

export async function getReviewRequests(): Promise<ReviewRequest[]> {
  const { data } = await supabaseAdmin!.from("ReviewRequest").select("*").eq("orgId", ORG_ID).order("sentAt", { ascending: false });
  return (data || []) as ReviewRequest[];
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data } = await supabaseAdmin!.from("Integration").select("*").eq("orgId", ORG_ID);
  return (data || []) as Integration[];
}

export async function getServiceMappings(): Promise<ServiceMapping[]> {
  const { data } = await supabaseAdmin!.from("ServiceMapping").select("*").eq("orgId", ORG_ID);
  return (data || []) as ServiceMapping[];
}

// ── WRITES ───────────────────────────────────────────
const escTokens = new Map<string, { enrollmentId: string; patientId: string }>();
const enrTokens = new Map<string, string>();

export function escalationLinkFor(enrollmentId: string): string {
  const token = enrTokens.get(enrollmentId);
  if (!token) return "";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/w/${token}`;
}

export async function enrollPatient(input: {
  patientId?: string; name?: string; phone: string; protocolId: string;
  appointmentAt: string; procedureLabel?: string; sendNow?: boolean;
}): Promise<{ enrollmentId: string; patientId: string }> {
  const clinic = await getClinicProfile();
  const { data: protoRow } = await supabaseAdmin!.from("Protocol").select("*, ProtocolStep(*)").eq("id", input.protocolId).single();
  if (!protoRow) throw new Error("Protocol not found");
  const protocol = mapProtocol(protoRow as Record<string, unknown>);

  const phone = input.phone;
  let patient: Patient;
  if (input.patientId) {
    const { data } = await supabaseAdmin!.from("Patient").select("*").eq("id", input.patientId).single();
    patient = data as Patient;
  } else {
    const { data: existing } = await supabaseAdmin!.from("Patient").select("*").eq("phone", phone).maybeSingle();
    patient = (existing as Patient) ?? (await createPatient(input.name || "Patient", phone, input.procedureLabel ?? protocol.name));
  }

  const token = nanoid(16);
  const enrollmentId = `enr_${nanoid(10)}`;
  const appointmentAt = new Date(input.appointmentAt);
  const plan = buildEnrollmentPlan({
    protocol, appointmentAt,
    ctx: {
      first_name: patient.name.split(" ")[0], clinic_name: clinic.name,
      procedure: input.procedureLabel ?? protocol.name, book_link: clinic.bookingUrl,
      review_link: clinic.reviewLink, reply_to: clinic.twilioNumber,
    },
    quiet: { start: clinic.quietHoursStart, end: clinic.quietHoursEnd },
    escalation: { baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", token },
  });

  await supabaseAdmin!.from("Enrollment").insert({
    id: enrollmentId, patientId: patient.id, protocolId: protocol.id, orgId: ORG_ID,
    procedureLabel: input.procedureLabel, appointmentAt: appointmentAt.toISOString(),
    status: "ACTIVE", currentOffsetMin: 0,
  });
  const scheduledRows = plan.map((m) => ({
    id: `sm_${nanoid(10)}`, enrollmentId, protocolStepId: m.step.id,
    sendAt: m.sendAt.toISOString(), status: "PENDING", attempts: 0,
  }));
  await supabaseAdmin!.from("ScheduledMessage").insert(scheduledRows);

  escTokens.set(token, { enrollmentId, patientId: patient.id });
  enrTokens.set(enrollmentId, token);

  if (input.sendNow) {
    const first = plan[0];
    if (first) {
      const res = await sendSms(patient.phone, first.renderedBody, { from: clinic.twilioNumber });
      await supabaseAdmin!.from("MessageLog").insert({
        id: `m_${nanoid(8)}`, enrollmentId, direction: "OUTBOUND", body: first.renderedBody,
        fromNumber: clinic.twilioNumber, toNumber: patient.phone, twilioSid: res.sid, status: res.status,
      });
      const firstSm = scheduledRows[0];
      if (firstSm) await supabaseAdmin!.from("ScheduledMessage").update({ status: "SENT", twilioSid: res.sid, sentAt: new Date().toISOString() }).eq("id", firstSm.id);
    }
  }
  return { enrollmentId, patientId: patient.id };
}

async function createPatient(name: string, phone: string, procedure: string): Promise<Patient> {
  const id = `pat_${nanoid(10)}`;
  const row = { id, orgId: ORG_ID, phone, name, consentAt: new Date().toISOString(), source: "manual" };
  const { data, error } = await supabaseAdmin!.from("Patient").insert(row).select().single();
  if (error) throw error;
  return data as Patient;
}

export async function submitEscalation(input: {
  token: string; message: string; severity: Severity; photoUrl?: string;
}): Promise<void> {
  const mapping = escTokens.get(input.token);
  const { data: latest } = await supabaseAdmin!.from("Enrollment").select("id,patientId").eq("orgId", ORG_ID).order("startedAt", { ascending: false }).limit(1).maybeSingle();
  const enrollmentId = mapping?.enrollmentId ?? latest?.id;
  const patientId = mapping?.patientId ?? latest?.patientId;
  await supabaseAdmin!.from("Alert").insert({
    id: `alert_${nanoid(10)}`, enrollmentId, patientId, orgId: ORG_ID,
    severity: input.severity, category: "concern", message: input.message,
    photoUrl: input.photoUrl, status: "OPEN",
  });
}

export async function resolveAlert(alertId: string, status: AlertStatus, note?: string): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (note) patch.note = note;
  if (["RESOLVED", "BOOKED", "ESCALATED_MD"].includes(status)) patch.resolvedAt = new Date().toISOString();
  await supabaseAdmin!.from("Alert").update(patch).eq("id", alertId);
}

export async function reply(conversationId: string, body: string): Promise<void> {
  const { data: conv } = await supabaseAdmin!.from("Conversation").select("*").eq("id", conversationId).single();
  if (!conv) return;
  const clinic = await getClinicProfile();
  const patient = (await supabaseAdmin!.from("Patient").select("*").eq("id", conv.patientId).single()).data as Patient;
  const enr = (await supabaseAdmin!.from("Enrollment").select("id").eq("patientId", conv.patientId).limit(1).maybeSingle()).data;
  await supabaseAdmin!.from("MessageLog").insert({
    id: `m_${nanoid(8)}`, enrollmentId: enr?.id ?? conv.patientId, direction: "OUTBOUND", body,
    fromNumber: clinic.twilioNumber, toNumber: patient?.phone,
  });
  if (patient) await sendSms(patient.phone, body, { from: clinic.twilioNumber });
  await supabaseAdmin!.from("Conversation").update({ unreadCount: 0, updatedAt: new Date().toISOString() }).eq("id", conversationId);
}

export async function saveProtocol(input: {
  id?: string; name: string; category: string; tone: string;
  steps: { offsetMinutes: number; label: string; body: string; includeEscalation: boolean }[];
}): Promise<{ id: string }> {
  const id = input.id ?? `proto_${nanoid(10)}`;
  const now = new Date().toISOString();
  const { data: existing } = await supabaseAdmin!.from("Protocol").select("*").eq("id", id).maybeSingle();
  if (existing) {
    await supabaseAdmin!.from("ProtocolStep").delete().eq("protocolId", id);
    await supabaseAdmin!.from("Protocol").update({ name: input.name, category: input.category, tone: input.tone, version: (existing.version ?? 1) + 1, updatedAt: now }).eq("id", id);
  } else {
    await supabaseAdmin!.from("Protocol").insert({ id, orgId: ORG_ID, name: input.name, category: input.category, source: "AI_IMPORTED", status: "ACTIVE", tone: input.tone, version: 1, updatedAt: now });
  }
  const rows = input.steps.map((s, i) => ({
    id: `${id}-s${i + 1}`, protocolId: id, order: i + 1, offsetMinutes: s.offsetMinutes,
    label: s.label, body: s.body, includeEscalation: s.includeEscalation,
  }));
  await supabaseAdmin!.from("ProtocolStep").insert(rows);
  return { id };
}

export async function saveClinicProfile(input: {
  name: string; senderName: string; brandColor: string; bookingUrl: string;
  reviewLink: string; quietHoursStart: string; quietHoursEnd: string; consentText: string;
}): Promise<void> {
  await supabaseAdmin!.from("ClinicProfile").update({
    senderName: input.senderName, brandColor: input.brandColor, bookingUrl: input.bookingUrl,
    reviewLink: input.reviewLink, quietHoursStart: input.quietHoursStart, quietHoursEnd: input.quietHoursEnd,
    consentText: input.consentText, updatedAt: new Date().toISOString(),
  }).eq("orgId", ORG_ID);
}

export async function saveServiceMapping(serviceId: string, label: string, protocolId: string, autoEnroll: boolean): Promise<void> {
  const { data: existing } = await supabaseAdmin!.from("ServiceMapping").select("*").eq("provider", "square").eq("externalServiceId", serviceId).maybeSingle();
  if (existing) {
    await supabaseAdmin!.from("ServiceMapping").update({ protocolId, externalLabel: label, autoEnroll }).eq("id", existing.id);
  } else {
    await supabaseAdmin!.from("ServiceMapping").insert({ id: `map_${nanoid(8)}`, orgId: ORG_ID, provider: "square", externalServiceId: serviceId, externalLabel: label, protocolId, autoEnroll });
  }
}

export async function upgradePlan(plan: string): Promise<void> {
  await supabaseAdmin!.from("Organization").update({ plan: plan as Plan, status: "ACTIVE" }).eq("id", ORG_ID);
}

// Escalation registry mirror (used by public page + scheduler)
export { escTokens };
