# Build Tracker
## Community Hero — Hyperlocal Problem Solver
**Last updated:** 26 June 2026
**Deadline:** 29 June 2026, 2:00 PM
**Days remaining:** 3

---

## Overall Progress

```
Foundation        ██████████  100%  Firebase + Express + Auth + Rules deployed
Core Flow         ██████████  100%  Ticket create, status, assignment, upvote, reopen
AI Features       █████████░   90%  Gemini 14 touchpoints, Translate, QueryBot
Citizen UI        █████████░   90%  Home, Report flow, My Tickets, Map, Leaderboard, Profile
Officer UI        ████████░░   80%  Dashboard, Queue, Queries, Performance
Admin UI          ████████░░   80%  Overview, Unassigned, All Tickets, Staff, Map, Reports, Predictions
Workers           ██████████  100%  SLA, Ghost, Predict, VerifyTimeout
Design System     ████████░░   80%  Civic palette enforced; three-panel layout pending
Seed Data         ██████████  100%  8 tickets with photos, gamification, departments, officers
```

---

## Backend

### Core
- [x] Express server with CORS, rate limiting, error handling
- [x] Firebase Admin SDK initialised with service account
- [x] Auth middleware (JWT verification, role claims)
- [x] Ticket schema with Zod validation
- [x] Public ticket IDs: `KOL-YYYY-NNNNN`

### Routes
- [x] `POST /api/tickets` — create ticket with AI classify
- [x] `PATCH /api/tickets/:id/assign` — officer assignment
- [x] `PATCH /api/tickets/:id/status` — status update
- [x] `POST /api/tickets/:id/upvote` — community upvote
- [x] `POST /api/tickets/:id/reopen` — ghost re-report
- [x] `POST /api/tickets/:id/rate` — citizen rating
- [x] `POST /api/tickets/:id/query` — QueryBot (Gemini function calling)
- [x] `POST /api/ai/classify` — photo classify
- [x] `POST /api/ai/validate-resolution` — before/after compare
- [x] `POST /api/ai/generate-rti` — RTI PDF
- [x] `POST /api/ai/predict` — ward prediction
- [x] `POST /api/ai/translate` — EN/HI/BN
- [x] `GET /api/analytics/overview` — admin stats
- [x] `GET /api/analytics/departments` — dept performance
- [x] `GET /api/analytics/trends` — monthly trends
- [x] Auth routes (set custom claims)
- [x] Staff routes (officer CRUD)

### Services
- [x] Gemini service (2.0 Flash, 14 prompts)
- [x] Translate service (Google Cloud Translation API)
- [x] Notify service (WhatsApp/email — gated on env keys)
- [x] Storage service (Firebase Storage upload)
- [x] PDF service (RTI document generation)
- [x] Geocode service (OpenStreetMap Nominatim)
- [x] Query functions (Gemini function calling tools)

### Workers
- [x] SLA worker — auto-escalate + RTI on breach
- [x] Ghost worker — AI ghost detection after RESOLVED
- [x] Predict worker — weekly ward prediction
- [x] Verify timeout worker — 7-day ghost window close

### Seed Data
- [x] 8 realistic Kolkata tickets with Unsplash photos
- [x] 5 departments
- [x] 5 officers (Rajesh Kumar, Suresh Babu, etc.)
- [x] Gamification entries for seeded citizens
- [x] Ward stats
- [x] Counters
- [x] AI predictions

---

## Frontend

### Foundation
- [x] React 18 + Tailwind CSS + Firebase
- [x] Civic design system (tailwind.config.js): `civic #C13B2A`, `concrete-bg #F5F3F0`, `predicted #6B50B8`
- [x] JetBrains Mono for ticket IDs; Inter for UI
- [x] `LanguageContext` + `LanguageSelector` (EN/HI/BN)
- [x] Pre-translated STRINGS for landing; `translations.js` for inner pages
- [x] Firestore rules deployed (allow read: if true on tickets)

