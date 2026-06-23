import type { Protocol, ProtocolStep } from "./types";

// Helpers to build steps with realistic timing.
// offsetMinutes is relative to the appointment time.
const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;

function step(
  protocolId: string,
  order: number,
  offsetMinutes: number,
  label: string,
  body: string,
  opts: Partial<Pick<ProtocolStep, "includeEscalation" | "includeReviewAsk" | "includeRebook" | "mediaUrl">> = {},
): ProtocolStep {
  return {
    id: `${protocolId}-s${order}`,
    protocolId,
    order,
    offsetMinutes,
    label,
    body,
    includeEscalation: opts.includeEscalation ?? false,
    includeReviewAsk: opts.includeReviewAsk ?? false,
    includeRebook: opts.includeRebook ?? false,
    mediaUrl: opts.mediaUrl,
  };
}

// Default org used by the seed + mock store.
export const SEED_ORG_ID = "org_demo_aesthetics";

export const SEED_PROTOCOLS: Protocol[] = [
  {
    id: "proto_botox",
    orgId: SEED_ORG_ID,
    name: "Botox / Wrinkle Relaxer",
    category: "Injectables",
    segment: "Aesthetics",
    source: "TEMPLATE",
    status: "ACTIVE",
    tone: "friendly-medspa",
    version: 1,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
    steps: [
      step("proto_botox", 1, 5 * MIN, "Day 0 · Checkout", "Hi {{first_name}}! Congrats on your treatment today 🎉 Key reminder: stay upright (no lying down) for the next 4 hours. Set an alarm so you don't forget. You're in great hands! — {{clinic_name}}"),
      step("proto_botox", 2, 4 * HOUR, "Day 0 · 4 hours", "You made it past the 4-hour mark 🙌 You can lie down now. Tonight: avoid touching or rubbing the treated area, no exercise, no makeup, and skip alcohol. Sleep with your head slightly elevated if you can."),
      step("proto_botox", 3, 1 * DAY, "Day 1 · Morning", "Good morning {{first_name}}! Day 1 check-in: avoid strenuous exercise for 24 hours. You can wash your face gently — just don't rub the treated spots. Questions? Reply here or call {{reply_to}}.", { includeEscalation: true }),
      step("proto_botox", 4, 3 * DAY, "Day 3 · Check-in", "Update: you may notice slight bruising or a mild headache — both totally normal and temporary. Results appear gradually over the next week. If anything feels off, tap the button below.", { includeEscalation: true }),
      step("proto_botox", 5, 7 * DAY, "Day 7 · Progress", "You're one week in! You should start seeing your results come through now. Full effect usually shows around Day 10–14. Excited for your final look!"),
      step("proto_botox", 6, 14 * DAY, "Day 14 · Results", "How are you feeling, {{first_name}}? Your results should be fully visible now. We'd love your feedback — and if all's well, a quick review means the world to us: {{review_link}}", { includeReviewAsk: true }),
      step("proto_botox", 7, 90 * DAY, "Month 3 · Rebook", "Hi {{first_name}}! Botox typically lasts 3–4 months — you're due for a refresh soon to keep your results smooth. Book your next visit here: {{book_link}}", { includeRebook: true }),
    ],
  },
  {
    id: "proto_filler",
    orgId: SEED_ORG_ID,
    name: "Dermal Filler (Lips / Face)",
    category: "Injectables",
    segment: "Aesthetics",
    source: "TEMPLATE",
    status: "ACTIVE",
    tone: "friendly-medspa",
    version: 1,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
    steps: [
      step("proto_filler", 1, 5 * MIN, "Day 0 · Checkout", "Hi {{first_name}}! Great job today 💉 First 6 hours: don't touch, press, or massage the treated area — the filler needs to settle. Ice gently (through a cloth) if you'd like."),
      step("proto_filler", 2, 6 * HOUR, "Day 0 · 6 hours", "Reminder: no makeup, no exercise, and no kissing (for lip filler) tonight. Sleep with your head elevated to keep swelling down. Swelling is normal and expected!"),
      step("proto_filler", 3, 1 * DAY, "Day 1 · Morning", "Day 1 check-in: swelling usually peaks today or tomorrow — that's completely normal. Keep icing, avoid heat (sauna, hot showers), and skip alcohol. Questions? Reply here.", { includeEscalation: true }),
      step("proto_filler", 4, 3 * DAY, "Day 3 · Check-in", "Swelling should be easing now. You might still see mild bruising — it fades over the next few days. If you notice asymmetry, severe pain, or skin discoloration, tap below right away.", { includeEscalation: true }),
      step("proto_filler", 5, 7 * DAY, "Day 7 · Progress", "One week in! Most swelling is gone and your results are taking shape. Final results appear around the 2-week mark once everything fully settles."),
      step("proto_filler", 6, 14 * DAY, "Day 14 · Results", "Your final results should be visible now, {{first_name}}! Love them? A quick review helps us so much: {{review_link}} Need a touch-up? Just reply.", { includeReviewAsk: true }),
      step("proto_filler", 7, 100 * DAY, "Month 3+ · Rebook", "Hi {{first_name}}! Filler typically lasts 6–18 months depending on the area. Book a consult to refresh and keep your look: {{book_link}}", { includeRebook: true }),
    ],
  },
  {
    id: "proto_laser",
    orgId: SEED_ORG_ID,
    name: "Laser Hair Removal / Resurfacing",
    category: "Skin",
    segment: "Aesthetics",
    source: "TEMPLATE",
    status: "ACTIVE",
    tone: "friendly-medspa",
    version: 1,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
    steps: [
      step("proto_laser", 1, 5 * MIN, "Day 0 · Checkout", "Hi {{first_name}}! Treatment done ✨ Redness and mild swelling are normal for a few hours. Apply aloe vera to soothe and avoid heat today."),
      step("proto_laser", 2, 1 * DAY, "Day 1 · Morning", "Day 1: keep the area clean and moisturized. No hot showers, saunas, or workouts today. Avoid sun exposure and wear SPF 30+ if you go out.", { includeEscalation: true }),
      step("proto_laser", 3, 3 * DAY, "Day 3 · Check-in", "You may notice hair 'growing' — that's shedding, not growth! Don't pluck or wax; gentle exfoliation helps. Let us know if anything looks unusual.", { includeEscalation: true }),
      step("proto_laser", 4, 7 * DAY, "Day 7 · Progress", "One week in! Shedding should be mostly done. Keep moisturizing and avoiding direct sun. Your next session is usually 4–8 weeks out."),
      step("proto_laser", 5, 14 * DAY, "Day 14 · Results", "Two weeks in — you're seeing smoother results now. Happy so far? A quick review means a lot: {{review_link}}", { includeReviewAsk: true }),
    ],
  },
  {
    id: "proto_peel",
    orgId: SEED_ORG_ID,
    name: "Chemical Peel",
    category: "Skin",
    segment: "Aesthetics",
    source: "TEMPLATE",
    status: "ACTIVE",
    tone: "friendly-medspa",
    version: 1,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
    steps: [
      step("proto_peel", 1, 5 * MIN, "Day 0 · Checkout", "Hi {{first_name}}! Your peel is done 🌿 Your skin will feel tight and look pink today — that's expected. Use only the gentle cleanser and moisturizer we recommended."),
      step("proto_peel", 2, 1 * DAY, "Day 1 · Morning", "Day 1: don't pick or peel any flaking skin — let it come off naturally. No exfoliants, retinol, or active ingredients for a week. Sunscreen is non-negotiable!", { includeEscalation: true }),
      step("proto_peel", 3, 3 * DAY, "Day 3 · Peeling", "Peeling usually starts around now and lasts 2–4 days. Totally normal! Keep moisturizing and don't pick. Concerned? Tap below.", { includeEscalation: true }),
      step("proto_peel", 4, 7 * DAY, "Day 7 · Progress", "One week in — peeling should be done and your fresh skin is showing. Keep up the sunscreen and gentle routine. Looking radiant! ✨"),
      step("proto_peel", 5, 14 * DAY, "Day 14 · Results", "Two weeks in, your glow is here {{first_name}}! Loved the result? A review helps us tons: {{review_link}}", { includeReviewAsk: true }),
    ],
  },
  {
    id: "proto_microneedling",
    orgId: SEED_ORG_ID,
    name: "Microneedling",
    category: "Skin",
    segment: "Aesthetics",
    source: "TEMPLATE",
    status: "ACTIVE",
    tone: "friendly-medspa",
    version: 1,
    createdAt: new Date("2026-01-15").toISOString(),
    updatedAt: new Date("2026-01-15").toISOString(),
    steps: [
      step("proto_microneedling", 1, 5 * MIN, "Day 0 · Checkout", "Hi {{first_name}}! Microneedling done 🔬 Redness (like a mild sunburn) is normal for 1–3 days. Apply the soothing serum we gave you and skip makeup tonight."),
      step("proto_microneedling", 2, 1 * DAY, "Day 1 · Morning", "Day 1: keep it simple — gentle cleanser, hyaluronic serum, moisturizer, SPF. No actives, no exfoliation, no sweating today.", { includeEscalation: true }),
      step("proto_microneedling", 3, 3 * DAY, "Day 3 · Check-in", "Redness should be fading now and you may feel a little dry/flaky. Keep hydrating! Let us know if you see prolonged redness or irritation.", { includeEscalation: true }),
      step("proto_microneedling", 4, 7 * DAY, "Day 7 · Progress", "One week in — collagen is already going to work. Your skin should look calmer and smoother. Best results build over a few sessions."),
      step("proto_microneedling", 5, 14 * DAY, "Day 14 · Results", "Two weeks in and that glow is real {{first_name}}! Enjoying it? A quick review helps us so much: {{review_link}}", { includeReviewAsk: true }),
    ],
  },
];
