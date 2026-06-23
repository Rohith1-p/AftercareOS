# AftercareOS — Build Plan & Design System

> Status: Planning → ready to implement
> Repo: github.com/Rohith1-p/AftercareOS
> v1 vertical: **Medical Aesthetics / Med-Spas** (Botox, fillers, laser, peels, microneedling)
> Landing page (source of truth for design): https://aftercareos.com

This document breaks the entire product into phases, with each functionality detailed enough to implement directly. Design tokens are extracted from the live landing page `styles.css` so the dashboard feels like one product with the marketing site.

---

## 1. Product in one paragraph

AftercareOS replaces paper aftercare sheets with **timed, procedure-specific SMS sequences**. A provider uploads their aftercare protocol (PDF/text), AI turns it into a Day 0 / Day 1 / Day 3 / Day 7 message journey, maps it to a booking service, and from then on every completed appointment automatically starts the right sequence. Every message carries a **"Something's wrong"** button that routes concerns to the clinic *before* they become a 1-star Google review. At the end of the journey, happy clients are asked for a review and a rebooking nudge.

### The core loop (what every feature serves)
1. **Upload** protocol → AI parses into timed messages
2. **Map** protocol → booking service (Square)
3. **Complete** appointment → webhook → auto-enroll patient → sequence triggers
4. **Patient** receives timed SMS, can tap "Something's wrong"
5. **Alert** lands in provider inbox → resolved before a bad review
6. **Journey end** → "doing great?" → Google review ask + rebooking link

### Core differentiators (from research — build these first, market them hard)
1. **AI protocol upload** (PDF → Day 0/1/3/7 sequence) — Easy Aftercare & PostCare don't make it this light
2. **"Something's wrong" pre-escalation button** — routes issues before reviews; nobody else owns this
3. **Square/Vagaro auto-trigger** — zero-click enrollment vs PostCare's manual 15s enrollment
4. **SMS-first (US), aesthetics-native** — not WhatsApp, not clinical/hospital branding
5. **Price**: flat ~$99/mo, no setup fee, no 12-month contract (vs Easy Aftercare $149–399 + $299 setup)

---

## 2. Design System (from landing page `styles.css`)

The dashboard must feel like the marketing site: warm, soft, premium, "aesthetics-native, not clinical". Translate the CSS custom properties below into the app's design tokens.

### 2.1 Color tokens
| Token | Value | Use |
|---|---|---|
| `accent` | `#e85d2c` (coral/orange) | **Brand / primary actions / active states** |
| `accent-soft` | `#f07a4f` | hover/secondary accent |
| `dark` | `#1a1a1a` | headings, sidebar, strong text |
| `dark-soft` | `#2d2d2d` | secondary dark |
| `text` | `#333` | body text |
| `text-muted` | `#5c5c5c` | meta, captions |
| `bg` | `#fdf8f5` | page background base (warm cream) |
| `card` | `rgba(255,255,255,0.88)` | surfaces (glassmorphism) |
| `card-border` | `rgba(0,0,0,0.06)` | hairline borders |
| `success` | `#22c55e` | "On track", resolved, delivered |
| `star` | `#ffb400` | reviews/ratings |
| `error` | `#dc2626` | escalations/urgent, destructive |
| `warning` | `#f59e0b` | medium severity |
| gradient | `135deg #fefefe→#fef9f6→#fde8d0→#fad0b8→#f6b0a8→#eba8c0→#d8a8d8` | hero/marketing surfaces |

### 2.2 Typography & shape
- **Font:** `Plus Jakarta Sans` (400/500/600/700/800) — load via Google Fonts in the app too.
- **Radius:** pill `9999px` (buttons, tags), card `20px` (panels), button-rect `12px`.
- **Shadows:** sm `0 2px 8px rgba(0,0,0,.06)`, md `0 8px 24px rgba(0,0,0,.08)`, lg `0 16px 48px rgba(0,0,0,.12)`.
- **Surface treatment:** glassmorphism cards (`backdrop-filter: blur(12px)`, white 88%), subtle 40px grid texture overlay on app background.
- **Iconography:** the diamond glyph `◆` is the AftercareOS mark (used as `logo-icon` in coral). Keep a diamond/coral motif in the app favicon and empty states.

