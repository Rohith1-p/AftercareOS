# AftercareOS — Design System & Dashboard Spec

**Version:** 1.0
**Date:** May 24, 2026
**Source:** Extracted from aftercareos.com landing page + dashboard product design

---

## 1. COLOR PALETTE

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary Accent | Vibrant Orange | `#FF6B35` | Buttons, CTAs, highlights, checkmarks, active states |
| Background Gradient Start | Soft Peach | `#FFF5F0` | Page background top |
| Background Gradient End | Pale Pink | `#FFF0F5` | Page background bottom |
| Primary Text | Black | `#000000` | Headings, important labels |
| Secondary Text | Gray | `#666666` | Subheadings, descriptions, metadata |
| Card/Section Background | White | `#FFFFFF` | Cards, panels, content areas |
| Success/On Track | Green | `#4CAF50` | Positive status indicators, completed states |
| Alert/Concern | Coral Red | `#FF5252` | "Something's Wrong" button, concern alerts, urgent items |
| Pending/Scheduled | Light Orange | `#FF9F6B` | Pending messages, scheduled items |
| Border/Divider | Light Gray | `#E0E0E0` | Card borders, dividers, table rows |

### CSS Variables
```css
:root {
  --color-primary: #FF6B35;
  --color-primary-light: #FF9F6B;
  --color-primary-dark: #E55A25;
  --color-bg-start: #FFF5F0;
  --color-bg-end: #FFF0F5;
  --color-text-primary: #000000;
  --color-text-secondary: #666666;
  --color-surface: #FFFFFF;
  --color-success: #4CAF50;
  --color-danger: #FF5252;
  --color-border: #E0E0E0;
}
```

---

## 2. TYPOGRAPHY

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Page Title | Inter / Poppins | Bold | 28-32px | #000000 |
| Section Heading | Inter / Poppins | SemiBold | 20-24px | #000000 |
| Card Title | Inter / Poppins | SemiBold | 16-18px | #000000 |
| Body Text | Inter / Poppins | Regular | 14-16px | #000000 |
| Secondary/Meta | Inter / Poppins | Regular | 12-14px | #666666 |
| Button Text | Inter / Poppins | SemiBold | 14-16px | #FFFFFF (on orange) |
| Status Label | Inter / Poppins | Medium | 12px | varies by status |

---

## 3. BUTTON STYLES

### Primary Button (Orange)
- Background: `#FF6B35`
- Text: `#FFFFFF`
- Border radius: 8-12px
- Padding: 12px 24px
- Hover: `#E55A25` (slightly darker orange)
- Font weight: SemiBold
- Use: "Join Waitlist", "Add Client", "Send Message", "Save"

### Secondary Button
- Background: `#FFFFFF`
- Text: `#FF6B35`
- Border: 2px solid `#FF6B35`
- Border radius: 8-12px
- Padding: 10px 22px
- Hover: background `#FFF5F0`
- Use: "Edit", "Preview", "Cancel"

### Status Buttons
- **Concern/Alert**: Background `#FF5252`, text white, icon ⚠️
- **On Track**: Background `#4CAF50`, text white, icon ✅
- **Pending**: Background `#FF9F6B`, text white, icon 📍

---

## 4. CARD STYLES

- Background: `#FFFFFF`
- Border radius: 12-16px
- Box shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Padding: 20-24px
- Hover: `0 4px 16px rgba(0,0,0,0.12)` (subtle lift)
- Border: none (shadow provides depth)

---

## 5. DASHBOARD LAYOUT

### Structure
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)  │  MAIN CONTENT        │
│                          │                       │
│  ◆ AftercareOS           │  [Page Title]         │
│  ─────────────           │  ─────────────        │
│  📊 Dashboard            │                       │
│  👥 Clients              │  [Content cards]      │
│  📋 Protocols            │                       │
│  💬 Messages             │                       │
│  ⭐ Reviews              │                       │
│  ⚙️ Settings             │                       │
│                          │                       │
│  ─────────────           │                       │
│  [Upgrade Plan]          │                       │
└─────────────────────────────────────────────────┘
```

### Sidebar
- Background: `#FFFFFF` or subtle gradient from landing page
- Active item: Orange left border + orange text
- Hover: `#FFF5F0` background
- Logo at top: ◆ AftercareOS in orange

---

## 6. DASHBOARD SCREENS

### Screen 1: Main Dashboard (Home)
The first thing a practitioner sees after logging in.

**Top Stats Row (3 cards):**
- Active Clients (count) — orange icon
- Messages Sent Today (count) — orange icon
- Open Concerns (count, red if >0) — red icon

**Main Content (2 columns):**

Left column (wider):
- **Concern Alerts Panel** — red bordered card, shows clients who need attention
  - Client name, procedure, message snippet, time
  - Actions: Reply, Escalate, Dismiss
  - Empty state: "No concerns right now — everything's on track ✅"

