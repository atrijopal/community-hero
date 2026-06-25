# Build Tracker
## Community Hero — Hyperlocal Problem Solver
**Last updated:** 24 June 2026
**Deadline:** 29 June 2026, 2:00 PM
**Days remaining:** 5

---

## How to Use This Tracker

Update this file every time something is built, changed, or blocked. Claude reads this at the start of every session to know exactly where things stand. Format for updates:

- Mark done items with `[x]`
- Mark in-progress items with `[~]`
- Mark blocked items with `[!]`
- Mark not started with `[ ]`
- Add a date and note next to any item that changed

---

## Overall Progress

```
Foundation        ████████░░  80%   Firebase + Express + Auth working
Core Flow         ████░░░░░░  40%   Ticket create works, no AI yet
AI Features       ░░░░░░░░░░   0%   Not started
Citizen UI        ██░░░░░░░░  20%   Landing page only
Officer UI        ░░░░░░░░░░   0%   Not started
Admin UI          ░░░░░░░░░░   0%   Not started
Workers           ░░░░░░░░░░   0%   Not started
Tests             ░░░░░░░░░░   0%   Not started
Deployment        ░░░░░░░░░░   0%   Not started
```

---

## Phase 1 — Project Setup & Foundation

### Environment & Config
- [ ] Project folder scaffolded (`/frontend`, `/backend`)
- [ ] `frontend/` — React app created with `create-react-app`
- [ ] `backend/` — Node.js + Express initialized
- [ ] All npm packages installed (see tech impl guide Section 1.2)
- [ ] Tailwind CSS configured
- [ ] `.env` file created with all keys
- [ ] `.env.example` committed
- [ ] `.gitignore` in place
- [ ] GitHub repo created and initial commit pushed

### Firebase Setup
- [ ] Firebase project created at console.firebase.google.com
- [ ] Firestore enabled (production mode)
- [ ] Firebase Authentication enabled
  - [ ] Google Sign-In provider enabled
  - [ ] Email/Password provider enabled
- [ ] Firebase Storage enabled (production mode)
- [ ] Firebase Cloud Messaging enabled
- [ ] `firebase.js` (client SDK) written
- [ ] `backend/config/firebase.js` (Admin SDK) written
- [ ] Service account key downloaded and set in `.env`
- [ ] Firestore Security Rules deployed (`firestore.rules`)
- [ ] Firebase Storage Rules deployed (`storage.rules`)
- [ ] Firestore indexes deployed (`firestore.indexes.json`)

### Seed Data
- [ ] `backend/seed/departments.js` written
- [ ] `backend/seed/officers.js` written
- [ ] `backend/seed/admin.js` written
- [ ] `backend/seed/tickets.js` written (8 sample tickets)
- [ ] `backend/seed/gamification.js` written
- [ ] `backend/seed/predictions.js` written
- [ ] `backend/seed/wardStats.js` written
- [ ] `backend/seed/counters.js` written
- [ ] `backend/seed/index.js` (seed script) written
- [ ] Seed script run successfully — all data in Firestore

---

## Phase 2 — Backend Core

### Server & Middleware
- [ ] `backend/server.js` — Express app with CORS, Helmet, rate limiting
- [ ] `backend/middleware/authMiddleware.js` — Firebase JWT verification
- [ ] `backend/middleware/rateLimiter.js` — all 5 rate limiters
- [ ] `backend/middleware/validate.js` — Joi validation middleware
- [ ] `backend/middleware/uploadMiddleware.js` — Multer config
- [ ] `backend/services/storageService.js` — EXIF stripping + photo processing
- [ ] `backend/schemas/ticketSchema.js` — full validation schema

### Ticket Routes (`/api/tickets`)
- [ ] `POST /` — create ticket (with duplicate check + Gemini classify)
- [ ] `GET /:publicId` — public ticket view (masked fields)
- [ ] `PATCH /:id/assign` — admin assigns officer
- [ ] `POST /:id/resolution` — officer uploads proof + Gemini validates
- [ ] `POST /:id/reopen` — citizen ghost re-open
- [ ] `POST /:id/upvote` — Me Too / upvote
- [ ] `POST /:id/query` — NLP query bot (function calling version)
- [ ] `GET /` — list tickets (officer/admin, paginated, filtered)