### 2.3 App UI translation (landing → dashboard)
- Landing uses a *floating dark pill nav*. App sidebar = **dark (`#1a1a1a`) left rail** with coral active indicator — the same dark/coral pairing.
- Primary button in-app = **coral `#e85d2c` pill** (landing uses white-on-dark for the nav, but the waitlist form submit is already coral). Standardize: **coral filled = primary CTA** across the app.
- Cards everywhere = white-glass on the warm cream background. Severity tags use pills: urgent=`error`, medium=`warning`, low=`text-muted`.
- Keep the "star" motif for reviews; "✓ check in coral" for completed journey steps (matches landing `.value-list li::before`).

### 2.4 Component library (build in Phase 0)
Use **shadcn/ui + Tailwind**, themed to the tokens above. Components to create: `Button` (coral primary / outline / ghost), `Card` (glass), `Pill`/`Badge` (severity/status), `Input`, `Textarea`, `Select`, `Dialog`, `Sheet`/`Drawer`, `Tabs`, `Table`, `Timeline`, `EmptyState` (diamond motif), `StatCard`, `AlertToast`, `Avatar`, `CommandPalette`.

---

## 3. Tech Stack *(decisions locked)*
- **Framework:** Next.js (App Router) + TypeScript (full-stack: API routes / server actions)
- **DB + Auth:** **Supabase** (Postgres + built-in Auth). Row-Level Security policies enforce clinic/`orgId` scoping. Roles: OWNER / ADMIN / STAFF. Prisma as the ORM over the Supabase Postgres connection.
- **SMS:** **Twilio** — **dedicated number provisioned per clinic** (bought via API at onboarding, ~$1.15/mo each) for deliverability + brand + clean reply routing. **Twilio HIPAA tier + BAA signed early** (free, de-risks med-spa sales).
- **AI:** **Model-agnostic via Vercel AI SDK** — providers: **OpenAI GPT-4o** (primary) and **GLM** (for A/B testing protocol parsing + escalation triage). Switchable per-task.
- **Jobs/scheduling:** **Inngest** runs the worker that polls `scheduled_messages` and sends via Twilio (retries, observability, step functions — reliability is critical for a health-adjacent product). *Not* Twilio scheduling, so we own re-trigger/edit/branch logic.
- **Booking:** Square API + webhooks (Phase 3); Zapier + CSV fallback. **Square Developer account + sandbox to be created as part of Phase 3.**
- **Payments:** Stripe (Phase 6)
- **Hosting:** Vercel (app) + Supabase (DB) + Twilio (SMS)
- **Email:** Resend (transactional)

---

## 4. Architecture (data flow)
```
Booking platform (Square) ──webhook──▶ /api/webhooks/square
                                              │ (appointment COMPLETED)
                                              ▼
                                     Enroll patient + schedule
                                     protocol message sequence
                                              │
                        Cron worker ◀── scheduled_messages table
                                              │ sends at T+5m, +4h, Day1…
                                              ▼
                                          Twilio SMS ──▶ Patient
                                              ▲
Patient reply / "Something's wrong" ──Twilio webhook──▶ /api/webhooks/sms
                                              │
                                              ▼
                              Inbox + Escalation queue (dashboard)
```

### Why own the scheduler (not Twilio's)
We need to pause, edit, resume, and conditionally branch sequences, and respect quiet hours. A `scheduled_messages` table + worker gives full control.

---

## 5. Data Model (core tables — Prisma)

```prisma
// Identity & tenancy
Organization { id, name, plan, stripeCustomerId }        // a clinic/studio
User { id, orgId, email, name, role }                    // OWNER | ADMIN | STAFF
ClinicProfile { orgId, logoUrl, brandColor, senderName, replyNumber,
                quietHoursStart, quietHoursEnd, consentText, language }

// Protocols & journeys (the differentiator)
Protocol { id, orgId, name, category, segment,           // Botox, Filler, Laser…
           source, isActive, version, createdAt }
ProtocolStep { id, protocolId, offsetMinutes, label,     // "Day 1, 9 AM"
               body, includeEscalationLink, mediaUrl }   // +5m, +4h, +1d…
ServiceMapping { id, orgId, provider,                     // "square"
                 externalServiceId, protocolId }          // "Botox" service → Protocol

// Patients & enrollments
Patient { id, orgId, phone (E.164), name, consentAt, source }
Enrollment { id, patientId, protocolId, orgId, appointmentAt,
             status, startedAt, completedAt, bookedServiceLabel }
ScheduledMessage { id, enrollmentId, protocolStepId,
                   sendAt, status, twilioMessageSid, attempts }
MessageLog { id, enrollmentId, direction, body, sentAt, status }

// Inbox & escalation
Conversation { id, patientId, orgId, lastInboundAt, unreadCount }
Alert { id, enrollmentId, orgId, severity, category,
        status, note, photoUrl, createdAt, resolvedAt, resolvedBy }

// Reviews & rebooking
ReviewRequest { id, enrollmentId, sentAt, clickedAt, platform }
// Integrations
Integration { id, orgId, provider, externalMerchantId,
              accessToken (enc), refreshToken (enc), status }
IntegrationEvent { id, orgId, provider, externalId, type, raw, processedAt }
```

