"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getLiveStore } from "@/lib/data/store";
import { getClinicProfile } from "@/lib/data";
import { sendSms } from "@/lib/twilio";
import type { AlertStatus } from "@/lib/data/types";
import { QUICK_REPLIES } from "@/lib/quick-replies";
import { logAudit } from "@/lib/audit";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import * as repo from "@/lib/data/supabase-repo";

export { QUICK_REPLIES };

export async function resolveAlertAction(
  alertId: string,
  status: AlertStatus,
  note?: string,
): Promise<void> {
  if (isSupabaseConfigured) {
    await repo.resolveAlert(alertId, status, note);
    logAudit("alert.resolve", { actor: "owner", target: alertId, detail: `${status}${note ? `: ${note}` : ""}` });
    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard");
    return;
  }
  const store = getLiveStore();
  const alert = store.alerts.find((a) => a.id === alertId);
  if (!alert) throw new Error("Alert not found");
  alert.status = status;
  if (note) alert.note = note;
  if (status === "RESOLVED" || status === "BOOKED" || status === "ESCALATED_MD") {
    alert.resolvedAt = new Date().toISOString();
  }
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard");
  logAudit("alert.resolve", { actor: "owner", target: alertId, detail: `${status}${note ? `: ${note}` : ""}` });
}

export async function replyAction(conversationId: string, body: string): Promise<void> {
  if (isSupabaseConfigured) {
    await repo.reply(conversationId, body);
    revalidatePath("/dashboard/inbox");
    return;
  }
  const store = getLiveStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) throw new Error("Conversation not found");
  const patient = store.patients.find((p) => p.id === conv.patientId);
  conv.messages.push({
    id: `m_${nanoid(8)}`,
    enrollmentId: conv.patientId,
    direction: "OUTBOUND",
    body,
    sentAt: new Date().toISOString(),
  });
  conv.unreadCount = 0;
  // Actually send the SMS (mock when no Twilio creds).
  if (patient) {
    const clinic = await getClinicProfile();
    await sendSms(patient.phone, body, { from: clinic.twilioNumber });
  }
  revalidatePath("/dashboard/inbox");
}
