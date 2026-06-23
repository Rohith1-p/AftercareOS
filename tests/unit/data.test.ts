import { describe, it, expect } from "vitest";
import {
  getHomeSnapshot,
  getProtocols,
  getProtocol,
  dayBucketLabel,
  getMockStore,
} from "@/lib/data";

describe("mock store", () => {
  it("has 5 seeded aesthetics protocols", () => {
    const store = getMockStore();
    expect(store.protocols).toHaveLength(5);
    expect(store.protocols.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "Botox / Wrinkle Relaxer",
        "Dermal Filler (Lips / Face)",
        "Laser Hair Removal / Resurfacing",
        "Chemical Peel",
        "Microneedling",
      ]),
    );
  });

  it("protocols are scoped to the demo org and active", () => {
    const store = getMockStore();
    for (const p of store.protocols) {
      expect(p.orgId).toBe("org_demo_aesthetics");
      expect(p.status).toBe("ACTIVE");
      expect(p.steps.length).toBeGreaterThan(0);
    }
  });

  it("has demo patients and enrollments", () => {
    const store = getMockStore();
    expect(store.patients.length).toBeGreaterThan(0);
    expect(store.enrollments.length).toBeGreaterThan(0);
    expect(store.alerts.some((a) => a.status === "OPEN")).toBe(true);
  });
});

describe("getProtocols / getProtocol (async facade)", () => {
  it("returns all protocols and finds a protocol by id", async () => {
    const protocols = await getProtocols();
    expect(protocols.length).toBe(5);

    const botox = await getProtocol("proto_botox");
    expect(botox?.name).toContain("Botox");
    expect(botox?.steps.some((s) => s.includeEscalation)).toBe(true);
    expect(botox?.steps.some((s) => s.includeReviewAsk)).toBe(true);

    expect(await getProtocol("does-not-exist")).toBeUndefined();
  });
});

describe("dayBucketLabel", () => {
  it("labels Day 0 and Day N", () => {
    expect(dayBucketLabel(0)).toBe("Day 0");
    expect(dayBucketLabel(60)).toBe("Day 0");
    expect(dayBucketLabel(1440)).toBe("Day 1");
    expect(dayBucketLabel(4320)).toBe("Day 3");
  });
});

describe("getHomeSnapshot", () => {
  it("aggregates active journeys and alerts", async () => {
    const snap = await getHomeSnapshot();
    expect(snap.activeJourneys).toBeGreaterThan(0);
    expect(snap.openAlerts).toBeGreaterThanOrEqual(0);
    expect(snap.byDay.length).toBeGreaterThan(0);
    expect(snap.messagesSent7d).toBeGreaterThan(0);
  });
});
