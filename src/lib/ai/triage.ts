// Triage: classify an inbound patient message for urgency.
// Uses an LLM when an AI key is configured; otherwise a deterministic keyword
// scorer. Returns a severity + whether to auto-create an alert.

import type { Severity } from "@/lib/data/types";

export interface TriageResult {
  severity: Severity;
  flag: boolean; // create/raise an alert?
  category: string;
  reason: string;
}

// Ordered keyword groups — first match wins for category, but severity is the max across all.
const RULES: { severity: Severity; category: string; keywords: RegExp }[] = [
  { severity: "URGENT", category: "Possible emergency", keywords: /\b(911|emergency|can'?t breathe|chest pain|vision loss|blind|severe bleed|anaphyl|faint|unconscious|stroke|seizure)\b/i },
  { severity: "HIGH", category: "Possible complication", keywords: /\b(infection|infected|pus|ooze|fever|hot to touch|spreading redness|severe pain|severe swell|asymmetr|discolor|blister|open wound|necros|lump|hard lump|warm and red|vision change|blur)\b/i },
  { severity: "MEDIUM", category: "Needs reassurance", keywords: /\b(is this normal|worried|concern|not sure|swelling|bruise|bruising|red|sore|tend|ache|itch|dry|flak|peel|scab|numb|tingl|firm|bump)\b/i },
  { severity: "LOW", category: "General question", keywords: /\b(when can|how long|how often|can i|should i|question|thank|ok|okay|fine|good|great|love)\b/i },
];

export function triageKeyword(message: string): TriageResult {
  let max: Severity = "LOW";
  let category = "General question";
  let reason = "No risk keywords detected.";

  for (const rule of RULES) {
    const m = message.match(rule.keywords);
    if (m) {
      if (severityRank(rule.severity) > severityRank(max)) {
        max = rule.severity;
        category = rule.category;
        reason = `Matched "${m[0]}".`;
      }
    }
  }
  // Anything HIGH/URGENT auto-flags; MEDIUM flags only if it reads like a concern.
  const flag = max === "URGENT" || max === "HIGH" || (max === "MEDIUM" && /\b(is this normal|worried|concern|not normal|wrong)\b/i.test(message));
  return { severity: max, category, flag, reason };
}

function severityRank(s: Severity): number {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 }[s];
}

function hasAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GLM_API_KEY);
}

export async function triageMessage(message: string): Promise<TriageResult> {
  if (hasAiKey()) {
    try {
      const { generateObject } = await import("ai");
      const { z } = await import("zod");
      const provider = await import("@ai-sdk/openai");
      const model =
        process.env.AI_DEFAULT_PROVIDER === "glm"
          ? provider.createOpenAI({
              baseURL: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
              apiKey: process.env.GLM_API_KEY!,
              name: "glm",
            })(process.env.GLM_MODEL || "glm-4-plus")
          : provider.openai(process.env.OPENAI_MODEL || "gpt-4o");

      const result = await generateObject({
        model,
        schema: z.object({
          severity: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
          flag: z.boolean(),
          category: z.string(),
          reason: z.string(),
        }),
        system:
          "You triage aftercare messages from aesthetics patients. Flag HIGH/URGENT complications (infection, severe swelling, vision changes, asymmetry) for clinician review. Reassuring or routine questions are LOW.",
        prompt: `Patient message: """${message}"""`,
      });
      return result.object;
    } catch (err) {
      console.error("[ai] triage failed, using keyword fallback:", err);
    }
  }
  return triageKeyword(message);
}
