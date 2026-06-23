"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getLiveStore } from "@/lib/data/store";
import { getClinicProfile } from "@/lib/data";
import { buildEnrollmentPlan } from "@/lib/enrollment";
import { sendSms } from "@/lib/twilio";
import { enrollmentEscalationTokens, reviewTokens, reviewLinkFor } from "@/lib/scheduler";
import { escalationTokens } from "@/lib/escalation-registry";
import { logAudit } from "@/lib/audit";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import * as repo from "@/lib/data/supabase-repo";
import { toE164 } from "@/lib/utils";

export interface EnrollInput {
  patientId?: string;
  name?: string;
  phone: string;
  protocolId: string;
  appointmentAt: string; // ISO
  procedureLabel?: string;
  sendNow?: boolean; // immediately send the first due message
}

export async function enrollPatientAction(input: EnrollInput): Promise<{ enrollmentId: string; patientId: string }> {
  if (isSupabaseConfigured) {
    const res = await repo.enrollPatient({ ...input, phone: toE164(input.phone) });
    logAudit("enroll.create", { actor: "owner", target: res.enrollmentId });
    revalidatePath("/dashboard/patients");
    revalidatePath("/dashboard");
    return res;
  }
  const store = getLiveStore();
  const clinic = await getClinicProfile();
  const protocol = store.protocols.find((p) => p.id === input.protocolId);
  if (!protocol) throw new Error("Protocol not found");

  // Resolve / create patient
  let patient = input.patientId
    ? store.patients.find((p) => p.id === input.patientId)
    : store.patients.find((p) => p.phone === toE164(input.phone));
  if (!patient) {
    patient = {
      id: `pat_${nanoid(10)}`,
      orgId: store.org.id,
      phone: toE164(input.phone),
      name: input.name || "Patient",
      consentAt: new Date().toISOString(),
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    store.patients.push(patient);
  }

  const token = nanoid(16);
  const enrollmentId = `enr_${nanoid(10)}`;
  const appointmentAt = new Date(input.appointmentAt);

  const plan = buildEnrollmentPlan({
    protocol,
    appointmentAt,
    ctx: {
      first_name: patient.name.split(" ")[0],
      clinic_name: clinic.name,
      procedure: input.procedureLabel ?? protocol.name,
      book_link: clinic.bookingUrl,
      review_link: reviewLinkFor(enrollmentId),
      reply_to: clinic.twilioNumber,
    },
    quiet: { start: clinic.quietHoursStart, end: clinic.quietHoursEnd },
    escalation: { baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", token },
  });

  const enrollment = {
    id: enrollmentId,
    patientId: patient.id,
    protocolId: protocol.id,
    orgId: store.org.id,
    procedureLabel: input.procedureLabel,
    appointmentAt: appointmentAt.toISOString(),
    status: "ACTIVE" as const,
    currentOffsetMin: 0,
    startedAt: new Date().toISOString(),
  };
  store.enrollments.push(enrollment);

  const scheduled = plan.map((m) => ({
    id: `sm_${nanoid(10)}`,
    enrollmentId,
    protocolStepId: m.step.id,
    sendAt: m.sendAt.toISOString(),
    status: m.sendAt.getTime() <= Date.now() + 60_000 ? ("PENDING" as const) : ("PENDING" as const),
    attempts: 0,
  }));
  store.scheduled.push(...scheduled);

  // Optionally fire the immediately-due message right away (great for demo).
  if (input.sendNow) {
    const first = plan.find((m) => m.sendAt.getTime() <= Date.now() + 60_000);
    if (first) {
      const res = await sendSms(patient.phone, first.renderedBody, { from: clinic.twilioNumber });
      store.scheduled[store.scheduled.length - 1].status = "SENT";
      store.scheduled[store.scheduled.length - 1].twilioSid = res.sid;
      store.scheduled[store.scheduled.length - 1].sentAt = new Date().toISOString();
    }
  }

  // Remember the escalation token → enrollmentId mapping for the public page.
  escalationTokens.set(token, { enrollmentId, patientId: patient.id });
  enrollmentEscalationTokens.set(enrollmentId, token);
  reviewTokens.set(token, { reviewRequestId: "", enrollmentId, orgId: store.org.id });

  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${patient.id}`);
  revalidatePath("/dashboard");
  logAudit("enroll.create", { actor: "owner", target: enrollmentId, detail: `${protocol.name} → ${patient.name}` });
  return { enrollmentId, patientId: patient.id };
}

// Submit an escalation from the public "Something's wrong" page.
export async function submitEscalationAction(input: {
  token: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  photoUrl?: string;
}): Promise<{ ok: true }> {
  if (isSupabaseConfigured) {
    await repo.submitEscalation(input);
    logAudit("alert.create", { actor: "patient", detail: `${input.severity}: ${input.message.slice(0, 40)}` });
    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const store = getLiveStore();
  let mapping = escalationTokens.get(input.token);
  // Demo fallback: if the token isn't registered (e.g. a seeded link), attach
  // the concern to the most recent enrollment so the flow is demonstrable.
  if (!mapping) {
    const latest = store.enrollments[store.enrollments.length - 1];
    if (!latest) throw new Error("No enrollment found for this link");
    mapping = { enrollmentId: latest.id, patientId: latest.patientId };
  }

  const alert = {
    id: `alert_${nanoid(10)}`,
    enrollmentId: mapping.enrollmentId,
    patientId: mapping.patientId,
    orgId: store.org.id,
    severity: input.severity,
    category: "concern",
    message: input.message,
    photoUrl: input.photoUrl,
    status: "OPEN" as const,
    createdAt: new Date().toISOString(),
  };
  store.alerts.push(alert);

  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard");
  logAudit("alert.create", { actor: "patient", target: alert.id, detail: `${input.severity}: ${input.message.slice(0, 40)}` });
  return { ok: true };
}
export async function replyAction(conversationId: string, body: string): Promise<{ ok: true }> {
  const store = getLiveStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.messages.push({
      id: `m_${nanoid(8)}`,
      enrollmentId: conv.patientId,
      direction: "OUTBOUND",
      body,
      sentAt: new Date().toISOString(),
    });
  }
  revalidatePath("/dashboard/inbox");
  return { ok: true };
}

// In-memory token registry (demo). In DB mode this lives on the Enrollment row.
// (Moved to src/lib/escalation-registry.ts — "use server" files export only functions.)