### Auth Routes (`/api/auth`)
- [ ] `POST /officer` — admin creates officer account
- [ ] `POST /officer/:id/deactivate` — deactivate officer
- [ ] `POST /officer/:id/role` — set officer role
- [ ] `GET /me` — get own profile + role

### Staff Routes (`/api/staff`)
- [ ] `GET /officers` — list all officers (paginated)
- [ ] `GET /officers/:id` — officer profile + metrics
- [ ] `POST /officers` — create officer
- [ ] `PATCH /officers/:id` — edit officer
- [ ] `DELETE /officers/:id` — deactivate (soft delete)
- [ ] `GET /officers/assignable` — workload-balanced dropdown
- [ ] `GET /departments` — list departments
- [ ] `POST /departments` — create department

### Analytics Routes (`/api/analytics`) — NEW from changes.md
- [ ] `GET /overview` — city-wide stats
- [ ] `GET /departments` — department performance
- [ ] `GET /wards` — ward-wise statistics
- [ ] `GET /trends` — issue trends by month

### AI Service (`/api/ai`)
- [ ] `POST /classify` — Gemini photo classification

---

## Phase 3 — Gemini Integration

### Core Gemini Service
- [ ] `backend/services/geminiService.js` — base `callGemini()` with:
  - [ ] `responseMimeType: 'application/json'` enforced — NEW Feature 1
  - [ ] Quota tracker (daily 1400, minute 12)
  - [ ] Fallback on API failure
  - [ ] Image-to-base64 helper

### All 14 Gemini Touchpoints
- [ ] 1. `classifyIssue()` — photo → type, severity, dept, description
- [ ] 2. `scoreWeightedSeverity()` — context-aware severity scoring
- [ ] 3. `validateResolution()` — before/after photo comparison
- [ ] 4. `detectGhost()` — 3-image ghost detection (structured output) — NEW Feature 3
- [ ] 5. `detectDuplicate()` — same issue cross-check
- [ ] 6. `predictIssues()` — zone-level future issue prediction
- [ ] 7. `queryBot()` — function calling version — NEW Feature 2
- [ ] 8. `verifyIssue()` — community verification backup
- [ ] 9. `generateRTI()` — RTI document generation
- [ ] 10. `generateAppeal()` — first appeal generation
- [ ] 11. `generateDescription()` — one-line from photo
- [ ] 12. `routeDepartment()` — optimal department suggestion
- [ ] 13. `generateEscalationNote()` — escalation summary
- [ ] 14. `generateWardReport()` — monthly ward report

### All Prompt Files
- [ ] `backend/prompts/classify.js` — with `reasoning` field (renamed from `aiNotes`) — NEW Feature 5
- [ ] `backend/prompts/validateResolution.js`
- [ ] `backend/prompts/detectGhost.js` — structured verification report — NEW Feature 3
- [ ] `backend/prompts/detectDuplicate.js`
- [ ] `backend/prompts/queryBot.js` — replaced by function calling
- [ ] `backend/prompts/generateRTI.js`
- [ ] `backend/prompts/generateReport.js`
- [ ] `backend/prompts/predictIssues.js`

### Gemini Function Calling (Query Bot) — NEW Feature 2
- [ ] `backend/services/queryFunctions.js` written:
  - [ ] `get_ticket_details()` function definition + executor
  - [ ] `get_officer_status()` function definition + executor
  - [ ] `get_sla_status()` function definition + executor
  - [ ] `get_resolution_estimate()` function definition + executor
- [ ] `queryBot()` in geminiService replaced with function-calling version
- [ ] Multi-turn loop working (max 5 iterations)
- [ ] Tested end-to-end: citizen question → function calls → synthesized answer

---

## Phase 4 — Background Workers

