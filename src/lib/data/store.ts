import { SEED_PROTOCOLS, SEED_ORG_ID } from "./seed";
import type {
  Organization,
  ClinicProfile,
  Protocol,
  Patient,
  Enrollment,
  Alert,
  Conversation,
  MessageLog,
  Integration,
  ReviewRequest,
  ScheduledMessage,
} from "./types";

// ── Mock store: powers the full UI without a database ──
// When DATABASE_URL is configured, src/lib/data/index.ts swaps to Prisma.

export const DEMO_ORG: Organization = {
  id: SEED_ORG_ID,
  name: "Glow Aesthetics Studio",
  plan: "PROFESSIONAL",
  status: "TRIAL",
};

export const DEMO_CLINIC: ClinicProfile = {
  orgId: SEED_ORG_ID,
  name: "Glow Aesthetics Studio",
  brandColor: "#e85d2c",
  senderName: "Glow Aesthetics",
  twilioNumber: "+15551234567",
  bookingUrl: "https://glow.book.app",
  reviewLink: "https://g.page/r/glow-aesthetics/review",
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  language: "en",
  consentText:
    "Message & data rates may apply. Reply STOP to opt out. This is not a medical emergency line.",
};

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function iso(msAgo: number): string {
  return new Date(now - msAgo).toISOString();
}
function isoFuture(msAhead: number): string {
  return new Date(now + msAhead).toISOString();
}

export const DEMO_PATIENTS: Patient[] = [
  { id: "pat_1", orgId: SEED_ORG_ID, phone: "+15551001001", name: "Sarah Mitchell", email: "sarah@example.com", consentAt: iso(3 * DAY), source: "square", createdAt: iso(3 * DAY) },
  { id: "pat_2", orgId: SEED_ORG_ID, phone: "+15551001002", name: "Jessica Tran", consentAt: iso(2 * DAY), source: "square", createdAt: iso(2 * DAY) },
  { id: "pat_3", orgId: SEED_ORG_ID, phone: "+15551001003", name: "Maria Lopez", consentAt: iso(5 * DAY), source: "manual", createdAt: iso(5 * DAY) },
  { id: "pat_4", orgId: SEED_ORG_ID, phone: "+15551001004", name: "Aisha Khan", consentAt: iso(1 * DAY), source: "square", createdAt: iso(1 * DAY) },
  { id: "pat_5", orgId: SEED_ORG_ID, phone: "+15551001005", name: "Emily Chen", consentAt: iso(14 * DAY), source: "square", createdAt: iso(14 * DAY) },
  { id: "pat_6", orgId: SEED_ORG_ID, phone: "+15551001006", name: "Priya Patel", consentAt: iso(8 * DAY), source: "manual", createdAt: iso(8 * DAY) },
];

export const DEMO_ENROLLMENTS: Enrollment[] = [
  { id: "enr_1", patientId: "pat_1", protocolId: "proto_botox", orgId: SEED_ORG_ID, procedureLabel: "Botox · Forehead", appointmentAt: iso(6 * HOUR), status: "ACTIVE", currentOffsetMin: 360, startedAt: iso(6 * HOUR) },
  { id: "enr_2", patientId: "pat_2", protocolId: "proto_filler", orgId: SEED_ORG_ID, procedureLabel: "Lip Filler", appointmentAt: iso(1 * DAY), status: "ACTIVE", currentOffsetMin: 1440, startedAt: iso(1 * DAY) },
  { id: "enr_3", patientId: "pat_3", protocolId: "proto_laser", orgId: SEED_ORG_ID, procedureLabel: "Laser · Underarms", appointmentAt: iso(3 * DAY), status: "ACTIVE", currentOffsetMin: 4320, startedAt: iso(3 * DAY) },
  { id: "enr_4", patientId: "pat_4", protocolId: "proto_peel", orgId: SEED_ORG_ID, procedureLabel: "Chemical Peel", appointmentAt: iso(5 * HOUR), status: "ACTIVE", currentOffsetMin: 300, startedAt: iso(5 * HOUR) },
  { id: "enr_5", patientId: "pat_5", protocolId: "proto_botox", orgId: SEED_ORG_ID, procedureLabel: "Botox · Crow's feet", appointmentAt: iso(14 * DAY), status: "COMPLETED", currentOffsetMin: 20160, startedAt: iso(14 * DAY), completedAt: iso(0) },
  { id: "enr_6", patientId: "pat_6", protocolId: "proto_microneedling", orgId: SEED_ORG_ID, procedureLabel: "Microneedling", appointmentAt: iso(8 * DAY), status: "ACTIVE", currentOffsetMin: 11520, startedAt: iso(8 * DAY) },
];

export const DEMO_SCHEDULED: ScheduledMessage[] = [
  { id: "sm_1", enrollmentId: "enr_1", protocolStepId: "proto_botox-s3", sendAt: isoFuture(2 * HOUR), status: "PENDING", attempts: 0 },
  { id: "sm_2", enrollmentId: "enr_2", protocolStepId: "proto_filler-s4", sendAt: isoFuture(2 * DAY), status: "PENDING", attempts: 0 },
  { id: "sm_3", enrollmentId: "enr_3", protocolStepId: "proto_laser-s4", sendAt: isoFuture(4 * DAY), status: "PENDING", attempts: 0 },
];

