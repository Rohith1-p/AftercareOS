import { describe, it, expect, beforeEach } from "vitest";
import { getEngagementMetrics } from "@/lib/analytics";
import { getLiveStore, resetLiveStore } from "@/lib/data/store";

describe("analytics", () => {
  beforeEach(() => resetLiveStore());

  it("returns a 7-day series of 7 points", () => {
    const m = getEngagementMetrics();
    expect(m.series7d).toHaveLength(7);
    expect(m.series7d.every((d) => d.sent > 0)).toBe(true);
  });

  it("computes response + completion rates from the store", () => {
    const store = getLiveStore();
    const m = getEngagementMetrics();
    const completed = store.enrollments.filter((e) => e.status === "COMPLETED").length;
    expect(m.journeyCompletionRate).toBe(Math.round((completed / store.enrollments.length) * 100));
  });

  it("escalations per 100 is non-negative", () => {
    const m = getEngagementMetrics();
    expect(m.escalationsPer100).toBeGreaterThanOrEqual(0);
  });
});