- [ ] `backend/workers/slaWorker.js`
  - [ ] Day 7 reminder
  - [ ] Day 14 escalation
  - [ ] Day 30 RTI generation
  - [ ] Day 60 first appeal generation
  - [ ] SLA breach flag
  - [ ] `start()` exported and called in `server.js`

- [ ] `backend/workers/ghostWorker.js`
  - [ ] Geohash proximity query
  - [ ] Gemini 3-image comparison call
  - [ ] `reject_resolution` / `needs_review` / `accept_resolution` decision parsing — NEW Feature 3
  - [ ] Ghost count increment + officer penalty
  - [ ] Double penalty when override used
  - [ ] Auto-escalate after 3rd ghost
  - [ ] `start()` exported and called in `server.js`

- [ ] `backend/workers/predictWorker.js`
  - [ ] Zone history query
  - [ ] Gemini prediction call
  - [ ] Write to `predictions` collection
  - [ ] `start()` exported and called in `server.js`

- [ ] `backend/workers/verifyTimeoutWorker.js`
  - [ ] Timeout check after 2 hours
  - [ ] Gemini backup verification
  - [ ] Status update to VERIFIED or REJECTED
  - [ ] `start()` exported and called in `server.js`

---

## Phase 5 — Notification System

- [ ] `backend/services/notifyService.js` — all functions written:
  - [ ] `ticketCreated()`
  - [ ] `officerAssigned()`
  - [ ] `ticketResolved()`
  - [ ] `ghostDetected()`
  - [ ] `rtiReady()`
  - [ ] `escalated()`
  - [ ] `officerReminder()`
  - [ ] `appealReady()`
  - [ ] `adminGhostEscalation()`
  - [ ] `escalatedAfterFailedResolution()`

- [ ] WhatsApp (Twilio sandbox) — tested with real phone
- [ ] Email (nodemailer) — tested with real email
- [ ] FCM push — service worker registered in frontend
  - [ ] `frontend/public/firebase-messaging-sw.js` written
  - [ ] FCM token saved to `users/{uid}.fcmToken` on app load
  - [ ] Push notification shows in browser

---

## Phase 6 — Frontend Foundation

### App Setup
- [ ] `frontend/src/App.jsx` — root router with role-based routes
- [ ] `frontend/src/firebase.js` — Firebase client init
- [ ] `frontend/src/context/AuthContext.jsx` — auth provider
- [ ] `frontend/src/hooks/useAuth.js`
- [ ] `frontend/src/utils/api.js` — Axios instance with JWT interceptor
- [ ] `frontend/src/utils/constants.js` — all enums and constants
- [ ] Role guard component working (citizen / officer / admin)
- [ ] Login page — role selector (Citizen / Officer / Admin)
- [ ] Unauthorized page

### Shared Components
- [ ] `Navbar.jsx` — top bar with role indicator + bell icon
- [ ] `Sidebar.jsx` — left nav with role-specific links
- [ ] `NotificationPanel.jsx` — slide-in notification drawer
- [ ] `TicketCard.jsx` — primary card component
- [ ] `StatusBadge.jsx` — semantic status pill
- [ ] `SeverityBar.jsx` — 4px severity indicator with colors
- [ ] `SLACountdown.jsx` — time remaining with breach state
- [ ] `AIConfidenceIndicator.jsx` — ◆ marker + confidence bar — NEW Feature 5
- [ ] `PhotoViewer.jsx` — full-screen lightbox
- [ ] `ConfirmModal.jsx` — destructive action confirmation
- [ ] `LoadingSpinner.jsx`
- [ ] `CommunityMap.jsx` — OpenStreetMap + Leaflet with color pins

---

## Phase 7 — Public Landing Page

- [ ] Hero section — live stats counter (Firestore realtime)
- [ ] Report Issue form — 5-step flow:
  - [ ] Step 1: Photo upload with camera button
  - [ ] Step 2: AI suggestions form with ◆ badges + editable fields
  - [ ] Step 3: Map pin with OpenStreetMap + Nominatim geocoding
  - [ ] Step 4: Contact (optional)
  - [ ] Step 5: Submit + duplicate detection modal
