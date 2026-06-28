# Square Integration — How It Works

> Reference doc for connecting real med-spa Square accounts and triggering automated aftercare when appointments complete.
> Grounded in the official Square docs: https://developer.squareup.com/docs/build-basics/access-tokens
> Last updated: 2026-06-28

---

## 1. The three Square Developer dashboard tabs

Square organizes credentials across three tabs. Each serves a different purpose.

### Credentials tab — "access *your own* account"
Identification + a full-power token for the account that owns the app.
- **Application ID** (`sandbox-sq0idb-…` / `sq0idb-…`) — identifies your app (the OAuth "client id").
- **Sandbox / Production Access Token** (`EAAAl8…`) — a **personal access token**: unrestricted, full access to *your own* Square account's resources.
- **Use it for:** testing, or a single-account integration (one clinic = your account).
- > Docs: *"For custom integrations that only access your own Square account, personal access tokens are suitable."*

### OAuth tab — "let *other sellers* connect their accounts"
Everything needed for the multi-tenant OAuth flow.
- **Application Secret** (`sandbox-sq0csb-…` / `sq0csp-…`) — the **client secret**; verifies your app's identity when exchanging an auth code for a token.
- **OAuth Redirect URL** + **Scopes** — where Square sends the seller after consent, and the permissions requested.
- Produces, per connected seller: an **OAuth access token** (scoped) + **refresh token** (must refresh before expiry).
- **Use it for:** a SaaS where many clinics each connect *their own* Square.
- > Docs: *"Multi-tenant applications that serve multiple sellers should use OAuth access tokens."*

### Webhooks tab (Subscriptions) — "Square pushes events to you"
- **Notification URL** — your server endpoint (e.g. `https://app.aftercareos.com/api/webhooks/square`).
- **Subscribed events** — e.g. `booking.updated`.
- **Signature Key** — verifies incoming webhooks are genuinely from Square.
- **Use it for:** reacting to things that happen in Square *without polling* — exactly our case.

---

## 2. The key concept: two token *modes*

| Mode | Token | Best for |
|---|---|---|
| **Personal** | one full-access token for *your* account | testing, or a single-clinic integration |
| **OAuth** | scoped token *per connected seller* | multi-tenant SaaS (many clinics) |

**AftercareOS uses OAuth in production** (each clinic connects their own Square). The personal access token is fine for testing against one sandbox account.

---

## 3. Phase 1 — One time: a med-spa connects their Square account (OAuth)

Runs once per clinic. This is the OAuth flow (Authorization → Callback → Token request).

1. Clinic owner clicks **Connect Square** in AftercareOS → Settings.
2. We redirect them to Square's consent screen:
   `https://connect.squareup.com/oauth2/authorize?client_id=APP_ID&scope=APPOINTMENTS_READ+CUSTOMERS_READ+MERCHANT_READ+PAYMENTS_READ&response_type=code&state=…`
3. They sign into Square, review the requested permissions, click **Allow**.
4. Square redirects back to **our** registered redirect URL:
   `https://app.aftercareos.com/api/square/callback?code=XXXX&state=…`
5. Our server takes that `code` + our **Application Secret**, calls Square's **`ObtainToken`** (`POST /oauth2/tokens`), and receives that clinic's **OAuth access token + refresh token**.
6. We **store their token** (encrypted, tied to their clinic) and they **map their Square services → aftercare protocols** (e.g. their "Botox 1 Area" → our Botox journey).

After this, AftercareOS has scoped read access to *that clinic's* Square — and only theirs.

> **Tokens expire.** OAuth access tokens must be refreshed periodically using the refresh token before they expire.

**Code:** `src/app/api/square/connect/route.ts`, `src/app/api/square/callback/route.ts`, `src/lib/square.ts`, scopes in `square.ts`.

---

## 4. Phase 2 — Every appointment: completion → auto-aftercare

Runs automatically, forever, with zero clicks.

1. **Appointment happens** — Sarah gets Botox; front desk marks it **Completed** in Square.
2. **Square fires a webhook** → POSTs a `booking.updated` event to our Notification URL (`/api/webhooks/square`), signed with the signature key.
3. **Our webhook verifies the signature** (proves it's genuinely from Square, not a spoof), then reads `status = COMPLETED`.
4. From the booking it extracts **customer_id** + **service_variation_id**, then uses the clinic's stored OAuth token to:
   - fetch Sarah's **phone** (Customers API)
   - fetch the **service name** (Catalog API → "Botox 1 Area")
5. It looks up the **service → protocol mapping** ("Botox 1 Area" → Botox journey), then creates the patient + enrollment and **schedules all the timed messages** (Day 0, Day 1, Day 3, Day 7, Day 14, Month 3).
6. Our **scheduler** (Inngest / cron) sends each SMS via Twilio at the right moment. Replies or "Something's wrong" taps route back into the clinic's inbox.

```
Sarah's Botox done in Square
   └─▶ Square webhook (booking.updated, COMPLETED)
          └─▶ /api/webhooks/square  (verify signature)
                 └─▶ fetch phone + service via clinic's OAuth token
                        └─▶ "Botox 1 Area" → Botox protocol
                               └─▶ enroll Sarah + schedule Day0…Day90
                                      └─▶ scheduler sends SMS via Twilio
```

**Code:** `src/app/api/webhooks/square/route.ts`, `src/lib/booking-enroll.ts`, `src/lib/scheduler.ts`, `src/components/app/square-integration.tsx`.

---

## 5. Requirements to run this live with real med-spa accounts

- [ ] **Public HTTPS URL** — Square can only POST to a public address (deploy to Vercel; `localhost` can't receive webhooks).
- [ ] **OAuth Redirect URL** registered in Square's OAuth tab → `https://app…/api/square/callback`.
- [ ] **Webhook Subscription** in Square's Webhooks tab → `https://app…/api/webhooks/square`; subscribe to `booking.updated`; copy the **Signature Key**.
- [ ] **App in Production + Square approval** — for *other sellers'* real accounts via OAuth, Square must review/publish your app (one-time). Sandbox test accounts need no approval.
- [ ] **Env vars** set: `SQUARE_APP_ID`, `SQUARE_APP_SECRET`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_ENVIRONMENT=production`.

---

## 6. Env vars (in `.env`, gitignored)

| Var | From | Purpose |
|---|---|---|
| `SQUARE_APP_ID` | Credentials tab | App identity (OAuth client id) |
| `SQUARE_APP_SECRET` | OAuth tab | Verifies app identity in token exchange |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Webhooks tab | Verifies incoming webhooks |
| `SQUARE_ENVIRONMENT` | — | `sandbox` or `production` |
| `SQUARE_ACCESS_TOKEN` *(optional, test only)* | Credentials tab | Personal token for one-account testing |

---

## 7. Current status

- **OAuth Connect + callback**: coded ✅ (sandbox credentials configured in `.env`).
- **Webhook receiver + auto-enroll**: coded ✅.
- **Service-mapping UI**: coded ✅ (maps Square services → protocols).
- **Dev simulator** (`/api/dev/simulate-appointment`): fakes a completed appointment so the flow is demoable without Square ✅.
- **Live with real accounts**: ⬜ blocked on a public deploy URL (for the OAuth redirect + webhook subscription) + Square app approval.

> Next step to go live: deploy to Vercel → register OAuth redirect + webhook URL in the Square app → test the full loop against a sandbox appointment.
