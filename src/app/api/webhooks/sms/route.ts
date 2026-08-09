import { NextResponse } from "next/server";
import { getLiveStore } from "@/lib/data/store";
import { triageMessage } from "@/lib/ai/triage";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { verifyTwilioSignature } from "@/lib/twilio";
import { toE164 } from "@/lib/utils";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// Twilio inbound SMS webhook. Logs the patient's reply to their conversation
// and runs triage, flagging possible complications as alerts.
//
// This endpoint is public, so it verifies Twilio's signature before writing
// anything — otherwise anyone could forge patient messages and burn AI credits.
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  const signature = req.headers.get("x-twilio-signature") ?? "";
  const valid = await verifyTwilioSignature(req.url, params, signature);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";
  const to = params.To ?? "";

  if (!from || !body) {
    return NextResponse.json({ error: "missing From/Body" }, { status: 400 });
  }

  if (isSupabaseConfigured) {
    await handleSupabase({ from: toE164(from), to: toE164(to), body });
  } else {
    await handleMock({ from: toE164(from), body });
  }

  // Empty 200 — no auto-reply.
  return new NextResponse("", { status: 200 });
}

async function handleSupabase({ from, to, body }: { from: string; to: string; body: string }) {
  const db = supabaseAdmin!;

  // Route by the number the patient texted. That is the only signal telling us
  // which clinic this belongs to, and it keeps two clinics that share a patient
  // phone number from reading each other's messages.
  let orgId: string | undefined;
  if (to) {
    const { data: profile } = await db
      .from("ClinicProfile").select("orgId").eq("twilioNumber", to).maybeSingle();
    orgId = profile?.orgId;
  }
  if (!orgId) {
    const { data: org } = await db.from("Organization").select("id").limit(1).maybeSingle();
    orgId = org?.id;
  }
  if (!orgId) return;

  const { data: patient } = await db
    .from("Patient").select("id").eq("orgId", orgId).eq("phone", from).maybeSingle();
  if (!patient) return; // unknown sender — nothing to attach the message to

  const now = new Date().toISOString();

  // Conversation is unique on (orgId, patientId).
  const { data: existing } = await db
    .from("Conversation").select("id,unreadCount")
    .eq("orgId", orgId).eq("patientId", patient.id).maybeSingle();

  if (existing) {
    await db.from("Conversation").update({
      lastInboundAt: now, unreadCount: (existing.unreadCount ?? 0) + 1, updatedAt: now,
    }).eq("id", existing.id);
  } else {
    await db.from("Conversation").insert({
      id: `conv_${nanoid(8)}`, orgId, patientId: patient.id,
      lastInboundAt: now, unreadCount: 1, updatedAt: now,
    });
  }

  // MessageLog.enrollmentId is NOT NULL, so a reply from a patient with no
  // enrollment can't be logged there — it still raises an alert below.
  const { data: enrollment } = await db
    .from("Enrollment").select("id").eq("patientId", patient.id)
    .order("startedAt", { ascending: false }).limit(1).maybeSingle();

  if (enrollment) {
    await db.from("MessageLog").insert({
      id: `m_${nanoid(8)}`, enrollmentId: enrollment.id, direction: "INBOUND",
      body, fromNumber: from, toNumber: to || null, sentAt: now,
    });
  }

  const triage = await triageMessage(body);
  if (triage.flag) {
    await db.from("Alert").insert({
      id: `alert_${nanoid(10)}`, enrollmentId: enrollment?.id ?? null, patientId: patient.id,
      orgId, severity: triage.severity, category: triage.category, message: body, status: "OPEN",
    });
  }
}

async function handleMock({ from, body }: { from: string; body: string }) {
  const store = getLiveStore();
  const patient = store.patients.find((p) => p.phone === from);

  let conv = store.conversations.find((c) => c.patientId === patient?.id);
  if (patient && !conv) {
    conv = {
      id: `conv_${nanoid(8)}`,
      patientId: patient.id,
      orgId: store.org.id,
      unreadCount: 0,
      messages: [],
    };
    store.conversations.push(conv);
  }
  if (conv) {
    const enrollment = store.enrollments.find((e) => e.patientId === conv!.patientId);
    conv.messages.push({
      id: `m_${nanoid(8)}`,
      enrollmentId: enrollment?.id ?? conv.patientId,
      direction: "INBOUND",
      body,
      sentAt: new Date().toISOString(),
    });
    conv.lastInboundAt = new Date().toISOString();
    conv.unreadCount += 1;
  }

  const triage = await triageMessage(body);
  if (triage.flag && patient) {
    const enrollment = store.enrollments.find((e) => e.patientId === patient.id);
    store.alerts.push({
      id: `alert_${nanoid(10)}`,
      enrollmentId: enrollment?.id,
      patientId: patient.id,
      orgId: store.org.id,
      severity: triage.severity,
      category: triage.category,
      message: body,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    });
  }
}
