// Core scheduler logic: find due messages, send them, update status.
// Called by the Inngest function (production) AND a manual cron endpoint (dev/test).

import { getLiveStore } from "@/lib/data/store";
import { getClinicProfile } from "@/lib/data";
import { sendSms } from "@/lib/twilio";
import { renderTemplate } from "@/lib/messaging/tokens";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { escalationLinkFor as repoEscalationLinkFor } from "@/lib/data/supabase-repo";
import { nanoid } from "nanoid";

export interface SendReport {
  processed: number;
  sent: number;
  failed: number;
  details: { id: string; to: string; status: string; mock: boolean }[];
}

// escalation link per enrollment (demo in-memory; stored on Enrollment in DB mode)
export const enrollmentEscalationTokens = new Map<string, string>();
// review-request tracking: token -> { reviewRequestId, enrollmentId, orgId }
export const reviewTokens = new Map<string, { reviewRequestId: string; enrollmentId: string; orgId: string }>();

export function escalationLinkFor(enrollmentId: string): string {
  const token = enrollmentEscalationTokens.get(enrollmentId);
  if (!token) return "";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/w/${token}`;
}

export function reviewLinkFor(enrollmentId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  // A stable review token per enrollment (re-uses escalation token if present).
  const token = enrollmentEscalationTokens.get(enrollmentId) ?? enrollmentId;
  return `${base}/r/${token}`;
}

function withEscalationCta(body: string, link: string): string {
  if (!link) return body;
  return `${body}\n\nConcerned? Tap "Something's wrong" and we'll reach out: ${link}`;
}

export async function processDueMessages(now = new Date()): Promise<SendReport> {
  if (isSupabaseConfigured) return processDueSupabase(now);
  const store = getLiveStore();
  const clinic = await getClinicProfile();
  const report: SendReport = { processed: 0, sent: 0, failed: 0, details: [] };

  const due = store.scheduled.filter(
    (s) => s.status === "PENDING" && new Date(s.sendAt).getTime() <= now.getTime(),
  );

  for (const sm of due) {
    report.processed += 1;
    const enrollment = store.enrollments.find((e) => e.id === sm.enrollmentId);
    const patient = enrollment ? store.patients.find((p) => p.id === enrollment.patientId) : undefined;
    const protocol = enrollment ? store.protocols.find((p) => p.id === enrollment.protocolId) : undefined;
    const step = protocol?.steps.find((s) => s.id === sm.protocolStepId);

    if (!enrollment || !patient || !protocol || !step) {
      sm.status = "FAILED";
      sm.error = "Missing enrollment/patient/protocol/step";
      report.failed += 1;
      continue;
    }

    let body = renderTemplate(step.body, {
      first_name: patient.name.split(" ")[0],
      clinic_name: clinic.name,
      procedure: enrollment.procedureLabel ?? protocol.name,
      book_link: clinic.bookingUrl,
      review_link: clinic.reviewLink,
      reply_to: clinic.twilioNumber,
    });
    if (step.includeEscalation) body = withEscalationCta(body, escalationLinkFor(enrollment.id));

    try {
      const res = await sendSms(patient.phone, body, { from: clinic.twilioNumber });
      sm.status = "SENT";
      sm.attempts += 1;
      sm.twilioSid = res.sid;
      sm.sentAt = new Date().toISOString();

      // Log to conversation
      let conv = store.conversations.find((c) => c.patientId === patient.id);
      if (!conv) {
        conv = {
          id: `conv_${nanoid(8)}`,
          patientId: patient.id,
          orgId: store.org.id,
          unreadCount: 0,
          messages: [],
        };
        store.conversations.push(conv);
      }
      conv.messages.push({
        id: `m_${nanoid(8)}`,
        enrollmentId: enrollment.id,
        direction: "OUTBOUND",
        body,
        sentAt: new Date().toISOString(),
        status: res.status,
      });

      // Track review requests when a review-ask step sends.
      if (step.includeReviewAsk) {
        const rrId = `rr_${nanoid(10)}`;
        store.reviewRequests.push({
          id: rrId,
          enrollmentId: enrollment.id,
          orgId: store.org.id,
          platform: "google",
          sentAt: new Date().toISOString(),
        });
        const token = enrollmentEscalationTokens.get(enrollment.id);
        if (token) {
          const existing = reviewTokens.get(token);
          if (existing) existing.reviewRequestId = rrId;
          else reviewTokens.set(token, { reviewRequestId: rrId, enrollmentId: enrollment.id, orgId: store.org.id });
        }
      }
      report.sent += 1;
      report.details.push({ id: sm.id, to: patient.phone, status: res.status, mock: res.mock });
    } catch (err) {
      sm.status = "FAILED";
      sm.attempts += 1;
      sm.error = err instanceof Error ? err.message : "send failed";
      report.failed += 1;
    }
  }

  return report;
}

// ── Supabase-backed scheduler ────────────────────────
async function processDueSupabase(now: Date): Promise<SendReport> {
  const report: SendReport = { processed: 0, sent: 0, failed: 0, details: [] };
  const clinic = await getClinicProfile();
  const { data: dueRows } = await supabaseAdmin!
    .from("ScheduledMessage").select("*")
    .eq("status", "PENDING").lte("sendAt", now.toISOString());
  for (const sm of dueRows || []) {
    report.processed += 1;
    const { data: enrollment } = await supabaseAdmin!.from("Enrollment").select("*").eq("id", sm.enrollmentId).maybeSingle();
    const { data: patient } = enrollment ? await supabaseAdmin!.from("Patient").select("*").eq("id", enrollment.patientId).maybeSingle() : { data: null };
    const { data: step } = await supabaseAdmin!.from("ProtocolStep").select("*").eq("id", sm.protocolStepId).maybeSingle();
    if (!enrollment || !patient || !step) {
      await supabaseAdmin!.from("ScheduledMessage").update({ status: "FAILED", error: "missing refs", attempts: (sm.attempts ?? 0) + 1 }).eq("id", sm.id);
      report.failed += 1; continue;
    }
    let body = renderTemplate(step.body, {
      first_name: patient.name.split(" ")[0], clinic_name: clinic.name,
      procedure: enrollment.procedureLabel ?? "", book_link: clinic.bookingUrl,
      review_link: clinic.reviewLink, reply_to: clinic.twilioNumber,
    });
    if (step.includeEscalation) body = withEscalationCta(body, repoEscalationLinkFor(enrollment.id));
    try {
      const res = await sendSms(patient.phone, body, { from: clinic.twilioNumber });
      await supabaseAdmin!.from("MessageLog").insert({
        id: `m_${nanoid(8)}`, enrollmentId: enrollment.id, direction: "OUTBOUND", body,
        fromNumber: clinic.twilioNumber, toNumber: patient.phone, twilioSid: res.sid, status: res.status,
      });
      if (step.includeReviewAsk) {
        await supabaseAdmin!.from("ReviewRequest").insert({ id: `rr_${nanoid(10)}`, enrollmentId: enrollment.id, orgId: enrollment.orgId, platform: "google" });
      }
      await supabaseAdmin!.from("ScheduledMessage").update({ status: "SENT", twilioSid: res.sid, sentAt: new Date().toISOString(), attempts: (sm.attempts ?? 0) + 1 }).eq("id", sm.id);
      report.sent += 1;
    } catch (e) {
      await supabaseAdmin!.from("ScheduledMessage").update({ status: "FAILED", error: String(e).slice(0, 200), attempts: (sm.attempts ?? 0) + 1 }).eq("id", sm.id);
      report.failed += 1;
    }
  }
  return report;
}
