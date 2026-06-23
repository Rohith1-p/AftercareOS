// Shared domain types for AftercareOS (mirrors Prisma models).

export type Role = "OWNER" | "ADMIN" | "STAFF";
export type Plan = "STARTER" | "PROFESSIONAL" | "GROWTH" | "ENTERPRISE";
export type ProtocolSource = "TEMPLATE" | "AI_IMPORTED" | "CUSTOM";
export type ProtocolStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type AlertStatus =
  | "OPEN"
  | "REVIEWED"
  | "RESPONDED"
  | "BOOKED"
  | "ESCALATED_MD"
  | "RESOLVED";
export type EnrollmentStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELED";
export type ScheduledStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
}

export interface ClinicProfile {
  orgId: string;
  name: string;
  logoUrl?: string;
  brandColor: string;
  senderName: string;
  twilioNumber?: string;
  bookingUrl?: string;
  reviewLink?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  consentText?: string;
  language?: string;
}

export interface ProtocolStep {
  id: string;
  protocolId: string;
  order: number;
  offsetMinutes: number;
  label: string;
  body: string;
  includeEscalation: boolean;
  includeReviewAsk: boolean;
  includeRebook: boolean;
  mediaUrl?: string;
}

export interface Protocol {
  id: string;
  orgId: string;
  name: string;
  category: string;
  segment?: string;
  source: ProtocolSource;
  status: ProtocolStatus;
  tone: string;
  version: number;
  steps: ProtocolStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMapping {
  id: string;
  orgId: string;
  provider: string;
  externalServiceId: string;
  externalLabel: string;
  protocolId: string;
  autoEnroll: boolean;
}

export interface Patient {
  id: string;
  orgId: string;
  phone: string;
  name: string;
  email?: string;
  consentAt?: string;
  source: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  patientId: string;
  protocolId: string;
  orgId: string;
  procedureLabel?: string;
  appointmentAt: string;
  status: EnrollmentStatus;
  currentOffsetMin: number;
  startedAt: string;
  completedAt?: string;
}

export interface ScheduledMessage {
  id: string;
  enrollmentId: string;
  protocolStepId: string;
  sendAt: string;
  status: ScheduledStatus;
  attempts: number;
  twilioSid?: string;
  sentAt?: string;
  error?: string;
}

export interface MessageLog {
  id: string;
  enrollmentId: string;
  direction: "OUTBOUND" | "INBOUND";
  body: string;
  sentAt: string;
  status?: string;
}

export interface Alert {
  id: string;
  enrollmentId?: string;
  patientId?: string;
  orgId: string;
  severity: Severity;
  category: string;
  message: string;
  photoUrl?: string;
  status: AlertStatus;
  note?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  patientId: string;
  orgId: string;
  lastInboundAt?: string;
  unreadCount: number;
  messages: MessageLog[];
}

export interface ReviewRequest {
  id: string;
  enrollmentId: string;
  orgId: string;
  platform: string;
  sentAt: string;
  clickedAt?: string;
}

export interface Integration {
  id: string;
  orgId: string;
  provider: string;
  externalMerchantId?: string;
  status: string;
  connectedAt: string;
}

// ── Audit log (Phase 7, HIPAA) ───────────────────────
export interface AuditLog {
  id: string;
  orgId: string;
  actor: string; // user email or "system"
  action: string; // e.g. "enroll.create", "alert.resolve"
  target?: string; // entity id
  detail?: string;
  createdAt: string;
}
