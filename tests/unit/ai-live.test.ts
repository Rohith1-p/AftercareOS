import { describe, it, expect } from "vitest";
import { parseProtocolFromText } from "@/lib/ai/protocol-parser";
import { triageKeyword } from "@/lib/ai/triage";

const hasKey = Boolean(process.env.GLM_API_KEY || process.env.OPENAI_API_KEY);

const BOTOX = `Botox Aftercare
Stay upright for 4 hours after treatment — no lying down.
First 24 hours: don't touch or rub the face, no exercise, no makeup, avoid alcohol.
Day 3: mild bruising or headache is normal and temporary.
Day 7: results start to appear gradually.
Day 14: full results visible. If you notice asymmetry, severe pain, or vision changes, contact us immediately.`;

// Skips automatically when no AI key is in the environment.
describe.skipIf(!hasKey)("AI parser — live LLM", () => {
  it(
    "parses raw aftercare text into a timed sequence via GLM",
    async () => {
      const result = await parseProtocolFromText(BOTOX, { tone: "friendly-medspa" });
      // eslint-disable-next-line no-console
      console.log("[ai-live] source:", result.source, "| steps:", result.steps.length);
      expect(result.source).toBe("ai");
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
      expect(result.name.toLowerCase()).toContain("botox");
      // at least one step should be flagged for escalation (asymmetry/pain/vision)
      expect(result.steps.some((s) => s.includeEscalation)).toBe(true);
      // every step should have a non-empty body and a sensible offset
      expect(result.steps.every((s) => s.body.length > 0)).toBe(true);
      expect(result.steps.every((s) => s.offsetMinutes >= 0)).toBe(true);
    },
    90000,
  );

  it("heuristic fallback still works for reference", () => {
    expect(triageKeyword("severe pain and asymmetry").flag).toBe(true);
  });
});
