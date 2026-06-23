import { z } from "zod";

export interface ParsedStep {
  offsetMinutes: number;
  label: string;
  body: string;
  includeEscalation: boolean;
}

export interface ParsedProtocol {
  name: string;
  category: "Injectables" | "Skin" | "Body" | "Other";
  tone: string;
  steps: ParsedStep[];
  source: "ai" | "heuristic";
}

const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;

// Personalization tokens supported in message bodies.
export const TOKENS = [
  "{{first_name}}",
  "{{clinic_name}}",
  "{{provider_name}}",
  "{{procedure}}",
  "{{book_link}}",
  "{{review_link}}",
  "{{reply_to}}",
];

// ── Offset detection from natural-language time phrases ──
export function detectOffset(text: string): number | null {
  const t = text.toLowerCase();
  if (/(immediately|right after|at checkout|as soon as|day 0)/.test(t)) return 5 * MIN;
  let m = t.match(/(\d+)\s*[-–]?\s*(\d+)?\s*hours?/);
  if (m) {
    const n = Number(m[2] ?? m[1]);
    return Math.min(n, 8) * HOUR;
  }
  m = t.match(/day\s*(\d+)/);
  if (m) return Number(m[1]) * DAY;
  m = t.match(/(\d+)\s*weeks?/);
  if (m) return Number(m[1]) * 7 * DAY;
  m = t.match(/(\d+)\s*months?|month\s*(\d+)/);
  if (m) return Number(m[1] ?? m[2]) * 30 * DAY;
  if (/first\s+\d+\s*days|first day/.test(t)) return 1 * DAY;
  return null;
}

// ── Procedure / category inference ──
const CATEGORY_RULES: { category: ParsedProtocol["category"]; keywords: RegExp; name: string }[] = [
  { category: "Injectables", keywords: /botox|wrinkle|dysport|filler|lip|inject|jeuveau/, name: "Botox / Filler Aftercare" },
  { category: "Skin", keywords: /laser|resurfac|hair removal/, name: "Laser Aftercare" },
  { category: "Skin", keywords: /peel|chemical/, name: "Chemical Peel Aftercare" },
  { category: "Skin", keywords: /microneedl|dermapen|collagen/, name: "Microneedling Aftercare" },
  { category: "Skin", keywords: /microblad|pmu|permanent makeup|brow/, name: "Microblading / PMU Aftercare" },
  { category: "Body", keywords: /tattoo|pierc|body art/, name: "Tattoo / Body Art Aftercare" },
];

export function inferCategory(text: string): { category: ParsedProtocol["category"]; name: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.test(text.toLowerCase())) return { category: rule.category, name: rule.name };
  }
  return { category: "Other", name: "Aftercare Protocol" };
}

const ESCALATION_KEYWORDS =
  /\b(pain|hurt|sore|swell|swelling|bruise|bruising|redness|red|infect|infection|bleed|bleeding|fever|warm|hot|firm|lump|bump|asymmetr[a-z]*|numb[a-z]*|tingl[a-z]*|abnormal|concern|worried|wrong|vision|discolor[a-z]*)\b/i;

export function shouldEscalate(text: string): boolean {
  return ESCALATION_KEYWORDS.test(text);
}

function toSmsBody(chunk: string, tone: string): string {
  let b = chunk.trim().replace(/\s+/g, " ");
  // Light tone shaping
  if (tone === "friendly-medspa") {
    if (!/[.!?]$/.test(b)) b += ".";
  }
  return b;
}

// Split raw text into time-anchored chunks.
export function chunkByTime(text: string): { offset: number | null; text: string }[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const chunks: { offset: number | null; text: string }[] = [];
  let current: { offset: number | null; text: string } | null = null;

  const flush = () => {
    if (current && current.text) chunks.push(current);
    current = null;
  };

  for (const line of lines) {
    const off = detectOffset(line);
    if (off !== null) {
      flush();
      current = { offset: off, text: line };
    } else if (current) {
      current.text += " " + line;
    } else {
      // intro line with no time anchor — attach to immediate
      current = { offset: 5 * MIN, text: line };
    }
  }
  flush();
  return chunks;
}

