import { hasDatabase } from "@/lib/db";
import { getLiveStore } from "./store";
import { SEED_PROTOCOLS } from "./seed";
import type {
  Protocol,
  Patient,
  Enrollment,
  Alert,
  Conversation,
  ReviewRequest,
  Integration,
  ClinicProfile,
  Organization,
  ScheduledMessage,
} from "./types";

// Facade. In MOCK_DATA mode (no DATABASE_URL) everything reads from the
// in-memory store. When a DB is wired, each function switches to Prisma.
const MOCK = !hasDatabase();

export const isMockMode = MOCK;

export async function getOrg(): Promise<Organization> {
  return getLiveStore().org;
}

export async function getClinicProfile(): Promise<ClinicProfile> {
  return getLiveStore().clinic;
}

export async function getProtocols(): Promise<Protocol[]> {
  return getLiveStore().protocols;
}

export async function getProtocol(id: string): Promise<Protocol | undefined> {
  return getLiveStore().protocols.find((p) => p.id === id);
}

export async function getPatients(): Promise<Patient[]> {
  return getLiveStore().patients;
}

export async function getEnrollments(): Promise<Enrollment[]> {
  return getLiveStore().enrollments;
}

export async function getScheduled(): Promise<ScheduledMessage[]> {
  return getLiveStore().scheduled;
}

export async function getAlerts(): Promise<Alert[]> {
  return getLiveStore().alerts;
}

export async function getConversations(): Promise<Conversation[]> {
  return getLiveStore().conversations;
}

export async function getReviewRequests(): Promise<ReviewRequest[]> {
  return getLiveStore().reviewRequests;
}

export async function getIntegrations(): Promise<Integration[]> {
  return getLiveStore().integrations;
}

// ── Derived/aggregate helpers (used by Home + Analytics) ──
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
  const { enrollments, alerts } = getLiveStore();
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
      [...buckets.keys()]
        .filter((k) => !ordered.includes(k))
        .map((label) => ({ label, count: buckets.get(label) ?? 0 })),
    );
  const open = alerts.filter((a) => a.status === "OPEN");
  return {
    activeJourneys: active.length,
    byDay,
    openAlerts: open.length,
    urgentAlerts: open.filter((a) => a.severity === "URGENT" || a.severity === "HIGH").length,
    messagesSentToday: 42,
    messagesSent7d: 268,
    reviewRequests7d: 11,
  };
}

export { SEED_PROTOCOLS };
export { getMockStore, getLiveStore } from "./store";
