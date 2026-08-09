# AftercareOS — Project Constitution

**Created:** May 24, 2026
**Status:** Active

---

## Article I: Product Focus

AftercareOS does ONE thing: deliver the right aftercare message at the right time. We are NOT an EMR, booking system, payment processor, or inventory manager. Every feature must directly serve the aftercare messaging workflow. If a feature doesn't help a practitioner send better aftercare or a client receive better aftercare, it doesn't belong.

## Article II: User-First Design

The primary user is a solo injector or small med spa owner with NO technical background. Every screen must be understandable in under 10 seconds. If it needs a tutorial, it's too complex. The dashboard is glanceable. Actions are obvious. The orange CTA is always visible.

## Article III: Mobile-Native for Clients, Desktop-First for Practitioners

Clients receive SMS. Period. No app downloads, no logins, no portals. Practitioners manage everything from a desktop dashboard. The "Something's Wrong" button is the only client interaction — it's a link in the SMS that opens a simple reply screen.

## Article IV: SMS-First, Not WhatsApp

We use SMS (via Twilio) as our primary channel. This is a deliberate choice for the US market where SMS has universal adoption and WhatsApp does not. WhatsApp can be added later as a secondary channel, but SMS is the default.

## Article V: HIPAA Compliance from Day 1

All data handling, storage, and transmission must be HIPAA-compliant. We use Twilio's HIPAA-eligible tier with BAA. No PHI is stored in message content. All data is encrypted at rest and in transit. This is non-negotiable for the med spa segment.

## Article VI: Simplicity Over Features

- Maximum 7 screens in the dashboard
- No feature should require more than 3 clicks to access
- Default settings should work for 90% of users without configuration
- Built-in protocol templates should be usable immediately after signup
- No settings page should have more than 4 sections

## Article VII: Brand Consistency

All UI follows the AftercareOS design system:
- Primary color: Vibrant Orange (#FF6B35)
- Warm gradient backgrounds (peach → pink)
- White cards with soft shadows
- Geometric sans-serif typography (Inter/Poppins)
- Green for success states, Red for alerts/concerns
- Orange for all primary actions and CTAs

## Article VIII: Integration, Not Replacement

AftercareOS integrates with existing booking systems (Square, Fresha, via Zapier) rather than replacing them. We are a specialized tool that fits INTO a practitioner's existing workflow, not a platform that tries to be everything.

## Article IX: Security & Privacy

- All API endpoints require authentication
- Rate limiting on all endpoints
- No client data shared with third parties
- Practitioner's personal phone number stays private (messages sent from dedicated Twilio number)
- Client phone numbers are never exposed in the dashboard

## Article X: Technical Standards

- **Frontend:** React + Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** Node.js + Express or Next.js API routes
- **Database:** PostgreSQL (via Prisma ORM)
- **SMS:** Twilio (HIPAA-eligible tier)
- **AI:** OpenAI GPT-4 for protocol parsing
- **Hosting:** Vercel (frontend) + Railway/Render (backend)
- **Auth:** NextAuth.js or Clerk
- **All code in TypeScript** — no exceptions