function offsetToLabel(offset: number): string {
  if (offset <= 5 * MIN) return "Day 0 · Checkout";
  const hours = Math.floor(offset / HOUR) % 24;
  const days = Math.floor(offset / DAY);
  if (days === 0) return `Day 0 · ${hours}h`;
  return `Day ${days} · ${["Morning", "Check-in", "Progress"][Math.min(days, 2) % 3]}`;
}

function sortOffsets(a: number, b: number): number {
  return a - b;
}

// ── Heuristic parser (no API key needed) ──
export function parseHeuristic(text: string, tone = "friendly-medspa"): ParsedProtocol {
  const { category, name } = inferCategory(text);
  const chunks = chunkByTime(text);
  const seen = new Set<number>();
  const steps: ParsedStep[] = [];

  for (const c of chunks) {
    const offset = c.offset ?? 5 * MIN;
    // merge into existing offset bucket if duplicate
    const existing = steps.find((s) => Math.abs(s.offsetMinutes - offset) < 30);
    const body = toSmsBody(c.text, tone);
    if (existing) {
      existing.body += " " + body;
      if (shouldEscalate(body)) existing.includeEscalation = true;
    } else if (!seen.has(offset)) {
      seen.add(offset);
      steps.push({
        offsetMinutes: offset,
        label: offsetToLabel(offset),
        body,
        includeEscalation: shouldEscalate(body),
      });
    }
  }

  steps.sort((a, b) => sortOffsets(a.offsetMinutes, b.offsetMinutes));

  // Ensure an escalation check-in exists mid-journey if none flagged
  if (!steps.some((s) => s.includeEscalation) && steps.length > 2) {
    const mid = steps[Math.min(2, steps.length - 1)];
    mid.includeEscalation = true;
  }

  return {
    name,
    category,
    tone,
    steps: steps.length ? steps : [
      { offsetMinutes: 5, label: "Day 0 · Checkout", body: text.slice(0, 160), includeEscalation: false },
    ],
    source: "heuristic",
  };
}

// ── AI parser (OpenAI via Vercel AI SDK) ──
const StepSchema = z.object({
  offsetMinutes: z.number().describe("minutes after appointment; <=0 for immediate"),
  label: z.string().describe('e.g. "Day 1 · Morning"'),
  body: z.string().describe("the SMS message text, friendly, under 320 chars"),
  includeEscalation: z.boolean().describe("true if the step mentions symptoms/warnings worth a triage button"),
});

const ProtocolSchema = z.object({
  name: z.string(),
  category: z.enum(["Injectables", "Skin", "Body", "Other"]),
  tone: z.string(),
  steps: z.array(StepSchema).min(2),
});

function hasAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GLM_API_KEY);
}

export async function parseProtocolFromText(
  text: string,
  opts: { tone?: string; useAi?: boolean } = {},
): Promise<ParsedProtocol> {
  const tone = opts.tone ?? "friendly-medspa";
  const wantAi = opts.useAi ?? true;

  if (wantAi && hasAiKey()) {
    try {
      const { generateObject } = await import("ai");
      const provider = process.env.AI_DEFAULT_PROVIDER === "glm" ? null : await import("@ai-sdk/openai");
      const model = provider
        ? provider.openai(process.env.OPENAI_MODEL || "gpt-4o")
        : // GLM via OpenAI-compatible endpoint
          (await import("@ai-sdk/openai")).createOpenAI({
            baseURL: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
            apiKey: process.env.GLM_API_KEY!,
            name: "glm",
          })(process.env.GLM_MODEL || "glm-4-plus");

      const result = await generateObject({
        model,
        schema: ProtocolSchema,
        schemaName: "AftercareProtocol",
        system:
          "You convert raw aftercare instructions into a timed SMS sequence (Day 0 → Day 90) for a med-spa/aesthetics clinic. Be warm, concise, and reassuring. Use tokens like {{first_name}}, {{clinic_name}}, {{review_link}}, {{book_link}} where natural. Flag any step that mentions symptoms/complications with includeEscalation=true.",
        prompt: `Tone: ${tone}\n\nRaw aftercare instructions:\n"""\n${text}\n"""`,
      });
      return { ...result.object, source: "ai" };
    } catch (err) {
      console.error("[ai] parse failed, falling back to heuristic:", err);
    }
  }
  return parseHeuristic(text, tone);
}

export function isAiAvailable(): boolean {
  return hasAiKey();
}