- [ ] Ticket ID confirmation screen
- [ ] Public ticket tracker (`/track/:id`)
  - [ ] Status timeline
  - [ ] Officer name displayed
  - [ ] NLP query bot
  - [ ] Me Too upvote
  - [ ] Ghost re-open button (7 days after resolve)
  - [ ] RTI draft button (Day 30+)
- [ ] Community map (read-only, color-coded pins)
- [ ] Civic Health Score grid (public, A–F)
- [ ] Role login selector dropdown in navbar
- [ ] Resolution Evidence Report Card — NEW Feature 4
- [ ] Ghost Detection Report Card — NEW Feature 3

---

## Phase 8 — Citizen Dashboard

- [ ] Home feed
  - [ ] My active tickets strip (Firestore realtime)
  - [ ] Nearby issues list
  - [ ] Gamification XP widget
  - [ ] Weekly ward challenge banner
- [ ] Report Issue page (same flow as landing page)
- [ ] My Tickets page
  - [ ] Filter bar (all / unassigned / in progress / resolved / escalated)
  - [ ] Ticket detail page — all 5 tabs:
    - [ ] Timeline tab
    - [ ] Officer tab
    - [ ] Photos tab (with evidence report card)
    - [ ] Ask tab (NLP bot with function calling)
    - [ ] Actions tab (context-aware buttons per status)
  - [ ] RTI auto-draft flow
  - [ ] Ghost re-open flow (with photo upload)
  - [ ] Resolution rating (1–5 stars)
- [ ] Community map page (citizen view with predictions layer)
- [ ] Leaderboard page (4 tabs: reporters / verifiers / ghost busters / authority)
- [ ] Profile page
  - [ ] XP bar + level display
  - [ ] Badge grid
  - [ ] Impact stats
  - [ ] Notification preferences
  - [ ] Language selector (EN / HI / BN)
  - [ ] Share impact card (WhatsApp)

---

## Phase 9 — Officer Dashboard

- [ ] Overview dashboard (stats row + active cases + query inbox preview)
- [ ] My Queue page
  - [ ] Sort by SLA urgency
  - [ ] Filter by status / category / ward
  - [ ] Queue card with acknowledge / resolve buttons
- [ ] Ticket detail page (officer view) — 4 tabs:
  - [ ] Issue details tab (AI classification vs citizen edit, side by side)
  - [ ] Timeline & audit tab
  - [ ] Internal notes tab (private, lock icon)
  - [ ] Actions tab:
    - [ ] Acknowledge
    - [ ] Mark resolved (photo upload → Gemini validation)
    - [ ] Request reassignment
    - [ ] Request override
- [ ] Resolution upload flow
  - [ ] Gemini validation result display (pass / fail / rejection reason)
  - [ ] Evidence report card — NEW Feature 4
  - [ ] Retry flow (2 retries remaining indicator)
  - [ ] Override request form
- [ ] Queries inbox
  - [ ] 48-hour SLA per query
  - [ ] Quick reply templates
  - [ ] Full thread view
- [ ] Resolved cases page
  - [ ] Ghost flag alerts
  - [ ] Citizen rating display
- [ ] My performance page (all metrics + accountability score)

---

## Phase 10 — Admin Dashboard

- [ ] Overview page (city-wide stats from `/api/analytics/overview`)
- [ ] Unassigned queue (core assignment screen)
  - [ ] Sorted by AI severity
  - [ ] Assignment dropdown (workload-balanced, dept + ward filtered)
  - [ ] Officer row: name, designation, active cases, resolution rate
  - [ ] Assign + internal note + confirm flow
  - [ ] Bulk assign
- [ ] All tickets page
  - [ ] Filter by status / category / ward / officer / date / severity
  - [ ] Search by ticket ID
  - [ ] Export CSV
  - [ ] Admin actions on ticket (reassign, escalate, approve override)
