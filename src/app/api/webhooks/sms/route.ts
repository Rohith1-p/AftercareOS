import { NextResponse } from "next/server";
import { getLiveStore } from "@/lib/data/store";
import { getClinicProfile } from "@/lib/data";
import { triageMessage } from "@/lib/ai/triage";
import { toE164 } from "@/lib/utils";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// Twilio inbound SMS webhook.
// POST from Twilio with From/Body (form-encoded). We log the message to the
// patient's conversation and run triage — flagging complications as alerts.
export async function POST(req: Request) {
  const form = await req.formData();
  const from = String(form.get("From") || "");
  const body = String(form.get("Body") || "");

  if (!from || !body) {
    return NextResponse.json({ error: "missing From/Body" }, { status: 400 });
  }

  const store = getLiveStore();
  const phone = toE164(from);
  const patient = store.patients.find((p) => p.phone === phone);

  // Find or create a conversation.
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

  // Triage: flag complications as alerts.
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

  // Acknowledge to Twilio (empty 200 is fine; no auto-reply for now).
  return new NextResponse("", { status: 200 });
}