---

## 6. Phased Plan

Each phase is independently shippable. "Definition of done" is the bar for moving on.

---

### Phase 0 — Foundation & Design System  *(~1–1.5 wks)*
**Goal:** a logged-in app shell that looks like AftercareOS, on the chosen stack.

**Functionality**
- Next.js + TS + Tailwind + shadcn scaffold; Prisma + Postgres; Clerk auth.
- Design-token system (§2) wired into Tailwind theme + shadcn.
- Multi-tenant model: Organization → Users (OWNER/ADMIN/STAFF roles).
- Onboarding flow: create org → clinic profile (name, logo, sender name, reply number placeholder) → land on empty dashboard.
- App shell: dark left sidebar (Home, Journeys, Patients, Inbox, Reviews, Settings) with coral active state + top bar (clinic switcher, profile). Warm cream background, glass cards.
- Seed the 5 core aesthetics protocols (Botox, Filler, Laser, Chemical Peel, Microneedling) as read-only templates (content from research timelines).
- Empty states for every section with the ◆ motif.

**Design notes:** sidebar is the landing page's dark pill, stretched vertically; active item = coral left border + coral icon. Cards = `--color-card` glass.

**Definition of done:** a new user can sign up, create a clinic, and see a styled empty dashboard with all 6 sections in the nav.

---

### Phase 1 — Protocols & Journeys  *(~2 wks — THE differentiator)*
**Goal:** provider can build/edit a timed message journey and (later) map it to a service.

