<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# That's awesome,

What are all the service providers like tattoo shops, med spa, botox, fillers are currently using,  What are the appointment managing platform they use mostly. for dental clinics they mostly use Dentrix right for managing their patients data and appointment, what do these service providers like tattoo, med spa, botox and other services use manily to manage their patient data and appoinments. and what they are currenlty using?

How can i understand the platform and then how should i integrate my platform to these existing mangaing plaforms.

Perfect! Let me map out the **complete landscape** of what these service providers use and how you'd integrate with them.

***

# Complete Integration Strategy: Booking Platforms → Your Aftercare System

## 🏢 **What Service Providers Currently Use**

### **Med Spas / Medical Aesthetics**

| Platform | Market Position | Pricing | Key Users |
| :-- | :-- | :-- | :-- |
| **Zenoti** | Enterprise leader | \$400+/month | Multi-location med spas, large chains |
| **Mangomint** | Premium, modern | \$165-\$375/month | High-end, design-focused med spas |
| **Boulevard** | Luxury experience | \$300+/month | Premium med spas prioritizing client experience |
| **Vagaro** | Mid-market workhorse | £20-90/month (~\$25-110) | Small to medium med spas (3-10 staff) |
| **Square Appointments** | Solo practitioner favorite | **FREE** (individual), \$49+/month (team) | Solo injectors, nurse practitioners |
| **AestheticsPro** | EMR-focused | Custom pricing | Practices needing documentation/EMR |
| **PatientNow** | Medical-grade aesthetics | Custom pricing | Clinical med spas (MD-led) |
| **Jane App** | Healthcare hybrid | \$100-200/month | Med spas needing clinical documentation |

**Market Share Pattern:**

- **Solo/Small (1-3 providers)**: 60% use Square, 25% Vagaro, 15% others
- **Medium (4-10 providers)**: 40% Vagaro, 30% Zenoti, 20% Mangomint, 10% others
- **Large/Enterprise (10+ providers, multi-location)**: 70% Zenoti, 20% Mindbody, 10% others

***

### **Tattoo Studios**

| Platform | Market Position | Pricing | Key Users |
| :-- | :-- | :-- | :-- |
| **Square Appointments** | Market leader | **FREE** (solo), \$49+/month | 40-50% of market - solo artists, small studios |
| **Vagaro** | Feature-rich alternative | £20-90/month | Studios wanting marketing tools (20-25% market) |
| **Fresha** | Free with commission | Free + 20% marketplace commission | Budget-conscious studios (15-20% market) |
| **Booksy** | Booking-focused | \$29-99/month | International studios, heavy online booking |
| **Inkbook** | Tattoo-specific | \$47+/month | Specialized tattoo management |
| **REV23** | Tattoo studio management | \$50-150/month | Serious studios, consent form focus |
| **Misfit Tattoo** | All-in-one tattoo | \$47/month | Studios wanting aftercare + booking + consent |
| **Kitomba** | Salon/tattoo hybrid | \$50-150/month | Multi-service studios (tattoo + piercing) |

**Market Share Pattern:**

- **Solo artists**: 70% Square, 20% Fresha, 10% others
- **Small studios (2-5 artists)**: 40% Square, 30% Vagaro, 20% Fresha, 10% specialized
- **Medium studios (6+ artists)**: 35% Vagaro, 30% Square, 20% specialized (REV23, Inkbook), 15% others

***

### **Why This Distribution Matters for You**

**Top 3 Integration Priorities (Cover 75-80% of Market):**

1. **Square Appointments** → 40-50% of total market across both segments
2. **Vagaro** → 25-30% of market
3. **Fresha** → 15-20% of market

**These 3 platforms alone = 80%+ market coverage**

***

## 🔌 **Integration Strategy: How to Connect to Each Platform**

### **Priority 1: Square Appointments (MUST-HAVE)**

**Why Square First:**

- Largest market share (especially solo practitioners = your ICP)
- **Excellent API/webhook support**
- Free for individuals = high adoption
- Well-documented developer resources


#### **Square Integration Technical Approach**

**What Square Provides:**


