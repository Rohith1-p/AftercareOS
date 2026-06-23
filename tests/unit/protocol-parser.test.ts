import { describe, it, expect } from "vitest";
import {
  parseHeuristic,
  detectOffset,
  inferCategory,
  shouldEscalate,
  chunkByTime,
} from "@/lib/ai/protocol-parser";

describe("detectOffset", () => {
  it("detects immediate / checkout", () => {
    expect(detectOffset("Apply immediately after treatment")).toBe(5);
    expect(detectOffset("At checkout do this")).toBe(5);
    expect(detectOffset("Day 0 care")).toBe(5);
  });
  it("detects hours", () => {
    expect(detectOffset("First 4 hours keep upright")).toBe(240);
    expect(detectOffset("within 6 hours")).toBe(360);
  });
  it("detects days", () => {
    expect(detectOffset("Day 1 wash gently")).toBe(1440);
    expect(detectOffset("On day 7 you'll see results")).toBe(10080);
  });
  it("detects weeks and months", () => {
    expect(detectOffset("2 weeks later")).toBe(20160);
    expect(detectOffset("3 months rebook")).toBe(129600);
  });
  it("returns null when no time anchor", () => {
    expect(detectOffset("avoid the sun")).toBeNull();
  });
});

describe("inferCategory", () => {
  it("maps keywords to categories", () => {
    expect(inferCategory("Botox aftercare instructions").category).toBe("Injectables");
    expect(inferCategory("Lip filler care").category).toBe("Injectables");
    expect(inferCategory("Laser hair removal").category).toBe("Skin");
    expect(inferCategory("Chemical peel").category).toBe("Skin");
    expect(inferCategory("Microneedling").category).toBe("Skin");
    expect(inferCategory("Tattoo healing").category).toBe("Body");
    expect(inferCategory("random other text").category).toBe("Other");
  });
});

describe("shouldEscalate", () => {
  it("flags symptom language", () => {
    expect(shouldEscalate("severe pain and swelling")).toBe(true);
    expect(shouldEscalate("if you notice asymmetry")).toBe(true);
    expect(shouldEscalate("infection or fever")).toBe(true);
  });
  it("does not flag benign instructions", () => {
    expect(shouldEscalate("apply moisturizer twice daily")).toBe(false);
    expect(shouldEscalate("avoid the sun")).toBe(false);
  });
});

describe("chunkByTime", () => {
  it("groups lines under time anchors", () => {
    const chunks = chunkByTime("Intro line\nDay 1\nwash gently\nDay 3\ncheck for bruising");
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some((c) => c.offset === 1440)).toBe(true);
    expect(chunks.some((c) => c.offset === 4320)).toBe(true);
  });
});

describe("parseHeuristic", () => {
  const sample = `Botox Aftercare
Stay upright for 4 hours after treatment.
Day 1: wash gently, no exercise.
Day 3: mild swelling is normal.
Day 7: results start appearing.
Day 14: full results. If asymmetry, contact us.`;

  it("infers name + category", () => {
    const p = parseHeuristic(sample);
    expect(p.category).toBe("Injectables");
    expect(p.name.toLowerCase()).toContain("botox");
  });

  it("produces sorted, time-anchored steps", () => {
    const p = parseHeuristic(sample);
    expect(p.steps.length).toBeGreaterThanOrEqual(3);
    const offsets = p.steps.map((s) => s.offsetMinutes);
    const sorted = [...offsets].sort((a, b) => a - b);
    expect(offsets).toEqual(sorted);
  });

  it("flags escalation where symptoms are mentioned", () => {
    const p = parseHeuristic(sample);
    expect(p.steps.some((s) => s.includeEscalation)).toBe(true);
  });

  it("source is heuristic", () => {
    expect(parseHeuristic(sample).source).toBe("heuristic");
  });
});
