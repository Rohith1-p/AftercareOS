"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getLiveStore } from "@/lib/data/store";
import { autoEnrollFromBooking } from "@/lib/booking-enroll";
import { logAudit } from "@/lib/audit";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import * as repo from "@/lib/data/supabase-repo";

export async function saveServiceMappingAction(
  serviceId: string,
  label: string,
  protocolId: string,
  autoEnroll: boolean,
): Promise<void> {
  if (isSupabaseConfigured) {
    await repo.saveServiceMapping(serviceId, label, protocolId, autoEnroll);
    revalidatePath("/dashboard/settings");
    return;
  }
  const store = getLiveStore();
  const existing = store.serviceMappings.find(
    (m) => m.provider === "square" && m.externalServiceId === serviceId,
  );
  if (existing) {
    existing.protocolId = protocolId;
    existing.externalLabel = label;
    existing.autoEnroll = autoEnroll;
  } else {
    store.serviceMappings.push({
      id: `map_${nanoid(8)}`,
      orgId: store.org.id,
      provider: "square",
      externalServiceId: serviceId,
      externalLabel: label,
      protocolId,
      autoEnroll,
    });
  }
  revalidatePath("/dashboard/settings");
}

// CSV fallback: parse "name,phone,service" rows and enroll each (completed now).
export async function importCsvAction(csv: string): Promise<{ enrolled: number }> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() && !/^name,/i.test(l));
  let enrolled = 0;
  for (const line of lines) {
    const [name, phone, service] = line.split(",").map((s) => s?.trim());
    if (!phone) continue;
    try {
      await autoEnrollFromBooking({
        name: name || "Patient",
        phone,
        serviceId: service || "svc_botox",
        serviceName: service || "Imported service",
      });
      enrolled += 1;
    } catch {
      // skip bad rows
    }
  }
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard");
  return { enrolled };
}

export async function saveClinicProfileAction(input: {
  name: string;
  senderName: string;
  brandColor: string;
  bookingUrl: string;
  reviewLink: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  consentText: string;
}): Promise<void> {
  if (isSupabaseConfigured) {
    await repo.saveClinicProfile(input);
    logAudit("clinic.update", { actor: "owner", detail: input.name });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return;
  }
  const store = getLiveStore();
  Object.assign(store.clinic, input);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  logAudit("clinic.update", { actor: "owner", detail: input.name });
}
