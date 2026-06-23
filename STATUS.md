# AftercareOS — Status & Remaining Work

> Living doc. Update this as things ship. For the detailed phase-by-phase plan, see [`PLAN.md`](./PLAN.md).
> Last updated: 2026-06-24

---

## ✅ Where we are (done)

### Product build — all 8 phases complete
| Phase | Scope | Status |
|---|---|---|
| P0 | Foundation, design system (matches aftercareos.com), app shell, 5 seed protocols | ✅ |
| P1 | AI/heuristic protocol parser + timeline editor + live SMS preview + tokens/quiet-hours | ✅ |
| P2 | Twilio engine (mock), enrollment service, Inngest scheduler, "Something's wrong" escalation page | ✅ |
| P3 | Square OAuth + booking webhook auto-enroll + service mapping + dev simulator | ✅ |
| P4 | AI triage (LLM + keyword), 2-way inbox, quick replies, escalation resolution, inbound SMS webhook | ✅ |
| P5 | Tracked review links (`/r/:token`), rebooking nudges, reviews dashboard | ✅ |
| P6 | Editable clinic profile, Stripe checkout (3 plans), analytics charts | ✅ |
| P7 | Audit log, multi-language (en/es) escalation page, HIPAA compliance checklist | ✅ |

### Persistence + AI — live
- **Supabase (project `rtpouxildqvtkvyvobdv`):** all 14 tables + enums + RLS created and seeded (org, clinic, owner, 5 protocols / 28 steps, service mappings). Schema in [`supabase/schema.sql`](./supabase/schema.sql).
- **Data layer:** pivoted from in-memory mock → **Supabase Data API** (`@supabase/supabase-js`, secret key). Mock store stays as automatic fallback when no secret key is set (so tests/offline dev keep working).
- **GLM AI:** protocol parser + triage run on **`glm-4.5-flash`** (key live). Falls back to a deterministic heuristic parser/triage when no key is set.
- **Verified live:** reading protocols from Supabase; enrolling a patient persists patient + enrollment + 7 scheduled messages, sends the Day-0 SMS (Twilio mock), logs to `MessageLog`.

### Tests
- **65 unit tests** (Vitest) — pass in mock mode.
- **~34 e2e tests** (Playwright) — cover shell, journeys, patients/enroll, inbox/triage, reviews, Square, settings, compliance. ⚠️ Some now run against live Supabase mode and may need matcher re-baselining (see Remaining).

### Landing page
- Live at **aftercareos.com** (GitHub Pages). Medical-aesthetics focused per feedback (Patients not Clients; no tattoo/piercing; added "How It Works"; stronger CTAs).

### Commits (pushed to `origin/main`)
- `0144e2c` Wire real persistence (Supabase) + live AI (GLM)
- `56ad9c1` Tighten landing page to medical-aesthetics focus
- `b4ecba4` Build full AftercareOS product (dashboard + aftercare engine)

---

## 🔑 Credentials status

| Service | Status | Notes |
|---|---|---|
| Supabase URL + publishable | ✅ set (`.env`) | project `rtpouxildqvtkvyvobdv` |
| Supabase **secret** key | ✅ set | server-side, bypasses RLS |
| Supabase MCP (opencode) | ✅ configured + authed | `execute_sql` available in fresh sessions |
| GLM API key | ✅ set | `glm-4.5-flash` (account has no paid balance; flash works) |
| Twilio | ⬜ not set | mock mode = no real SMS |
| Square | ⬜ not set | dev simulator fakes completed appointments |
| Stripe | ⬜ not set | dev checkout fakes success |
| DATABASE_URL (raw Postgres) | ⚠️ set but **unreachable** from dev machine | IPv6-only direct host + pooler "tenant not found"; app uses Data API instead, so this is unused at runtime |

> `.env` is gitignored — keys never committed.

---

## 🟡 Remaining work

### High priority — go live
- [ ] **Deploy dashboard to Vercel** (it's currently localhost only). Need: Vercel project, env vars, custom domain (e.g. `app.aftercareos.com`). Verify Supabase Data API works from Vercel (it should — HTTPS).
- [ ] **Wire Twilio** for real patient SMS: provision a per-clinic number, set `TWILIO_*` env, point inbound webhook to the deployed `/api/webhooks/sms`. Move to Twilio HIPAA tier + sign BAA before med-spa launch.
- [ ] **Re-baseline e2e tests** against Supabase mode (some assumed mock state) — fix matchers or seed deterministic data before each run.
- [ ] **Square**: create a Square Developer app + sandbox, set `SQUARE_*`, point booking webhook to deployed `/api/webhooks/square`, test real auto-enroll on completed appointments.

### Medium priority
- [ ] **Stripe**: add real price IDs + `STRIPE_SECRET_KEY`, point `/api/webhooks/stripe`, test real checkout → plan upgrade.
- [ ] **Real Supabase Auth** for clinic login (currently single hardcoded demo org). Multi-tenant: each signup → own Organization + ClinicProfile + RLS by `orgId`.
- [ ] **RLS policies** for any client-side access (currently RLS enabled with no policies = anon sees nothing; server uses secret key).
- [ ] **Inbound SMS** end-to-end test with real Twilio number → triage → alert in inbox.
- [ ] **Scheduler in prod**: run Inngest (or Vercel Cron hitting `/api/cron/process-due?secret=`) so timed messages actually send.

### Low priority / polish
- [ ] Remove dead `DATABASE_URL`/Prisma runtime path (keep Prisma only for schema mgmt if desired) — or keep as-is (harmless, unused).
- [ ] Decide whether to keep `.agents/skills/` + `skills-lock.json` in the repo.
- [ ] Multi-language expansion beyond en/es.
- [ ] Phone-frame styling on the SMS preview (vision feedback).
- [ ] Review-request → Google Business Profile API integration (real rating/CTR).
- [ ] Video/rich-link message steps.
- [ ] Vagaro / Fresha integrations after Square.

---

## 🧱 Architecture quick-reference
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind/shadcn + Vercel
- **DB:** Supabase Postgres (accessed via **Data API / secret key**, not direct Postgres — see note above)
- **Auth:** Supabase (planned; single demo org today)
- **SMS:** Twilio (mock until keys added)
- **AI:** GLM `glm-4.5-flash` via Vercel AI SDK (OpenAI-compatible endpoint); heuristic fallback
- **Scheduler:** Inngest function + manual cron endpoint (`/api/cron/process-due`)
- **Booking:** Square (OAuth + webhooks; dev simulator now)
- **Payments:** Stripe (3 plans; dev fake-success now)
- **Design:** coral `#e85d2c`, dark sidebar, warm gradient, glass cards — identical to aftercareos.com

### Key routes
- `/dashboard/*` — app (Home, Journeys, Patients, Inbox, Reviews, Settings)
- `/dashboard/journeys/new` — AI protocol builder
- `/dashboard/journeys/[id]/edit` — protocol editor
- `/w/[token]` — public "Something's wrong" escalation page (en/es)
- `/r/[token]` — tracked review redirect → Google
- `/api/webhooks/{sms,square,stripe}` + `/api/cron/process-due` + `/api/dev/simulate-appointment`

---

## ▶️ Run locally
```bash
npm install
cp .env.example .env   # then fill in keys (Supabase secret + GLM at minimum)
npm run dev            # http://localhost:3000
npm test               # unit (mock mode)
npm run test:e2e       # e2e (BASE_URL=http://localhost:3000)
```
With no Supabase secret key set, the app runs fully on the in-memory mock store.
