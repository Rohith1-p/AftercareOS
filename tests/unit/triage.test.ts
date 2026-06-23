import { describe, it, expect } from "vitest";
import { triageKeyword } from "@/lib/ai/triage";

describe("triageKeyword", () => {
  it("flags URGENT emergencies", () => {
    const r = triageKeyword("I think this is an emergency, can't breathe");
    expect(r.severity).toBe("URGENT");
    expect(r.flag).toBe(true);
  });

  it("flags HIGH complications (infection, severe swelling, asymmetry)", () => {
    expect(triageKeyword("my lip looks asymmetric and there's spreading redness").severity).toBe("HIGH");
    expect(triageKeyword("I think it's infected, pus and fever").severity).toBe("HIGH");
    expect(triageKeyword("severe pain and it's hot to touch").severity).toBe("HIGH");
  });

  it("flags MEDIUM concerns that read like worry", () => {
    const r = triageKeyword("is this swelling normal? I'm worried");
    expect(r.severity).toBe("MEDIUM");
    expect(r.flag).toBe(true);
  });

  it("does NOT flag LOW reassurance / routine questions", () => {
    const r = triageKeyword("thank you so much, love the results!");
    expect(r.severity).toBe("LOW");
    expect(r.flag).toBe(false);
  });

  it("does not flag a MEDIUM keyword alone unless it reads like concern", () => {
    // "swelling" alone is medium but not phrased as concern
    const r = triageKeyword("some swelling today");
    expect(r.severity).toBe("MEDIUM");
    expect(r.flag).toBe(false);
  });

  it("picks the highest severity when multiple match", () => {
    const r = triageKeyword("thank you but I have severe pain and fever");
    expect(["HIGH", "URGENT"]).toContain(r.severity);
    expect(r.flag).toBe(true);
  });
});
