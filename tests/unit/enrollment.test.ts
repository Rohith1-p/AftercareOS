import { describe, it, expect } from "vitest";
import { buildEnrollmentPlan, escalationLink, nextDue } from "@/lib/enrollment";
import { SEED_PROTOCOLS } from "@/lib/data/seed";
import type { Protocol, ProtocolStep } from "@/lib/data/types";

function proto(): Protocol {
  const p = SEED_PROTOCOLS.find((x) => x.id === "proto_botox")!;
  return JSON.parse(JSON.stringify(p));
}

describe("escalationLink", () => {
  it("builds a /w/:token url", () => {
    expect(escalationLink({ baseUrl: "https://app.test/", token: "abc" })).toBe(
      "https://app.test/w/abc",
    );
  });
  it("returns empty when no config", () => {
    expect(escalationLink(undefined)).toBe("");
  });
});

describe("buildEnrollmentPlan", () => {
  const appt = new Date("2026-06-23T10:00:00");
  const plan = buildEnrollmentPlan({
    protocol: proto(),
    appointmentAt: appt,
    ctx: { first_name: "Sarah", clinic_name: "Glow", book_link: "https://b", review_link: "https://r" },
    escalation: { baseUrl: "https://app.test", token: "tok" },
  });

  it("produces one planned message per step, sorted by offset", () => {
    expect(plan.length).toBe(proto().steps.length);
    const offsets = plan.map((m) => m.step.offsetMinutes);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it("renders tokens into bodies", () => {
    expect(plan.some((m) => m.renderedBody.includes("Sarah"))).toBe(true);
    expect(plan.every((m) => !m.renderedBody.includes("{{"))).toBe(true);
  });

  it("appends the escalation link to escalation steps only", () => {
    const esc = plan.filter((m) => m.step.includeEscalation);
    expect(esc.length).toBeGreaterThan(0);
    expect(esc.every((m) => m.renderedBody.includes("/w/tok"))).toBe(true);
    const nonEsc = plan.filter((m) => !m.step.includeEscalation);
    expect(nonEsc.every((m) => !m.renderedBody.includes("/w/tok"))).toBe(true);
  });

  it("computes sendAt = appointment + offset", () => {
    const first = plan[0];
    const expected = new Date(appt.getTime() + first.step.offsetMinutes * 60_000);
    expect(first.sendAt.toISOString()).toBe(expected.toISOString());
  });
});

describe("nextDue", () => {
  it("returns the first message after now", () => {
    const steps: ProtocolStep[] = [
      { id: "a", protocolId: "p", order: 1, offsetMinutes: 5, label: "L", body: "b", includeEscalation: false, includeReviewAsk: false, includeRebook: false },
      { id: "b", protocolId: "p", order: 2, offsetMinutes: 1440, label: "L", body: "b", includeEscalation: false, includeReviewAsk: false, includeRebook: false },
    ];
    const past = new Date(Date.now() - 10_000);
    const plan = steps.map((step) => ({ step, sendAt: new Date(past.getTime() + step.offsetMinutes * 60_000), renderedBody: "x" }));
    const due = nextDue(plan);
    expect(due).toBeDefined();
  });
});
