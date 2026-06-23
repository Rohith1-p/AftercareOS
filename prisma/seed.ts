import { PrismaClient, Plan, Role, ProtocolStatus, ProtocolSource } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ORG_ID = "org_demo_aesthetics";

// offset helpers
const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;

interface SeedStep {
  order: number;
  offsetMinutes: number;
  label: string;
  body: string;
  includeEscalation?: boolean;
  includeReviewAsk?: boolean;
  includeRebook?: boolean;
}
interface SeedProtocol {
  id: string;
  name: string;
  category: string;
  segment: string;
  steps: SeedStep[];
}

const PROTOCOLS: SeedProtocol[] = [
  {
    id: "proto_botox",
    name: "Botox / Wrinkle Relaxer",
    category: "Injectables",
    segment: "Aesthetics",
    steps: [
      { order: 1, offsetMinutes: 5 * MIN, label: "Day 0 · Checkout", body: "Hi {{first_name}}! Congrats on your treatment today 🎉 Stay upright (no lying down) for the next 4 hours. — {{clinic_name}}", includeEscalation: false },
      { order: 2, offsetMinutes: 4 * HOUR, label: "Day 0 · 4 hours", body: "You made it past 4 hours 🙌 Tonight: avoid touching the area, no exercise, no makeup, skip alcohol.", includeEscalation: false },
      { order: 3, offsetMinutes: 1 * DAY, label: "Day 1 · Morning", body: "Day 1 check-in: avoid strenuous exercise for 24h. Questions? Reply here.", includeEscalation: true },
      { order: 4, offsetMinutes: 3 * DAY, label: "Day 3 · Check-in", body: "Mild bruising or headache is normal and temporary. If anything feels off, tap below.", includeEscalation: true },
      { order: 5, offsetMinutes: 7 * DAY, label: "Day 7 · Progress", body: "You should start seeing results now. Full effect around Day 10–14!", includeEscalation: false },
      { order: 6, offsetMinutes: 14 * DAY, label: "Day 14 · Results", body: "Results fully visible! We'd love a quick review: {{review_link}}", includeReviewAsk: true },
      { order: 7, offsetMinutes: 90 * DAY, label: "Month 3 · Rebook", body: "Botox lasts 3–4 months — rebook to keep results: {{book_link}}", includeRebook: true },
    ],
  },
  {
    id: "proto_filler",
    name: "Dermal Filler (Lips / Face)",
    category: "Injectables",
    segment: "Aesthetics",
    steps: [
      { order: 1, offsetMinutes: 5 * MIN, label: "Day 0 · Checkout", body: "Hi {{first_name}}! First 6 hours: don't touch or massage the area — filler needs to settle.", includeEscalation: false },
      { order: 2, offsetMinutes: 6 * HOUR, label: "Day 0 · 6 hours", body: "No makeup, no exercise, sleep elevated. Swelling is normal!", includeEscalation: false },
      { order: 3, offsetMinutes: 1 * DAY, label: "Day 1 · Morning", body: "Swelling peaks today/tomorrow — normal. Keep icing, avoid heat.", includeEscalation: true },
      { order: 4, offsetMinutes: 3 * DAY, label: "Day 3 · Check-in", body: "If you notice asymmetry, severe pain, or discoloration, tap below.", includeEscalation: true },
      { order: 5, offsetMinutes: 7 * DAY, label: "Day 7 · Progress", body: "Most swelling is gone. Final results around 2 weeks.", includeEscalation: false },
      { order: 6, offsetMinutes: 14 * DAY, label: "Day 14 · Results", body: "Final results visible! A review helps us tons: {{review_link}}", includeReviewAsk: true },
    ],
  },
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: SEED_ORG_ID },
    update: {},
    create: {
      id: SEED_ORG_ID,
      name: "Glow Aesthetics Studio",
      plan: Plan.PROFESSIONAL,
      status: "TRIAL",
      clinicProfile: {
        create: {
          brandColor: "#e85d2c",
          senderName: "Glow Aesthetics",
          twilioNumber: "+15551234567",
          quietHoursStart: "21:00",
          quietHoursEnd: "07:00",
        },
      },
      users: {
        create: {
          id: "user_owner",
          email: "owner@glow.example",
          name: "Dr. Alex Rivera",
          role: Role.OWNER,
        },
      },
    },
  });

  for (const p of PROTOCOLS) {
    await prisma.protocol.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        orgId: org.id,
        name: p.name,
        category: p.category,
        segment: p.segment,
        status: ProtocolStatus.ACTIVE,
        source: ProtocolSource.TEMPLATE,
        tone: "friendly-medspa",
        steps: {
          create: p.steps.map((s) => ({
            order: s.order,
            offsetMinutes: s.offsetMinutes,
            label: s.label,
            body: s.body,
            includeEscalation: Boolean(s.includeEscalation),
            includeReviewAsk: Boolean(s.includeReviewAsk),
            includeRebook: Boolean(s.includeRebook),
          })),
        },
      },
    });
  }

  console.log("Seed complete for org", org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
