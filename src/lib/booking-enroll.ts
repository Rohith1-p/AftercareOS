// Auto-enroll a patient from a completed booking (used by Square webhook + dev simulator).

import { nanoid } from "nanoid";
import { getLiveStore } from "@/lib/data/store";
import { getClinicProfile } from "@/lib/data";
import { buildEnrollmentPlan } from "@/lib/enrollment";
import { sendSms } from "@/lib/twilio";
import { enrollmentEscalationTokens, reviewTokens, reviewLinkFor } from "@/lib/scheduler";
import { escalationTokens } from "@/lib/escalation-registry";
import { toE164 } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import * as repo from "@/lib/data/supabase-repo";

export interface BookingInput {
  name: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  completedAt?: string;
}

export async function autoEnrollFromBooking(
  input: BookingInput,
): Promise<{ enrollmentId: string; patientId: string; protocolId: string; matched: boolean }> {
  if (isSupabaseConfigured) {
    const mappings = await repo.getServiceMappings();
    const mapping = mappings.find((m) => m.provider === "square" && m.externalServiceId === input.serviceId);
    const protocols = await repo.getProtocols();
    const protocol = (mapping ? protocols.find((p) => p.id === mapping.protocolId) : undefined) ?? protocols.find((p) => p.id === guessProtocol(input.serviceName, protocols)) ?? protocols[0];
    if (!protocol) throw new Error("No protocol available");
    const res = await repo.enrollPatient({
      name: input.name, phone: input.phone, protocolId: protocol.id,
      appointmentAt: input.completedAt ?? new Date().toISOString(),
      procedureLabel: input.serviceName, sendNow: true,
    });
    return { ...res, protocolId: protocol.id, matched: Boolean(mapping) };
  }
  const store = getLiveStore();
  const clinic = await getClinicProfile();
  const phone = toE164(input.phone);

  // Find a service → protocol mapping.
  const mapping = store.serviceMappings?.find(
    (m) => m.provider === "square" && m.externalServiceId === input.serviceId,
  );
  const protocolId = mapping?.protocolId ?? "";
  const matched = Boolean(mapping);

  // No mapping? fall back to a best-guess protocol by service name keywords.
  let protocol = store.protocols.find((p) => p.id === protocolId);
  if (!protocol) {
    const guess = guessProtocol(input.serviceName, store.protocols.map((p) => ({ id: p.id, name: p.name })));
    protocol = store.protocols.find((p) => p.id === guess) ?? store.protocols[0];
  }

  // Find or create patient.
  let patient = store.patients.find((p) => p.phone === phone);
  if (!patient) {
    patient = {
      id: `pat_${nanoid(10)}`,
      orgId: store.org.id,
      phone,
      name: input.name,
      consentAt: new Date().toISOString(),
      source: "square",
      createdAt: new Date().toISOString(),
    };
    store.patients.push(patient);
  }

  const token = nanoid(16);
  const enrollmentId = `enr_${nanoid(10)}`;
  const appointmentAt = new Date(input.completedAt ?? Date.now());

  const plan = buildEnrollmentPlan({
    protocol,
    appointmentAt,
    ctx: {
      first_name: patient.name.split(" ")[0],
      clinic_name: clinic.name,
      procedure: input.serviceName,
      book_link: clinic.bookingUrl,
      review_link: reviewLinkFor(enrollmentId),
      reply_to: clinic.twilioNumber,
    },
    quiet: { start: clinic.quietHoursStart, end: clinic.quietHoursEnd },
    escalation: { baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", token },
  });

  store.enrollments.push({
    id: enrollmentId,
    patientId: patient.id,
    protocolId: protocol.id,
    orgId: store.org.id,
    procedureLabel: input.serviceName,
    appointmentAt: appointmentAt.toISOString(),
    status: "ACTIVE",
    currentOffsetMin: 0,
    startedAt: new Date().toISOString(),
  });

  store.scheduled.push(
    ...plan.map((m) => ({
      id: `sm_${nanoid(10)}`,
      enrollmentId,
      protocolStepId: m.step.id,
      sendAt: m.sendAt.toISOString(),
      status: "PENDING" as const,
      attempts: 0,
    })),
  );

  escalationTokens.set(token, { enrollmentId, patientId: patient.id });
  enrollmentEscalationTokens.set(enrollmentId, token);
  reviewTokens.set(token, { reviewRequestId: "", enrollmentId, orgId: store.org.id });

  // Fire the first immediately-due message (great for demo).
  const first = plan.find((m) => m.sendAt.getTime() <= Date.now() + 60_000);
  if (first) {
    const res = await sendSms(patient.phone, first.renderedBody, { from: clinic.twilioNumber });
    const sm = store.scheduled[store.scheduled.length - 1];
    if (sm) {
      sm.status = "SENT";
      sm.twilioSid = res.sid;
      sm.sentAt = new Date().toISOString();
    }
  }

  return { enrollmentId, patientId: patient.id, protocolId: protocol.id, matched };
}

function guessProtocol(
  serviceName: string,
  protocols: { id: string; name: string }[],
): string {
  const s = serviceName.toLowerCase();
  if (/botox|wrinkle|dysport/.test(s)) return protocols.find((p) => p.name.toLowerCase().includes("botox"))?.id ?? "";
  if (/filler|lip/.test(s)) return protocols.find((p) => p.name.toLowerCase().includes("filler"))?.id ?? "";
  if (/laser/.test(s)) return protocols.find((p) => p.name.toLowerCase().includes("laser"))?.id ?? "";
  if (/peel/.test(s)) return protocols.find((p) => p.name.toLowerCase().includes("peel"))?.id ?? "";
  if (/microneedl/.test(s)) return protocols.find((p) => p.name.toLowerCase().includes("microneedl"))?.id ?? "";
  return "";
}