export const DEMO_ALERTS: Alert[] = [
  { id: "alert_1", enrollmentId: "enr_2", patientId: "pat_2", orgId: SEED_ORG_ID, severity: "HIGH", category: "Swelling", message: "Left side of my lips is more swollen than the right and feels firm. Is this normal?", photoUrl: undefined, status: "OPEN", createdAt: iso(40 * MIN) },
  { id: "alert_2", enrollmentId: "enr_3", patientId: "pat_3", orgId: SEED_ORG_ID, severity: "MEDIUM", category: "Redness", message: "The area is still pretty red on Day 3, a bit more than I expected.", status: "OPEN", createdAt: iso(3 * HOUR) },
  { id: "alert_3", enrollmentId: "enr_6", patientId: "pat_6", orgId: SEED_ORG_ID, severity: "LOW", category: "Dryness", message: "Skin feels dry and flaky, otherwise fine.", status: "REVIEWED", note: "Normal for Day 3, replied with hydrating tips.", resolvedAt: iso(2 * HOUR), createdAt: iso(5 * HOUR) },
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1", patientId: "pat_1", orgId: SEED_ORG_ID, lastInboundAt: iso(30 * MIN), unreadCount: 1,
    messages: [
      { id: "m1", enrollmentId: "enr_1", direction: "OUTBOUND", body: "Hi Sarah! Congrats on your treatment today 🎉 stay upright for 4 hours…", sentAt: iso(6 * HOUR) },
      { id: "m2", enrollmentId: "enr_1", direction: "INBOUND", body: "Thank you! How long until I see results?", sentAt: iso(30 * MIN) },
    ],
  },
  {
    id: "conv_2", patientId: "pat_3", orgId: SEED_ORG_ID, lastInboundAt: iso(3 * HOUR), unreadCount: 2,
    messages: [
      { id: "m3", enrollmentId: "enr_3", direction: "OUTBOUND", body: "Day 3 check-in: shedding is normal…", sentAt: iso(3 * HOUR) },
      { id: "m4", enrollmentId: "enr_3", direction: "INBOUND", body: "It's so red still, should I be worried?", sentAt: iso(3 * HOUR) },
    ],
  },
];

export const DEMO_REVIEW_REQUESTS: ReviewRequest[] = [
  { id: "rr_1", enrollmentId: "enr_5", orgId: SEED_ORG_ID, platform: "google", sentAt: iso(0), clickedAt: iso(0) },
  { id: "rr_2", enrollmentId: "enr_5", orgId: SEED_ORG_ID, platform: "google", sentAt: iso(2 * DAY) },
];

export const DEMO_INTEGRATIONS: Integration[] = [
  { id: "int_1", orgId: SEED_ORG_ID, provider: "square", externalMerchantId: "MLHXXXX", status: "connected", connectedAt: iso(10 * DAY) },
];

export const DEMO_SERVICE_MAPPINGS: import("./types").ServiceMapping[] = [
  { id: "map_1", orgId: SEED_ORG_ID, provider: "square", externalServiceId: "svc_botox", externalLabel: "Botox — 1 Area", protocolId: "proto_botox", autoEnroll: true },
  { id: "map_2", orgId: SEED_ORG_ID, provider: "square", externalServiceId: "svc_filler_lips", externalLabel: "Lip Filler", protocolId: "proto_filler", autoEnroll: true },
  { id: "map_3", orgId: SEED_ORG_ID, provider: "square", externalServiceId: "svc_laser", externalLabel: "Laser Hair Removal", protocolId: "proto_laser", autoEnroll: true },
  { id: "map_4", orgId: SEED_ORG_ID, provider: "square", externalServiceId: "svc_peel", externalLabel: "Chemical Peel", protocolId: "proto_peel", autoEnroll: true },
  { id: "map_5", orgId: SEED_ORG_ID, provider: "square", externalServiceId: "svc_microneedle", externalLabel: "Microneedling", protocolId: "proto_microneedling", autoEnroll: true },
];

export interface MockStore {
  org: Organization;
  clinic: ClinicProfile;
  protocols: Protocol[];
  patients: Patient[];
  enrollments: Enrollment[];
  scheduled: ScheduledMessage[];
  alerts: Alert[];
  conversations: Conversation[];
  reviewRequests: ReviewRequest[];
  integrations: Integration[];
  serviceMappings: import("./types").ServiceMapping[];
  auditLogs: import("./types").AuditLog[];
}

export function getMockStore(): MockStore {
  return {
    org: DEMO_ORG,
    clinic: DEMO_CLINIC,
    protocols: structuredClone(SEED_PROTOCOLS),
    patients: structuredClone(DEMO_PATIENTS),
    enrollments: structuredClone(DEMO_ENROLLMENTS),
    scheduled: structuredClone(DEMO_SCHEDULED),
    alerts: structuredClone(DEMO_ALERTS),
    conversations: structuredClone(DEMO_CONVERSATIONS),
    reviewRequests: structuredClone(DEMO_REVIEW_REQUESTS),
    integrations: structuredClone(DEMO_INTEGRATIONS),
    serviceMappings: structuredClone(DEMO_SERVICE_MAPPINGS),
    auditLogs: [],
  };
}

// In-memory mutable store (for server actions to mutate during dev).
// Persisted on globalThis so it's shared across all module instances
// (server actions + page renders) — without this, mutations made in a server
// action wouldn't be visible to the next page render (Next.js module isolation).
const globalStore = globalThis as unknown as { __aosLiveStore?: MockStore };

export function getLiveStore(): MockStore {
  if (!globalStore.__aosLiveStore) globalStore.__aosLiveStore = getMockStore();
  return globalStore.__aosLiveStore;
}
export function resetLiveStore() {
  globalStore.__aosLiveStore = undefined;
}
