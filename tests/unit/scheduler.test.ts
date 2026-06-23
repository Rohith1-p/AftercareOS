import { describe, it, expect, beforeEach } from "vitest";
import { processDueMessages, enrollmentEscalationTokens, reviewTokens } from "@/lib/scheduler";
import { getLiveStore, resetLiveStore } from "@/lib/data/store";

describe("processDueMessages (mock Twilio)", () => {
  beforeEach(() => {
    resetLiveStore();
    enrollmentEscalationTokens.clear();
    reviewTokens.clear();
  });

  it("sends due pending messages and marks them SENT", async () => {
    const store = getLiveStore();
    // make one scheduled message due in the past
    const sm = store.scheduled[0];
    sm.sendAt = new Date(Date.now() - 60_000).toISOString();
    sm.status = "PENDING";
    // link it to an existing enrollment/protocol/step
    const enr = store.enrollments[0];
    sm.enrollmentId = enr.id;
    const proto = store.protocols.find((p) => p.id === enr.protocolId)!;
    sm.protocolStepId = proto.steps[0].id;

    const report = await processDueMessages();
    expect(report.processed).toBeGreaterThanOrEqual(1);
    expect(report.sent).toBeGreaterThanOrEqual(1);
    expect(store.scheduled.find((s) => s.id === sm.id)?.status).toBe("SENT");
  });

  it("skips future messages", async () => {
    const store = getLiveStore();
    const sm = store.scheduled[0];
    sm.sendAt = new Date(Date.now() + 60_000).toISOString(); // future
    sm.status = "PENDING";
    const report = await processDueMessages();
    expect(report.processed).toBe(0);
  });

  it("creates a tracked ReviewRequest when a review-ask step sends", async () => {
    const store = getLiveStore();
    const enr = store.enrollments[0];
    const proto = store.protocols.find((p) => p.id === enr.protocolId)!;
    const reviewStep = proto.steps.find((s) => s.includeReviewAsk)!;
    const token = "revtoken-test";
    enrollmentEscalationTokens.set(enr.id, token);
    reviewTokens.set(token, { reviewRequestId: "", enrollmentId: enr.id, orgId: store.org.id });

    // make a fresh due message for the review step
    store.scheduled.push({
      id: "sm-review",
      enrollmentId: enr.id,
      protocolStepId: reviewStep.id,
      sendAt: new Date(Date.now() - 60_000).toISOString(),
      status: "PENDING",
      attempts: 0,
    });

    const before = store.reviewRequests.length;
    await processDueMessages();
    expect(store.reviewRequests.length).toBeGreaterThan(before);
    const rr = store.reviewRequests[store.reviewRequests.length - 1];
    expect(rr.platform).toBe("google");
    // the token should now point to the created review request
    expect(reviewTokens.get(token)?.reviewRequestId).toBe(rr.id);
  });
});
