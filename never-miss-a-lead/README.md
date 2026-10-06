# /never-miss-a-lead — "Never Miss a Lead" Services Landing Page

Service brand: **Never Miss a Lead, by AftercareOS** (nav = service name, AftercareOS
corner mark top-left, footer links back to aftercareos.com). Outbound points here so
outbound (emails, DMs, audit-call follow-ups) can point at a real, premium web presence.
Live URL once deployed: `https://aftercareos.com/never-miss-a-lead/`

## Page flow (top to bottom)
1. Hero: "Improve your business or don't miss your leads." + iPhone-style SMS demo
   (Dynamic Island, iOS status bar, iMessage bubbles) of a missed call becoming a booking
2. Flywheel trio: Happy clients -> More bookings -> More referrals
3. Stats band: 1 in 4 calls missed, $1,500+ patient LTV, 80% dial the next practice
4. **Animated review-growth chart**: reviews/mo from 12 at onboarding to 214 at month 4
   (+1,680% badge); SVG curve draws itself on scroll into view
5. Two service cards: AI Receptionist, Review Automation (+ what every install includes)
6. How it works: audit -> build (<7 days) -> weekly lead report
7. Month-one guarantee: 3 booked appointments or month 2 free
8. Pricing: Standard $397 / Plus $497 (popular) / Pro $797
9. FAQ (robot voice, keep your number, speed, privacy)
10. Lead form: name, practice, phone, email

## Lead form -> Supabase
Posts to the SAME `Waitlist` table the main site uses (no new table, no schema change):
- `email` -> email
- `bookingSystem` -> practice name (column reuse)
- `segment` -> phone (column reuse)
- `source` = `never-miss-a-lead` (filter on this to separate these leads)

## Deploy
Static file, no build step. Repo: `~/AftercareOS` (public-site remote -> Rohith1-p/AftercareOS -> GitHub Pages).
```
git add improve-your-business/ && git commit -m "Add /improve-your-business services landing page" && git push origin main
```
Live in ~1 min via Pages.

## BLOCKER (as of Oct 5, 2026)
The Supabase project (`rtpouxildqvtkvyvobdv`) is DNS-dead = project auto-paused.
Form submissions fail until Rohith restores it in the supabase.com dashboard.
This also breaks the MAIN site's waitlist forms, not just this page.
After restore: re-test the form (label a test row clearly, delete it after).

## Local preview
`cd ~/AftercareOS && python3 -m http.server 8091` then open `http://localhost:8091/never-miss-a-lead/`