### Shared Components
- [x] `Navbar` — Tabler icons, active state, LanguageSelector, civic tokens
- [x] `StatusBadge` — 4px radius, semantic 10%-bg colors, status dot, no raw Tailwind
- [x] `TicketCard` — mono ID, SLA bar, ◆ AI confidence, Tabler icons, hairline border
- [x] `LoadingSpinner` — civic red, not blue
- [x] `LanguageSelector` — EN/हिंदी/বাংলা pill toggle
- [x] `StatusBadge`, `SLACountdown`, `PhotoViewer`, `ConfirmModal`

### Pages — Citizen
- [x] Landing — video background, Instrument Serif headline, EN/HI/BN STRINGS
- [x] Login — civic theme, Google + email, demo credentials
- [x] Citizen Home — concrete-bg, community feed, my reports, civic red CTA
- [x] Report flow (5 steps) — photo → AI review (purple AI badge) → location → contact → submit
- [x] My Tickets — list with TicketCard
- [x] Public Tracker — timeline, QueryBot (purple AI frame), evidence/ghost tabs, civic theme
- [x] Community Map (OpenStreetMap/Leaflet)
- [x] Leaderboard
- [x] Profile

### Pages — Officer
- [x] Officer Dashboard — stats, queue preview
- [x] My Queue — ticket list with filters
- [x] Queries Inbox
- [x] Performance charts (Recharts — semantic palette)
- [ ] Three-panel shell (slide-in detail panel) — **PENDING**

### Pages — Admin
- [x] Admin Overview — newspaper-style metric strip, civic red CTA, semantic Recharts
- [x] Unassigned Queue
- [x] All Tickets
- [x] Staff Management
- [x] Ward Map
- [x] Reports
- [x] AI Predictions (purple surface)
- [ ] Three-panel shell — **PENDING**

---

## Design System Enforcement (Audit Actions)

- [x] **C1** — Civic palette in tailwind.config.js; removed `brand-purple/brand-dark`; added `surface`, `border`, `info` tokens
- [x] **C1** — `index.html` theme-color fixed to `#C13B2A` (was Google blue `#1A73E8`)
- [x] **C1** — `index.css` scrollbar warm concrete; focus ring civic red
- [x] **C3** — `StatusBadge` rebuilt: 4px radius, semantic bg/text, dot, no raw Tailwind
- [x] **C3** — `TicketCard` rebuilt: mono ID, SLA bar, ◆ AI marker, hairline borders
- [x] **C3** — `Navbar` rebuilt: Tabler icons, Tailwind civic tokens, active state, keyboard-accessible
- [x] **C3** — `LoadingSpinner` rebuilt: civic red (was blue-500)
- [x] **C4** — Tabler icons installed; Navbar and TicketCard fully iconified
- [x] **C5** — `Step2AIReview`: AI badge now purple `#6B50B8`, confidence bar green/amber/red (never blue)
- [x] **C5** — `PublicTracker`: QueryBot frame purple, AI classification purple, no blue
- [x] **C6** — Build tracker updated to reflect actual ~90% completion

### Remaining (Important / Not Critical for Hackathon)
- [ ] **I1** — Three-panel officer/admin shell with slide-in detail panel
- [ ] **I2** — Remaining pages: UnassignedQueue, AllTickets, Staff, Predictions — blue→civic sweep
- [ ] **I3** — Replace emoji in Profile, MyTickets, officer/admin pages with Tabler icons

---

## Environment & Config

- [x] Frontend `.env` — Firebase config (all 6 values)
- [x] Backend `.env` — Gemini, Firebase Admin, Translate API, optional Twilio/email
- [x] `firebase.json` + `.firebaserc` — project: `community-hero-fc07d`
- [x] Firestore security rules deployed via Firebase CLI

---

## Known Issues / Blockers

- **Notifications (WhatsApp/email)** — `notifyService.js` exists; TWILIO_ACCOUNT_SID / EMAIL_USER empty in .env; calls silently no-op
- **My Reports always 0** — citizen's Google UID ≠ seeded fake `citizen_arjun_001` etc. Use Community Feed to see seeded data
- **Three-panel layout** — not yet implemented; officer/admin use full-page navigation per screen