- **Recent Messages** — list of latest client messages
  - Client avatar, name, message preview, time
  - Badge: "AI Auto-replied" or "Needs response"

Right column (narrower):
- **Upcoming Messages** — next messages scheduled to send
  - Date/time, client, message preview
  - Can edit or pause individual messages

- **Completing This Week** — clients finishing aftercare
  - Client name, procedure, completion date
  - Actions: "Request Review", "Send Rebooking"

### Screen 2: Clients List
- Search bar at top
- Filter tabs: All | Active | Concern | Completed
- Table columns: Name, Procedure, Day #, Last Contact, Status
- Status badges: 🟢 On Track, 🔴 Concern, 🟡 Pending, ⚪ Completed
- Click row → opens Individual Client View
- Bulk actions: Send message, Export

### Screen 3: Individual Client View
- Header: Client name, procedure, start date, current day #
- **Message Timeline** (vertical):
  - ✅ Sent messages (green checkmark)
  - 📍 Next message (orange, editable)
  - ○ Future scheduled messages (gray)
  - Each shows: date, time, message text
- **Conversation Thread** (below timeline):
  - Two-way SMS history
  - Auto-replies labeled as such
  - AI concern flags highlighted in orange
  - Reply input at bottom

### Screen 4: Protocols Manager
- Grid of protocol cards (Botox, Filler, Tattoo, etc.)
- Each card shows: name, message count, duration, last edited
- Actions: Edit, Preview, Duplicate, Delete
- **Protocol Editor** (when editing):
  - Visual timeline of messages
  - Drag to reorder
  - Click message to edit text/timing
  - "Add Message" button at any point
  - Preview panel showing how it looks on phone
- **AI Upload**: Upload PDF → AI parses into protocol
  - Shows parsed result for review/editing before saving

### Screen 5: Messages / Inbox
- All client conversations in one view
- Left: conversation list (name, last message, unread badge)
- Right: conversation thread
- Filters: All | Needs Response | Auto-Handled
- "Something's Wrong" messages highlighted in red

### Screen 6: Reviews
- Review request tracking
- Sent / Opened / Clicked / Completed
- Google review link generation
- Review response templates

### Screen 7: Settings
- **Business Profile**: Name, logo, phone number, address
- **SMS Setup**: Twilio configuration, test message
- **Integrations**: Square, Fresha, Zapier connection status
- **Team Members**: Add/remove staff, role permissions
- **Notifications**: Alert preferences (email, SMS for concerns)
- **Billing**: Plan details, usage, upgrade

---

## 7. MOBILE RESPONSIVE

- Dashboard is primarily desktop (practitioners use laptops/tablets)
- Mobile view: sidebar collapses to hamburger menu
- Client conversation view works well on mobile (like iMessage)
- Concern alerts send push notifications to phone
- No client-facing mobile app needed — clients receive SMS only

---

## 8. EMPTY STATES

For when there's no data yet (new user onboarding):

| Screen | Empty State |
|--------|------------|
| Dashboard | "Welcome! Add your first client to get started" + orange CTA |
| Clients | "No clients yet. Add one manually or connect your booking system" |
| Protocols | "Start with a built-in template or upload your existing aftercare PDF" |
| Messages | "Messages will appear here once clients are in active aftercare" |
| Reviews | "Review requests are sent automatically when aftercare completes" |

---

## 9. DESIGN PRINCIPLES

1. **Warm, not clinical** — Orange palette, soft gradients. This is aesthetics, not hospital software.
2. **Scannable, not dense** — Solo injectors are busy. Dashboard should be glanceable in 5 seconds.
3. **Action-oriented** — Every screen has a clear primary action (orange button).
4. **Calm during chaos** — Concern alerts are prominent but not panic-inducing. Red for alerts, orange for everything else.
5. **Mobile-first messaging** — The core interaction is SMS. Dashboard manages it; clients never see the dashboard.
6. **Less is more** — We're not an EMR. We do aftercare messaging and we do it perfectly. No feature bloat.

---

## 10. COMPONENT LIBRARY REFERENCE

For implementation, use:
- **UI Framework:** Tailwind CSS (fast, customizable)
- **Component Base:** shadcn/ui (clean, accessible, customizable)
- **Icons:** Lucide React (consistent, clean)
- **Charts:** Recharts (for analytics if added later)

### Tailwind Custom Colors
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF5F0',
          100: '#FFE8DB',
          200: '#FFD1B7',
          300: '#FFB893',
          400: '#FF9F6B',
          500: '#FF6B35',  // Primary
          600: '#E55A25',
          700: '#CC4A18',
          800: '#993812',
          900: '#66270C',
        }
      }
    }
  }
}
```

---

*This design system is a living document. Update as the product evolves.*
