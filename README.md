# AftercareOS

AI-powered aftercare messaging platform for medical aesthetics clinics, med spas, and tattoo/PMU studios.

Clinics lose patients to silent bad outcomes: an unhappy patient says nothing to the studio and everything in a 1-star review. AftercareOS automates the follow-up in between. After an appointment, the platform runs the patient's aftercare journey over SMS. An AI triage layer reads every reply, flags complications early, and escalates unhappy patients to staff before they go public. Bookings, review requests, and payments (Square, Stripe) close the loop inside the clinic dashboard.

## What's inside

- **Next.js 14 (App Router) + TypeScript** — clinic dashboard: inbox, journeys, patients, reviews, settings
- **AI layer** (`src/lib/ai/`) — protocol parser turns clinic aftercare instructions into structured journeys; triage classifies every inbound patient reply
- **SMS** — Twilio integration with inbound webhooks and token-based public reply links
- **Payments** — Square (appointment-triggered aftercare) and Stripe (checkout), both with webhook handling
- **Background work** — Inngest functions + cron routes for journey scheduling and escalations
- **Data** — Prisma + Supabase Postgres, with migrations; falls back to an in-memory mock store so the full UI runs without a database
- **Tests** — vitest unit tests (triage, protocol parser, scheduler, tokens, enrollment) and Playwright e2e across the dashboard flows

## Quick start

```bash
cp .env.example .env   # works with no services configured: MOCK_DATA mode
npm install
npm run dev
```

With no Supabase/Twilio/Stripe keys set, the app boots in MOCK_DATA mode with seeded demo data, so the whole product is clickable locally.

## Architecture notes

- `src/app/r/[token]`, `src/app/w/[token]` — public patient-facing pages, access via one-time tokens (no PHI behind auth-less routes)
- `src/lib/escalation-registry.ts` — escalation routing when AI triage confidence drops or a patient reports an issue
- `supabase/migrations/` + `prisma/` — schema source of truth
- `docs/specs/` — spec-driven design docs (Spec Kit) and design system

---

Built and operated end to end by [Rohith Perumandla](https://rohithperumandla.me). Site: [aftercareos.com](https://aftercareos.com)