- [ ] Staff management
  - [ ] Officer list table with accountability scores
  - [ ] Add officer form (Firebase Auth + Firestore write)
  - [ ] Edit / deactivate officer
  - [ ] Officer profile view (full metrics + admin notes)
  - [ ] Department management (SLA defaults, issue types, head officer)
- [ ] Ward map (admin view)
  - [ ] All pins visible
  - [ ] Heatmap toggle
  - [ ] Prediction markers
  - [ ] Unassigned filter
  - [ ] Ward boundary overlays
- [ ] Reports & analytics
  - [ ] Ward report generator (Gemini narrative)
  - [ ] Officer performance report
  - [ ] Trends chart (monthly reports vs resolved)
  - [ ] Department performance bar chart
- [ ] Predictions dashboard
  - [ ] Prediction cards with probability + reasoning
  - [ ] Convert to work order flow
  - [ ] Accuracy tracking
- [ ] System settings
  - [ ] SLA defaults per department (configurable)
  - [ ] Escalation timeline (Day 7 / 14 / 30 / 60)
  - [ ] Ghost detection sensitivity
  - [ ] Gemini confidence thresholds

---

## Phase 11 — New Features (from changes.md)

### Feature 1 — Gemini Structured Output
- [ ] `responseMimeType: 'application/json'` added to `callGemini()`
- [ ] All prompts updated with "Return ONLY valid JSON" instruction
- [ ] Tested: no markdown fences in any Gemini response

### Feature 2 — Gemini Function Calling
- [ ] `queryFunctions.js` written (4 functions)
- [ ] `queryBot()` replaced with function-calling version
- [ ] Tested: "Why is my ticket delayed?" → Gemini calls `get_ticket_details` + `get_sla_status` → answer
- [ ] Tested: "When will this be resolved?" → Gemini calls `get_resolution_estimate` → answer
- [ ] Multi-turn loop tested (max 5 iterations, no infinite loop)

### Feature 3 — Enhanced Ghost Detection
- [ ] `detectGhost.js` prompt updated (structured verification report)
- [ ] Output fields: `issue_still_present`, `confidence`, `decision`, `reason`, `comparison`
- [ ] Ghost worker updated to parse `decision` field (`reject_resolution` / `needs_review` / `accept_resolution`)
- [ ] `ghostReport` stored in `ticket_logs` metadata on ghost events
- [ ] Ghost report card shown on admin ticket detail

### Feature 4 — Resolution Evidence Report
- [ ] `evidenceReport` object built and stored on ticket after resolution
- [ ] Evidence report card shown on citizen ticket page (Photos tab) — approved only
- [ ] Evidence report card shown on officer ticket detail — includes rejection details
- [ ] Tested: approved resolution shows green card
- [ ] Tested: rejected resolution shows red card to officer, nothing to citizen

### Feature 5 — AI Confidence & Reasoning Layer
- [ ] `aiNotes` renamed to `reasoning` in classify prompt and schema
- [ ] `reasoning` stored in `tickets.aiSuggested.reasoning`
- [ ] Confidence bar shown in Step 2 AI Review form
- [ ] Reasoning text shown below confidence bar
- [ ] ◆ symbol color: purple (≥80%), blue (50–80%), amber (<50%)
- [ ] Confidence + reasoning shown in admin ticket classification tab

### Feature 7 — Admin Analytics (wire up)
- [ ] `backend/routes/analytics.js` written (4 endpoints)
- [ ] Analytics route mounted in `server.js`
- [ ] `frontend/src/hooks/useAnalytics.js` written (3 hooks)
- [ ] Admin overview page wired to `/api/analytics/overview`
- [ ] Department performance chart wired to `/api/analytics/departments`
- [ ] Ward stats grid wired to `/api/analytics/wards`
- [ ] Trends chart wired to `/api/analytics/trends`

---

## Phase 12 — Gamification