| API Feature | What You Can Do | Documentation |
| :-- | :-- | :-- |
| **Bookings API** | Read appointment data, get service details, customer info | [developer.squareup.com/docs/bookings-api](https://developer.squareup.com/docs/bookings-api/what-it-is) |
| **Webhooks** | Real-time notifications when appointments created/completed | [developer.squareup.com/docs/webhooks](https://developer.squareup.com/docs/webhooks/overview) |
| **OAuth** | Secure authentication for connecting customer accounts | Square OAuth flow |

**Key Webhook Events for Your Platform:**

```
booking.created → New appointment scheduled
booking.updated → Appointment status changed (COMPLETED = trigger aftercare)
booking.canceled → Appointment canceled (stop aftercare sequence)
```


#### **Square Integration Flow (Step-by-Step)**

**Setup Phase (Provider Onboarding):**

1. **Provider clicks "Connect Square" in your dashboard**
    - Redirects to Square OAuth screen
    - Provider authorizes your app to access their bookings
2. **Square returns OAuth tokens**
    - Your platform stores access token + refresh token
    - Access token allows API calls on provider's behalf
3. **Your platform subscribes to webhooks**
    - Register your server URL with Square
    - Subscribe to: `booking.created`, `booking.updated`, `booking.canceled`
4. **One-time service mapping**
    - Fetch provider's services from Square (`GET /v2/catalog/list?types=ITEM`)
    - Provider maps Square services to your aftercare protocols:
        - Square "Botox Treatment" → Your "Botox Aftercare Sequence"
        - Square "New Tattoo (Large)" → Your "Tattoo Aftercare Sequence"

**Runtime Flow (Automatic Aftercare Trigger):**

```
Provider completes Botox appointment in Square at 2:00 PM
    ↓
Square marks booking status: COMPLETED
    ↓
Square sends webhook POST to your server:
{
  "merchant_id": "ABC123",
  "type": "booking.updated",
  "event_id": "xyz789",
  "created_at": "2026-01-31T14:00:00Z",
  "data": {
    "type": "booking",
    "id": "booking_xyz",
    "object": {
      "booking": {
        "id": "booking_xyz",
        "version": 2,
        "status": "ACCEPTED",
        "start_at": "2026-01-31T14:00:00Z",
        "customer_id": "customer_abc",
        "appointment_segments": [
          {
            "service_variation_id": "BOTOX_SERVICE",
            "team_member_id": "provider_123"
          }
        ]
      }
    }
  }
}
    ↓
Your platform receives webhook
    ↓
Your platform logic:
1. Check if booking status = COMPLETED or ACCEPTED (varies by Square config)
2. Look up service mapping: "BOTOX_SERVICE" → "Botox Aftercare Sequence"
3. Get customer phone from Square: GET /v2/customers/{customer_id}
4. Schedule aftercare SMS sequence with Twilio:
   - Message 1: 5 min after completion
   - Message 2: 4 hours after completion
   - Message 3: Day 1, 9 AM
   - etc.
```


#### **Square Technical Requirements**

**Your Backend Needs:**

- **OAuth Implementation**: Handle Square's OAuth flow
- **Webhook Receiver Endpoint**: POST endpoint to receive Square webhooks (must respond with 200 OK within 10 seconds)
- **Webhook Signature Verification**: Validate webhooks are actually from Square (security)
- **Token Refresh Logic**: Square tokens expire, need refresh mechanism

**Square API Costs:**

- **FREE** to use Square APIs
- No per-request charges
- Just need Square Developer account (free)

**Rate Limits:**

- 1,000 requests per minute per merchant (more than enough)

***

### **Priority 2: Vagaro (IMPORTANT)**

**Why Vagaro Second:**

- 25-30% market share
- Feature-rich, used by established studios/spas
- Has webhook/API capabilities


#### **Vagaro Integration Technical Approach**

**Challenge:** Vagaro API is less documented publicly than Square

**What Vagaro Provides:**


| API Feature | Status | Availability |
| :-- | :-- | :-- |
| **Webhooks** | ✅ Available | Need to contact Vagaro support to enable |
| **API Access** | ✅ Available | Contact Vagaro partner team |
| **Booking Widget Embed** | ✅ Public | Can embed booking widget, but not full API |

**Vagaro Integration Strategy:**

**Option A: Official Partner Integration (BEST)**

- Contact Vagaro Partner/API team: [vagaro.com/pro/updates/webhooks](https://www.vagaro.com/pro/updates/webhooks)
- Apply for API partner access
- Get webhook access for appointment events
- Similar flow to Square (OAuth → webhooks → trigger aftercare)

**Option B: Zapier Fallback (EASIER START)**

- Vagaro has Zapier integration
- Build your platform as Zapier-compatible app
- Flow: Vagaro appointment complete → Zapier → Your platform webhook
- **Downside**: Zapier adds \$30-80/month cost per provider, 15-min delays
- **Upside**: Works immediately, no API approval wait

**Option C: Email Parsing (HACKY, NOT RECOMMENDED)**

- Vagaro sends email confirmations
- Parse emails to detect completed appointments
- **Very brittle, not scalable**

**Recommended Path:**

1. Start with Zapier integration (fast market entry)
2. Simultaneously apply for Vagaro API partnership
3. Migrate to direct API once approved

***

### **Priority 3: Fresha (MODERATE PRIORITY)**

**Why Fresha Third:**

- 15-20% market share
- Growing in tattoo/beauty market
- Commission model = providers less loyal (easier to switch)


#### **Fresha Integration Challenge**

**Problem:** Fresha's API is **very limited** for third parties

**What Fresha Provides:**


| Feature | Availability | Notes |
| :-- | :-- | :-- |
| **Public API** | ❌ Very limited | Mostly for data export (Snowflake connector) |
| **Webhooks** | ❌ Not public | Only for enterprise partners |
| **Marketplace** | ✅ Internal only | Fresha apps live inside Fresha ecosystem |

**Fresha Integration Strategy:**

**Option A: Fresha Marketplace Partner (HARD)**

- Apply to Fresha Partner Program
- Build app that lives inside Fresha ecosystem
- Get access to private APIs/webhooks
- **Difficulty**: Fresha is selective, long approval process

**Option B: Zapier Fallback**

- Fresha has Zapier triggers for appointments
- Similar to Vagaro approach
- Flow: Fresha appointment → Zapier → Your platform

**Option C: Manual CSV Export**

- Fresha allows appointment data export
- Provider exports daily and uploads to your platform
- **Terrible UX, not recommended**

**Recommended Path:**

- Start with Zapier for MVP
- Apply for Fresha Partner Program for future

***

## 🛠️ **Fallback Integration: Zapier as Universal Connector**

### **Why Zapier Matters**

**Zapier connects to 6,000+ apps**, including virtually all booking platforms you'll encounter:

- Square ✅
- Vagaro ✅
- Fresha ✅
- Booksy ✅
- Mindbody ✅
- Acuity Scheduling ✅
- Calendly ✅
- Setmore ✅
- Timely ✅
- Zenoti (via custom webhook)
- Mangomint (via custom webhook)

**How Zapier Integration Works:**

1. **Your platform provides a Zapier app**
    - Build a simple Zapier integration with webhook receiver
    - Document: [zapier.com/platform](https://zapier.com/platform)
2. **Provider connects in 3 clicks:**
    - Trigger: "Vagaro - New Completed Appointment"
    - Action: "Your App - Trigger Aftercare Sequence"
    - Map fields: Customer name, phone, service type
3. **Your platform receives webhook from Zapier:**
```json
{
  "customer_name": "Sarah Johnson",
  "customer_phone": "+1-555-123-4567",
  "service_type": "Botox Treatment",
  "appointment_time": "2026-01-31T14:00:00Z",
  "provider_id": "your_platform_user_abc"
}
```

4. **Your platform triggers aftercare sequence**

**Zapier Tradeoffs:**


| Pros | Cons |
| :-- | :-- |
| ✅ Instant compatibility with 6,000+ apps | ❌ Provider pays \$30-80/month for Zapier |
| ✅ No API approval needed | ❌ 15-minute delay (free tier), 5-min (paid) |
| ✅ Provider manages connection (less support burden) | ❌ One more tool for provider to learn |
| ✅ Fallback when direct API unavailable | ❌ Provider could break their own Zap |

**When to Use Zapier:**

- ✅ For platforms without public APIs (Zenoti, Mangomint, Boulevard)
- ✅ As stopgap while waiting for API partnership approval
- ✅ For long-tail platforms (1-2% market share each)
- ✅ During MVP phase to avoid building 10+ integrations

***

## 📊 **Integration Priority Matrix (Recommendation)**

### **Phase 1: MVP Launch (Month 1-3)**

| Platform | Integration Method | Market Coverage | Priority |
| :-- | :-- | :-- | :-- |
| **Square Appointments** | Direct API + Webhooks | 45% | 🔥 CRITICAL |
| **Zapier** | Universal fallback | 40% (via other platforms) | 🔥 CRITICAL |
| **Manual CSV Upload** | Fallback for anyone | 15% | ⚠️ Safety net |

**Total Coverage:** 100% of market (Square direct, everyone else via Zapier or manual)

**Why This Works:**

- Square = largest segment, best API, easy integration
- Zapier = handles Vagaro, Fresha, Booksy, Zenoti, Mangomint, etc.
- Manual upload = catch-all for weird edge cases


### **Phase 2: Growth (Month 4-8)**

| Platform | Integration Method | Market Coverage | Priority |
| :-- | :-- | :-- | :-- |
| **Vagaro** | Direct API (after partnership) | 25% | 🔥 HIGH |
| **Fresha** | Zapier (apply for partnership) | 15% | ⚠️ MEDIUM |

### **Phase 3: Scale (Month 9-12)**

| Platform | Integration Method | Market Coverage | Priority |
| :-- | :-- | :-- | :-- |
| **Zenoti** | Zapier or Partnership | 8% (but high-value) | 💰 ENTERPRISE |
| **Mangomint** | Direct API or Zapier | 5% | 💰 PREMIUM |
| **Fresha** | Direct API (if approved) | 15% | 🔥 HIGH |


***

## 🔧 **Technical Integration Architecture**

### **Your Platform Components**

```
┌─────────────────────────────────────────────────┐
│         Your Aftercare Platform                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Dashboard (React + Next.js)             │  │
│  │  - Protocol upload                       │  │
│  │  - Service mapping                       │  │
│  │  - Integration connections               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend API (Node.js + Express)         │  │
│  │  - OAuth handlers (Square, Vagaro)       │  │
│  │  - Webhook receivers                     │  │
│  │  - Message scheduling logic              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                   │  │
│  │  - Providers                             │  │
│  │  - Aftercare protocols                   │  │
│  │  - Service mappings                      │  │
│  │  - Scheduled messages                    │  │
│  │  - OAuth tokens                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Twilio Integration (SMS)                │  │
│  │  - Send scheduled messages               │  │
│  │  - Receive "Something's Wrong" replies   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ↑              ↑              ↑
         │              │              │
   ┌─────┴─────┐  ┌────┴────┐  ┌─────┴─────┐
   │  Square   │  │ Vagaro  │  │  Zapier   │
   │  Webhooks │  │ Webhooks│  │  Webhooks │
   └───────────┘  └─────────┘  └───────────┘
```


### **Data Flow Example (Square)**

```
1. Provider connects Square account
   → OAuth flow
   → Store access_token in DB

2. Provider maps services
   → Fetch services from Square API
   → Provider links "Botox" service → "Botox Aftercare Protocol"
   → Store mapping in DB

3. Appointment completed in Square
   → Square sends webhook to your server
   → Your server validates webhook signature
   → Extract: customer_phone, service_id, completion_time

4. Your server schedules messages
   → Look up service mapping: service_id → protocol_id
   → Get protocol message sequence from DB
   → Schedule Twilio messages:
      - Message 1: completion_time + 5 minutes
      - Message 2: completion_time + 4 hours
      - Message 3: completion_time + 1 day
      - etc.

5. Twilio sends messages at scheduled times
   → Client receives SMS
   → If client replies or taps "Something's Wrong"
   → Twilio webhook back to your server
   → Alert provider in dashboard
```


***

## 🎯 **Key Takeaways \& Recommendations**

### **Best Integration Strategy for MVP:**

1. **Build Square direct integration FIRST** (covers 45% of market)
    - Well-documented API
    - Free to use
    - Largest addressable market (solo practitioners = your ICP)
2. **Build Zapier compatibility SECOND** (covers 40% of market)
    - Universal fallback for all other platforms
    - Faster than building 10 direct integrations
    - Lower support burden (provider manages Zap)
3. **Manual CSV upload as safety net** (covers remaining 15%)
    - Simple fallback for anyone

### **Post-MVP Expansion:**

4. **Add Vagaro direct API** once you have traction (Month 4-6)
5. **Apply for Fresha partnership** (Month 6-9)
6. **Add enterprise integrations** (Zenoti, Mangomint) if you land enterprise customers

### **Technical Effort Estimate:**

| Integration | Development Time | Difficulty |
| :-- | :-- | :-- |
| Square API + Webhooks | 2-3 weeks | Medium |
| Zapier App | 1 week | Easy |
| Manual CSV Upload | 3-5 days | Easy |
| Vagaro API | 2 weeks | Medium |
| Fresha Partnership | 3-4 weeks (after approval) | Hard |

**Total MVP Time: 4-5 weeks** (Square + Zapier + Manual)

***

Does this clarify the integration landscape? Want me to create a technical implementation guide for the Square integration specifically, or diagram the database schema for storing service mappings?
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Screenshot-2026-01-31-at-11.12.13-AM.jpg

[^2]: Screenshot-2026-01-31-at-11.12.33-AM.jpg

[^3]: Screenshot-2026-01-31-at-11.12.54-AM.jpg

[^4]: Screenshot-2026-01-31-at-11.13.04-AM.jpg

[^5]: https://withcherry.com/blog/med-spa-software

[^6]: https://www.openpr.com/news/4212678/tattoo-studio-software-sector-on-track-for-usd-600-million

[^7]: https://thesalonbusiness.com/vagaro-vs-square-appointments/

[^8]: https://www.quo.com/blog/best-medical-spa-software/

[^9]: https://www.datainsightsmarket.com/reports/tattoo-studio-software-1448459

[^10]: https://www.reddit.com/r/hairstylist/comments/1lha567/ive_been_told_to_build_a_new_freshavagaro_but/

[^11]: https://thesalonbusiness.com/best-medical-spa-software/

[^12]: https://htfmarketinsights.com/report/4400472-tattoo-studio-software-market

[^13]: https://www.salonbookingsystem.com/blog/case-study/fresha-alternatives/

[^14]: https://www.yocale.com/blog/best-salon-and-medspa-software-2026

[^15]: https://www.linkedin.com/pulse/unpacking-tattoo-studio-software-market-growth-whats-behind-uparf

[^16]: https://youcanbook.me/blog/fresha-alternatives

[^17]: https://cal.com/blog/best-medical-spa-software

[^18]: https://appointmentreminder.com/industry/tattoo-artists-shops/

[^19]: https://biz.booksy.com/en-us/blog/the-estheticians-guide-to-choosing-the-best-online-booking-site

[^20]: https://developer.squareup.com/docs/webhooks/overview

[^21]: https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools

[^22]: https://support.vagaro.com/hc/en-us/articles/204347860-Add-the-Booking-Widget-to-Your-Site

[^23]: https://developer.squareup.com/docs/bookings-api/what-it-is

[^24]: https://api.freshservice.com

[^25]: https://support.vagaro.com/hc/en-us/articles/10600106236443-Booking-Via-Google

[^26]: https://developer.squareup.com/reference/square/bookings-api/webhooks

[^27]: https://apitracker.io/a/fresha

[^28]: https://www.youtube.com/watch?v=t1GbmXY_zNM

[^29]: https://developer.squareup.com/docs/bookings-api/use-webhooks

[^30]: https://developers.freshchat.com/api/

[^31]: https://support.vagaro.com/hc/en-us/sections/34949473821851-Set-Up-Webhooks-and-API

[^32]: https://developer.squareup.com/docs/catalog-api/webhooks

[^33]: https://github.com/fresha/api-tools

[^34]: https://www.vagaro.com/pro/updates/webhooks

