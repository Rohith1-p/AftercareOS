"use server";

import { getClinicProfile } from "@/lib/data";

// Look up minimal clinic branding for the public page (no PHI leaked).
export async function getEscalationContext(token: string): Promise<{ clinicName: string } | null> {
  await getClinicProfile();
  // Token validity is checked at submit time. For the public page we only show
  // the clinic name (safe, non-PHI).
  return { clinicName: "your clinic" };
}