- [ ] XP award on ticket creation (`+50 XP`)
- [ ] XP award on report verified (`+30 XP`)
- [ ] XP award on report resolved (`+100 XP`)
- [ ] XP award on upvote (`+5 XP`)
- [ ] XP award on ghost catch (`+150 XP`)
- [ ] XP award on verification done (`+20 XP`)
- [ ] XP award on 7-day streak (`+200 XP`)
- [ ] XP award on RTI filed (`+75 XP`)
- [ ] Level computed from XP and stored
- [ ] Badge awarded — pothole_hunter (5 potholes)
- [ ] Badge awarded — light_keeper (3 streetlights)
- [ ] Badge awarded — ghost_buster (2 ghost catches)
- [ ] Badge awarded — monsoon_watch (3 waterlogging)
- [ ] Badge awarded — first_responder (first in ward)
- [ ] Badge awarded — rti_warrior (first RTI)
- [ ] Badge awarded — streak_master (14-day streak)
- [ ] Badge awarded — explorer (5 different zones)
- [ ] Streak counter increments daily
- [ ] Streak resets if no activity for >24 hours
- [ ] Leaderboard queries working (weekly + monthly + all-time)
- [ ] Weekly ward challenge generates contextually (monsoon = waterlogging)

---

## Phase 13 — Multilingual Support

- [ ] Google Translate API integrated in AI service
- [ ] Language auto-detect from citizen's input text
- [ ] NLP bot responds in citizen's preferred language
- [ ] UI language switcher (EN / HI / BN) — Citizen dashboard only
- [ ] Notifications sent in citizen's preferred language
- [ ] RTI document available in English and Hindi

---

## Phase 14 — Tests

### Backend Tests
- [ ] `backend/__tests__/setup.js` — all mocks configured
- [ ] `backend/__tests__/middleware/rateLimiter.test.js` (4 test suites)
- [ ] `backend/__tests__/middleware/authMiddleware.test.js` (8 tests)
- [ ] `backend/__tests__/routes/tickets.test.js` (19 tests)
- [ ] `backend/__tests__/routes/staff.test.js` (8 tests)
- [ ] `backend/__tests__/routes/analytics.test.js` — NEW Feature 7
- [ ] `backend/__tests__/services/geminiService.test.js` (8 tests + function calling)
- [ ] `backend/__tests__/services/storageService.test.js` (7 tests)
- [ ] `backend/__tests__/services/notifyService.test.js` (9 tests)
- [ ] `backend/__tests__/workers/slaWorker.test.js` (10 tests)
- [ ] `backend/__tests__/workers/ghostWorker.test.js` (8 tests + new decision field)
- [ ] `backend/__tests__/schemas/ticketSchema.test.js` (16 tests)
- [ ] `backend/__tests__/integration/ticketLifecycle.test.js` (7 tests)
- [ ] All backend tests passing: `npm test`
- [ ] Coverage ≥80% statements

### Frontend Tests
- [ ] `frontend/src/__tests__/setup.js` — all mocks configured
- [ ] `frontend/src/__tests__/context/AuthContext.test.jsx` (6 tests)
- [ ] `frontend/src/__tests__/hooks/useTicket.test.js` (8 tests)
- [ ] `frontend/src/__tests__/components/Step2AIReview.test.jsx` (9 tests)
- [ ] `frontend/src/__tests__/pages/PublicTracker.test.jsx` (8 tests)
- [ ] `frontend/src/__tests__/components/RoleGuard.test.jsx` (4 tests)
- [ ] All frontend tests passing: `npm test`

---

## Phase 15 — Deployment

- [ ] Frontend build: `cd frontend && npm run build`
- [ ] Build copied to `backend/public/`
- [ ] `server.js` updated to serve React app from `/public`
- [ ] All environment variables set in Google AI Studio
- [ ] Deployed via Google AI Studio → Publish → Get Started → Publish App
- [ ] Cloud Run URL received and tested
- [ ] `FRONTEND_URL` env variable updated with live URL
- [ ] Redeployed with correct FRONTEND_URL (CORS)
- [ ] Firestore + Storage rules re-deployed post-deployment
- [ ] Admin account custom claim set on live Firebase project
- [ ] Seed data run on live Firestore
- [ ] All 3 interfaces tested on live URL (incognito window)
- [ ] WhatsApp notification tested on live deployment
- [ ] Gemini API working on live (not just local)
- [ ] Ghost worker running on live deployment
- [ ] SLA worker running on live deployment

