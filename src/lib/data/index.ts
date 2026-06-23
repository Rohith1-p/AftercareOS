import { hasDatabase } from "@/lib/db";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { getLiveStore } from "./store";
import { SEED_PROTOCOLS } from "./seed";
import * as repo from "./supabase-repo";
import type {
  Protocol, Patient, Enrollment, Alert, Conversation, ReviewRequest,
  Integration, ClinicProfile, Organization, ScheduledMessage, ServiceMapping,
} from "./types";

// Supabase mode is active when the secret key is configured. Otherwise the
// in-memory mock store powers the UI (used by tests + offline dev).
const SB = isSupabaseConfigured;

export const isMockMode = !SB;

export async function getOrg(): Promise<Organization> {
  return SB ? repo.getOrg() : getLiveStore().org;
}

export async function getClinicProfile(): Promise<ClinicProfile> {
  return SB ? repo.getClinicProfile() : getLiveStore().clinic;
}

export async function getProtocols(): Promise<Protocol[]> {
  return SB ? repo.getProtocols() : getLiveStore().protocols;
}

export async function getProtocol(id: string): Promise<Protocol | undefined> {
  return SB ? repo.getProtocol(id) : getLiveStore().protocols.find((p) => p.id === id);
}

export async function getPatients(): Promise<Patient[]> {
  return SB ? repo.getPatients() : getLiveStore().patients;
}

export async function getEnrollments(): Promise<Enrollment[]> {
  return SB ? repo.getEnrollments() : getLiveStore().enrollments;
}

export async function getScheduled(): Promise<ScheduledMessage[]> {
  return SB ? repo.getScheduled() : getLiveStore().scheduled;
}

export async function getAlerts(): Promise<Alert[]> {
  return SB ? repo.getAlerts() : getLiveStore().alerts;
}

export async function getConversations(): Promise<Conversation[]> {
  return SB ? repo.getConversations() : getLiveStore().conversations;
}

export async function getReviewRequests(): Promise<ReviewRequest[]> {
  return SB ? repo.getReviewRequests() : getLiveStore().reviewRequests;
}

export async function getIntegrations(): Promise<Integration[]> {
  return SB ? repo.getIntegrations() : getLiveStore().integrations;
}

export async function getServiceMappings(): Promise<ServiceMapping[]> {
  return SB ? repo.getServiceMappings() : getLiveStore().serviceMappings ?? [];
}

export function dayBucketLabel(offsetMinutes: number): string {
  const d = Math.floor(offsetMinutes / 1440);
  if (d <= 0) return "Day 0";
  return `Day ${d}`;
}

export interface HomeSnapshot {
  activeJourneys: number;
  byDay: { label: string; count: number }[];
  openAlerts: number;
  urgentAlerts: number;
  messagesSentToday: number;
  messagesSent7d: number;
  reviewRequests7d: number;
}

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  const [enrollments, alerts] = await Promise.all([getEnrollments(), getAlerts()]);
  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const buckets = new Map<string, number>();
  for (const e of active) {
    const label = dayBucketLabel(e.currentOffsetMin);
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  const ordered = ["Day 0", "Day 1", "Day 3", "Day 7", "Day 14"];
  const byDay = ordered
    .map((label) => ({ label, count: buckets.get(label) ?? 0 }))
    .concat(
      [...buckets.keys()].filter((k) => !ordered.includes(k)).map((label) => ({ label, count: buckets.get(label) ?? 0 })),
    );
  const open = alerts.filter((a) => a.status === "OPEN");
  return {
    activeJourneys: active.length,
    byDay,
    openAlerts: open.length,
    urgentAlerts: open.filter((a) => a.severity === "URGENT" || a.severity === "HIGH").length,
    messagesSentToday: SB ? 0 : 42,
    messagesSent7d: SB ? 0 : 268,
    reviewRequests7d: SB ? 0 : 11,
  };
}

export { SEED_PROTOCOLS };
export { hasDatabase, supabaseAdmin };
export { getMockStore, getLiveStore } from "./store";
