// Enrollment service — the heart of AftercareOS.
// Given a patient + protocol + appointment time, compute the full schedule
// of timed messages (with quiet-hours + token rendering). Fully testable, no
// external services required.

import type { Protocol, ProtocolStep } from "@/lib/data/types";
import { computeSendAt, renderTemplate } from "@/lib/messaging/tokens";

export interface RenderContext {
  first_name?: string;
  clinic_name?: string;
  provider_name?: string;
  procedure?: string;
  book_link?: string;
  review_link?: string;
  reply_to?: string;
}

export interface EscalationLinkConfig {
  /** Base URL for the public escalation page, e.g. https://app.aftercareos.com */
  baseUrl: string;
  /** A short opaque token identifying the enrollment (so the link is unguessable). */
  token: string;
}

export interface PlannedMessage {
  step: ProtocolStep;
  sendAt: Date;
  renderedBody: string;
}

export interface QuietWindow {
  start?: string;
  end?: string;
}

// Build the escalation link appended to steps with includeEscalation.
export function escalationLink(cfg?: EscalationLinkConfig): string {
  if (!cfg) return "";
  return `${cfg.baseUrl.replace(/\/$/, "")}/w/${cfg.token}`;
}

// Append a short "Something's wrong" CTA to escalation messages.
function withEscalationCta(body: string, link: string): string {
  if (!link) return body;
  return `${body}\n\nConcerned? Tap "Something's wrong" and we'll reach out: ${link}`;
}

// Compute the full plan of messages for an enrollment.
export function buildEnrollmentPlan(params: {
  protocol: Protocol;
  appointmentAt: Date;
  ctx: RenderContext;
  quiet?: QuietWindow;
  escalation?: EscalationLinkConfig;
}): PlannedMessage[] {
  const { protocol, appointmentAt, ctx, quiet, escalation } = params;
  const link = escalationLink(escalation);
  const steps = [...protocol.steps].sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  return steps.map((step) => {
    const sendAt = computeSendAt(appointmentAt, step.offsetMinutes, quiet);
    let body = renderTemplate(step.body, ctx);
    if (step.includeEscalation) body = withEscalationCta(body, link);
    return { step, sendAt, renderedBody: body };
  });
}

// The next message due (for display / testing the scheduler).
export function nextDue(planned: PlannedMessage[], now = new Date()): PlannedMessage | undefined {
  return planned.find((m) => m.sendAt > now);
}

// Human-readable day label from offset (shared UI helper).
export function offsetDayLabel(offsetMinutes: number): string {
  const d = Math.floor(offsetMinutes / 1440);
  return d <= 0 ? "Day 0" : `Day ${d}`;
}

export { renderTemplate };