---

## Phase 16 — Submission Prep

- [ ] GitHub repo is public
- [ ] `README.md` written with:
  - [ ] Problem statement
  - [ ] Live demo URL
  - [ ] Tech stack
  - [ ] Setup instructions
  - [ ] Three login role credentials (admin / officer / citizen)
  - [ ] Demo ticket IDs
- [ ] Google Doc written with:
  - [ ] Problem Statement Selected: PS2
  - [ ] Solution Overview (2–3 paragraphs)
  - [ ] Key Features (all 14+ listed)
  - [ ] Technologies Used
  - [ ] Google Technologies Utilized (all 9 listed)
  - [ ] Demo credentials
- [ ] Google Doc sharing set to "Anyone with the link can view"
- [ ] All three submission items ready:
  - [ ] Deployed application URL
  - [ ] GitHub repository URL
  - [ ] Google Doc URL
- [ ] Submitted on BlockseBlock platform
- [ ] Submission confirmation screenshot taken
- [ ] Deadline: 29 June 2026, 2:00 PM ← DO NOT MISS

---

## Pre-Demo Checklist (run before judges see it)

- [ ] Open manhole ticket (KOL-2026-00149) — UNASSIGNED, severity 9
- [ ] Pothole ticket (KOL-2026-00142) — IN PROGRESS, assigned to Rajesh Kumar
- [ ] Broken light ticket (KOL-2026-00138) — RESOLVED, ghost window open
- [ ] Garbage ticket (KOL-2026-00133) — GHOST FLAGGED
- [ ] Waterlogging ticket (KOL-2026-00128) — ESCALATED
- [ ] Sewage ticket (KOL-2026-00101) — RTI FILED (33 days old)
- [ ] Waterlogging ticket (KOL-2026-00115) — CLOSED OVERRIDE
- [ ] Water leakage ticket (KOL-2026-00145) — ASSIGNED
- [ ] 3 predictions visible on map
- [ ] Arjun citizen account: Active Resident level, 4 badges, 7-day streak
- [ ] Priya citizen account: Civic Hero level, all 12 badges
- [ ] Admin can log in and see unassigned queue with ticket KOL-2026-00149 at top
- [ ] Officer (Rajesh Kumar) can log in and see KOL-2026-00142 in queue
- [ ] NLP bot working: type "why is my ticket delayed?" → function calling response
- [ ] Community map loads with colored pins
- [ ] Civic Health Score visible for Ward 82 (B+), Ward 83 (C+), Ward 84 (A-)

---

## Known Issues / Blockers

| Issue | Severity | Status | Notes |
|---|---|---|---|
| — | — | — | No issues logged yet |

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 24 Jun | OpenStreetMap over Google Maps | No billing account needed, free forever |
| 24 Jun | Feature 6 (benchmarking) skipped | Too much effort, include in Google Doc as roadmap item |
| 24 Jun | Twilio sandbox for WhatsApp | Free for hackathon dev, only limitation is approved numbers |

---

## Document Index

All documents generated for this project:

| File | Purpose | Status |
|---|---|---|
| `community_hero_prd_v2.md` | Full product requirements (v2.0) | Done |
| `community_hero_system_design.md` | System architecture + scalability | Done |
| `community_hero_tech_impl_guide.md` | Code + implementation guide | Done |
| `community_hero_user_flows.md` | All 3 interface flows + screens | Done |
| `community_hero_schema_guide.md` | Firestore schema + seed data | Done |
| `community_hero_new_changes.md` | Features 1,2,3,4,5,7 delta doc | Done |
| `community_hero_design_doc.md` | Visual design system | Done |
| `community_hero_build_tracker.md` | This file | Living doc |

---

*Update this file every time you build something. Tell Claude "update the tracker — X is done" and it will mark it.*