**Functionality**
- **Protocol library:** cards grid (category tag: Injectables / Skin / Body; segment tag). Filter/search. "Use template" clones a seeded protocol into the org.
- **Protocol editor (timeline view):** vertical timeline of steps, each step = offset selector (T+5m / +4h / Day1 9am / Day3 / Day7 / Day14 / Day90) + message body editor + live SMS preview (segmented counter, 160-char chunks) + toggle "include 'Something's wrong' link" + optional rich link (video/PDF).
- **AI protocol parser:** upload PDF / paste text / paste URL → OpenAI extracts timed instructions → proposes a step sequence with tone preset ("friendly med-spa" | "clinical" | "tattoo-shop voice"). Provider reviews/edits, then saves. (Prompt grounded by the research's real Botox/Filler timelines.)
- **Personalization tokens:** `{{first_name}}`, `{{procedure}}`, `{{provider_name}}`, `{{clinic_name}}`, `{{book_link}}`, `{{review_link}}`.
- **Quiet-hours awareness:** steps scheduled inside quiet hours shift to next allowed window.
- **Versioning & status:** draft / active / archived. Only one active version per mapped service.
- **Service mapping (UI ready, wiring in Phase 3):** placeholder mapping table so a protocol can be tagged "for service: Botox".

**Design notes:** timeline uses coral node dots on a vertical line; the SMS live-preview card mimics the landing page's mockup chat bubbles (`.mockup-msg` style) for instant brand recognition. The "Something's wrong" CTA preview is the coral `.mockup-btn-pill`.

**Definition of done:** provider uploads a Botox PDF, AI returns an editable Day 0–14 sequence, they save it active, and the live preview matches the SMS patients will receive.

---

### Phase 2 — SMS Engine & Patients (manual enroll)  *(~2 wks)*
**Goal:** a real patient receives the right messages at the right times from a manual enrollment, and can raise an alert.

**Functionality**
- **Twilio setup:** provision/buy a clinic number (or use a shared pool first), store credentials encrypted, set inbound SMS webhook.
- **Patients list:** name, phone (masked), last procedure, status ("Active · Botox Day 3", "Completed", "Not enrolled"), search/filter. Consent flag + consent timestamp (HIPAA/CAN-SPAM hygiene even pre-BAA).
- **Manual enroll flow:** pick patient (or quick-add walk-in) → pick protocol → set appointment time (defaults now) → confirm consent/language → start. Generates `Enrollment` + all `ScheduledMessage` rows upfront.
- **Scheduler worker:** polls `scheduled_messages` due now, sends via Twilio, writes `MessageLog`, retries with backoff, respects quiet hours, dedupes.
- **Patient timeline:** per-patient view of every sent/received message, current step, and any alerts.
- **"Something's wrong" escalation (the secret weapon):** every enabled step appends a short link → a **mobile-friendly public page** ("Tell us what's wrong" → free text + optional photo + severity Mild/Moderate/Urgent). Submit creates an `Alert` + drops a message into the conversation + pings the clinic. This is the pre-review interception.
- **Two-way inbound:** patient replies land in a `Conversation` and surface in a basic list (full inbox UX in Phase 4).

**Design notes:** severity selector uses the pill system (urgent=error red, moderate=warning amber, mild=muted). The public escalation page uses the same warm gradient + glass card so it feels like the clinic's brand, not a scary form.

**Definition of done:** enroll a test patient manually → receive the full sequence on a real phone over time → tap "Something's wrong" → see an alert appear in the dashboard.

---

### Phase 3 — Booking Integration (Square)  *(~2 wks)*
**Goal:** aftercare starts automatically when an appointment is marked complete — the zero-click wow.

**Functionality**
- **Square OAuth connect** ("Connect Square" button → OAuth → store tokens encrypted, refresh logic).
- **Webhook receiver** `/api/webhooks/square`: verify signature, handle `booking.updated`/status COMPLETED, idempotent via `IntegrationEvent`.
- **Service mapping UI:** fetch Square catalog services → provider maps each service → a Protocol (one-time). Show coverage ("12 of 15 services mapped").
- **Auto-enroll on completion:** webhook → resolve service → protocol → create `Patient` if new (fetch phone from Square customer) → create `Enrollment` + schedule messages. Handle cancellations (stop pending messages).
- **Toggle auto-enroll per service** + global pause.
- **Fallbacks:** Zapier webhook receiver (generic `/api/webhooks/enroll`) for Vagaro/Fresha/Booksy; **CSV upload** ("Import today's completed appointments") as the safety net.
- **Edge cases:** missing phone, unmapped service, duplicate patient, re-enroll guard (don't double-start).

**Design notes:** Integrations screen = cards per platform with connection status pill (Connected = success green, Disconnected = muted). Service mapper = two-column drag/assign list.

**Definition of done:** complete a Square appointment in a sandbox → aftercare sequence starts automatically with no manual clicks.

---

### Phase 4 — Inbox & Triage  *(~1.5 wks)*
**Goal:** staff handle patient replies and escalations in one place, sorted by urgency.

**Functionality**
- **Unified SMS inbox:** threaded conversations per patient. Filters: All / Unread / Needs reply / **Escalations only**. Search.
- **Quick replies & snippets:** clinic-approved canned responses ("Normal swelling after lip filler — peaks Day 2–3", "Please send a photo", "Book a follow-up"). Insert with one click.
- **Escalation queue:** every `Alert` as a row — patient, protocol, step ("Day 3 Botox"), category, time-since, severity. Sorted urgent-first.
- **AI keyword triage:** inbound messages scanned for red flags ("bleeding", "infection", "severe pain", "vision changes", "asymmetry") → auto-flag/escalate.
- **Resolution flow:** mark Reviewed / Responded / Booked follow-up / Escalated to MD, with internal notes + assignee. Full audit trail per alert.
- **Assign + @mention** between staff (basic).

**Design notes:** inbox = familiar 3-pane (list | thread | patient context). Escalation rows get a left severity color bar. The "Escalations only" filter is visually emphasized — this is the reputation-protection hero feature.

**Definition of done:** staff can read, reply with a snippet, resolve an escalation, and see AI auto-flag a concerning inbound message.

---

### Phase 5 — Reviews & Rebooking  *(~1.5 wks)*
**Goal:** turn completed journeys into 5-star reviews and return visits.

**Functionality**
- **Journey-end branch:** after the final check-in, send a smart ask:
  - Patient signals "doing great" → route to **Google Review link** (+ optional Yelp).
  - Patient signals concern → route to **private feedback** (never public).
- **Review request config:** which step, link, copy, cooldown (don't ask twice in X days).
- **Rebooking reminders:** Day ~90 nudge ("Your Botox typically lasts 3–4 months — rebook") with a booking link (Square online booking URL or generic).
- **Reviews dashboard:** requests sent, click-through %, current rating/review-count (manual entry first; Google API later).
- **Metrics:** reviews/month trend, % who clicked.

**Design notes:** review card uses the `#ffb400` star motif; "doing great → review" vs "concern → private" shown as a friendly two-path visual.

**Definition of done:** a completed journey automatically offers a review link to happy patients and a rebooking nudge at the configured interval.

---

### Phase 6 — Home/Today, Analytics, Settings & Billing  *(~2 wks)*
**Goal:** a control center + operational visibility + monetization.

**Functionality**
- **Home / Today (control center):**
  - Active journeys by day-bucket (Day 0 / Day 1 / Day 3…) — click to drill in.
  - Alerts & escalations summary (count by severity, "X tapped 'Something's wrong'").
  - Snapshot metrics: messages sent today, open/response rate, last-7-day escalations, review requests sent.
- **Analytics:** engagement (% who replied/engaged), journey completion rate, escalations per 100 patients, avg staff response time, rebooking rate (completed-journey vs not, once booking data flows). Keep it tiny: one KPI row + 1–2 charts.
- **Settings:**
  - Clinic profile (name, logo, brand color, sender name, reply-to number).
  - Message settings (quiet hours, escalation behavior, languages, consent/disclaimer text).
  - Team & permissions (invite staff, roles: who edits protocols vs replies only).
  - Integrations management.
- **Billing (Stripe):** plans (Starter ~$99, Professional ~$149, Growth ~$199 per research pricing), monthly, no setup fee, self-serve cancel. Usage = active patients/month.

**Design notes:** Home = grid of `StatCard`s (glass) over the warm gradient; a prominent "Needs attention" panel for escalations. Analytics charts use coral accent line/bars.

**Definition of done:** owner opens the app and sees what needs attention today + key metrics, and can subscribe/upgrade via Stripe.

---

### Phase 7 — HIPAA/Compliance & Scale  *(~2 wks, gates med-spa GTM)*
**Goal:** safe to sell to med-spas handling PHI.

**Functionality**
- **Twilio HIPAA tier + signed BAA**; PHI encryption at rest; minimize stored PHI (no clinical notes/diagnoses — we're aftercare messaging, not an EMR).
- **Audit logs** (who viewed/responded/resolved what) — supports malpractice-defense narrative.
- **Business Associate considerations** + data-retention/ deletion flows; configurable consent capture.
- **Multi-language** message variants (Phase 1.1+).
- **More integrations:** Vagaro (direct API post-partnership), Fresha, Zapier app publish.

**Definition of done:** a compliance checklist passes; BAA in place; clinic can request data export/deletion.

---

## 7. Phase → Dashboard-section map (from the research spec)
| Research section | Phase |
|---|---|
| Journeys & Protocols | 1 |
| Patients & Enrollments | 2 (manual) → 3 (auto) |
| Messaging Inbox | 4 |
| Alerts & Triage | 2 (alert capture) + 4 (queue/resolution) |
| Reviews & Reputation | 5 |
| Analytics & Reports | 6 |
| Home / Today | 6 |
| Integrations & Settings | 3 (Square) + 6 (settings/billing) + 7 (more) |

---

## 8. MVP cutoff (what to ship first to beta)
Phases **0 → 1 → 2 → 3** = the differentiating, sellable loop:
*Upload PDF → AI journey → auto-trigger from Square → timed SMS + "Something's wrong".*
That alone is the pitch. Inbox polish (4), reviews (5), analytics/billing (6) follow closely to make it a product. HIPAA (7) gates serious med-spa sales.

**Solo timeline estimate (from research):** MVP ~8–12 weeks; Phase 0–3 ~6–8 weeks.

---

## 9. Pricing (from research, validated)
| Tier | Active patients/mo | Price |
|---|---|---|
| Starter | up to 100 | **$99** |
| Professional | up to 500 | **$149** |
| Growth | up to 1,000 | **$199** |
No setup fee, no 12-month contract. Unit economics: ~$15 COGS (Twilio+AI+hosting), ~90% margin.

---

## 10. Decisions — LOCKED
1. **Auth:** **Supabase Auth** (consolidates auth + DB + RLS; OWNER/ADMIN/STAFF roles, clinic scoping).
2. **DB host:** **Supabase Postgres** (Prisma over the connection).
3. **Scheduler:** **Inngest** (free tier covers MVP and beyond; retries/observability).
4. **Phone numbers:** **Dedicated Twilio number per clinic**, bought via API at onboarding.
5. **Twilio HIPAA BAA:** **Signed early** (free, enables safe PHI handling + med-spa sales).
6. **AI:** **Model-agnostic (Vercel AI SDK)** with **OpenAI GPT-4o** + **GLM** as switchable providers.
7. **Square:** **Create the Square Developer account + sandbox as part of Phase 3.**

All blockers cleared. Next step: scaffold **Phase 0** (repo structure, Supabase + Prisma + auth, design-token system, app shell).
