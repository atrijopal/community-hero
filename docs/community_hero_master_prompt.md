# Master Build Prompt
## Community Hero — Hyperlocal Problem Solver
**For:** Any AI assistant or developer picking up this project
**Date:** June 2026
**Deadline:** 29 June 2026, 2:00 PM
**Platform:** Google AI Studio + Firebase + Cloud Run (all free tier)

---

## What This Project Is

Community Hero is a civic issue reporting and resolution platform with three interfaces (citizen, officer, admin). Citizens report infrastructure issues (potholes, broken streetlights, waterlogging, open manholes) via photo. AI classifies the issue. Authorities are manually assigned and held accountable. Ghost detection catches fake resolutions. The platform generates RTI legal documents if issues go unresolved past 30 days.

**Built with:** React (frontend), Node.js/Express (backend), Firebase (database/auth/storage/notifications), Gemini Vision (14 AI touchpoints with function calling), OpenStreetMap (maps), Google Translate (multilingual), Twilio (WhatsApp), Google AI Studio (deployment).

**Three user roles:**
- Citizen — reports issues, tracks tickets, gamification, RTI
- Officer — views assigned queue, updates status, uploads resolution proof
- Admin — manages staff database, manually assigns officers, analytics

---

## Document Index

Read documents in this order when starting a new build session:

### 1. `community_hero_build_tracker.md` — START HERE EVERY SESSION
The living checklist. 16 phases, 200+ tasks with `[ ]` / `[x]` / `[~]` / `[!]` status markers. Before doing anything, read this to know what is done and what is next. Update it when something is completed.

### 2. `community_hero_prd_v2.md` — What to build (the product)
Full product requirements document. 27 sections covering every feature, user flow, evaluation criteria, and deployment plan. Read this to understand WHY something works the way it does. Key sections:
- Section 4: User roles and access levels
- Section 7: Core reporting flow (5-step)
- Section 8: AI suggests, human confirms — the key design principle
- Section 11: Officer assignment flow (manual, from staff database)
- Section 15: Ghost issue detection
- Section 18: RTI auto-draft and escalation ladder
- Section 22: Full gamification system
- Section 23: All 14 AI features
- Section 24: Technology stack and cost (all free)

### 3. `community_hero_system_design.md` — How it's architected
System architecture, API gateway, microservices, data layer, background workers, security, scalability plan. Read this when making architectural decisions or when something isn't working and you need to understand the system. Key sections:
- Section 3: Three-tier architecture overview
- Section 5: Full Firestore schema (all collections with field types)
- Section 5.2: Firestore Security Rules (full ruleset — copy directly)
- Section 5.3: Firebase Storage Rules (full ruleset — copy directly)
- Section 8: Security design (rate limiting, input validation, EXIF stripping, prompt injection protection)
- Section 12: Scalability plan (hackathon → city → national, zero code changes needed)

### 4. `community_hero_tech_impl_guide.md` — How to write the code
2,412 lines of actual implementation code. Copy-paste ready. Read this when writing any file — the code is here. Key sections:
- Section 1: Project setup, npm install commands, Tailwind config
- Section 2: Folder structure (complete file tree)
- Section 3: Environment configuration (`.env` templates)
- Section 4: Firebase setup (client init, Admin SDK, rules deployment)
- Section 5: Frontend implementation (App.jsx router, AuthContext, API utility, Step2AIReview component, useTicket hook)
- Section 6: Backend implementation (Express server, ticket routes — all endpoints, rate limiter, auth middleware, photo processing)
- Section 7: Gemini integration (geminiService.js with quota tracking, all 8 prompt files)
- Section 8: Background workers (SLA worker, ghost detection worker with full code)
- Section 9: Maps integration (CommunityMap.jsx with Leaflet, Nominatim geocoding)
- Section 10: Notification system (notifyService.js, FCM service worker)
- Section 11: Security implementation (Joi validation schema, full input validation)
- Section 12: Deployment to Google AI Studio (step-by-step)
- Section 13: Build day checklist (Day 1–7 tasks)
- Section 14: Hackathon submission checklist (exact Google Doc template)

### 5. `community_hero_schema_guide.md` — Database schemas and seed data
2,830 lines. Every Firestore collection fully documented + complete seed data. Read this when writing anything that touches the database. Key sections:
- Section 3: All enums and constants (copy into `constants.js`)
- Section 4: All 13 collection schemas with every field documented
- Section 5–12: Seed data for departments, officers, admin, 8 sample tickets, gamification, predictions, ward stats, counters
- Section 13: Complete seed script (`node seed/index.js`) — run once after Firebase setup
- Section 14: Fake image URLs for demo photos
- Section 15: All Firestore composite indexes needed (deploy with `firebase deploy`)
- Section 16: Data relationships map

### 6. `community_hero_user_flows.md` — What each screen looks like
1,757 lines. Every screen, every button, every state for all three interfaces. Read this when building UI. Key sections:
- Section 2: Public landing page (hero, report flow, ticket tracker, community map)
- Section 3: Citizen dashboard (all 7 pages including gamification, RTI flow, ghost re-open)
- Section 4: Officer dashboard (queue, ticket detail, resolution upload with Gemini validation display, queries inbox, performance)
- Section 5: Admin dashboard (overview, unassigned queue with assignment dropdown, staff management, analytics, predictions, system settings)
- Section 6: Shared components (notifications, language selector, photo viewer, error states)
- Section 7: Full navigation map (all routes)

### 7. `community_hero_new_changes.md` — 5 additional features (read after PRD)
932 lines. Features added on top of the base PRD. Every change is a delta — describes exactly what to change in existing files rather than regenerating everything. Key sections:
- Feature 1: Gemini Structured Output — add `responseMimeType: 'application/json'` to callGemini()
- Feature 2: Gemini Function Calling — full `queryFunctions.js` file + replacement `queryBot()` function
- Feature 3: Enhanced Ghost Detection — new structured prompt + updated worker decision parsing
- Feature 4: Resolution Evidence Report — `evidenceReport` object stored on ticket + UI cards
- Feature 5: AI Confidence & Reasoning Layer — `reasoning` field + ◆ marker UI
- Feature 7: Admin Analytics — full `analytics.js` route + `useAnalytics.js` hooks
- Summary table: all files that need to be created or modified

### 8. `community_hero_design_doc.md` — Visual design system
913 lines. Color system, typography, spacing, all 13 components with ASCII wireframes, interface-specific directions, motion rules, accessibility, dark mode, explicit "what not to do" list. Read this before writing any CSS or JSX. Key sections:
- Section 3: Full color palette with hex values and semantic rules
- Section 4: Typography scale (sizes, weights, families, rules)
- Section 5: 8px spacing grid + layout grids for all screen sizes
- Section 7: Component library — all 13 components with ASCII wireframes
- Section 8: Interface-specific design (landing page vs citizen vs officer vs admin)
- Section 14: What not to do (20 explicit prohibitions)

### 9. `community_hero_api_keys_guide.md` — All credentials needed
521 lines. Every API key, where to get it, what it looks like, where it goes in `.env`, free tier limits, setup order. Read this first when setting up the project for the first time. Key sections:
- Section 1: Gemini API Key — aistudio.google.com, server-side only
- Section 2: Firebase — client config (7 vars for frontend) + service account (3 vars for backend), private key formatting fix
- Section 3: Google Translate — requires billing account, $300 free credit
- Section 4: OpenStreetMap — no key, User-Agent header required
- Section 5: Twilio WhatsApp — sandbox setup, join message required
- Section 6: Gmail SMTP — App Password (not regular password)
- Section 8: Complete `.env` files for both frontend and backend
- Section 9: Setup order (13 steps in sequence)
- Section 10: Security checklist + grep command to find leaked keys

### 10. `community_hero_prd.md` — Original PRD (v1.0, superseded)
The first version of the PRD. Superseded by `community_hero_prd_v2.md`. Only read if you need context on what changed between v1 and v2.

---

## How to Start a Build Session

### If starting from zero (Day 1)

```
1. Read api_keys_guide.md Section 9 (setup order)
2. Get all credentials in order
3. Read tech_impl_guide.md Section 1 (project setup)
4. Scaffold the project, install dependencies
5. Set up Firebase following api_keys_guide.md Section 2
6. Run the seed script from schema_guide.md Section 13
7. Follow build_tracker.md Phase 1 tasks in order
```

### If continuing a build session

```
1. Open build_tracker.md — find the last [x] item
2. The next [ ] item is where you start
3. Find that feature in tech_impl_guide.md for the code
4. Cross-reference prd_v2.md for requirements if unclear
5. Cross-reference schema_guide.md if touching the database
6. Cross-reference user_flows.md if building UI
7. Cross-reference design_doc.md for any CSS/styling decisions
8. After finishing something, update build_tracker.md
```

### If fixing a bug

```
1. Check system_design.md Section 8 (security design) if it's a security issue
2. Check tech_impl_guide.md for the original implementation
3. Check schema_guide.md Section 15 (Firestore indexes) if it's a query issue
4. Check system_design.md Section 5.2 (Firestore rules) if it's a permissions issue
```

### If adding a new feature

```
1. Check new_changes.md — is it one of the 5 documented features?
   Yes → follow that section exactly
   No → check prd_v2.md to see if it fits the product vision
2. Update schema_guide.md if adding Firestore fields
3. Update tech_impl_guide.md folder structure if adding new files
4. Add tasks to build_tracker.md
```

---

## Critical Rules — Read Before Writing Any Code

These are non-negotiable. They exist because of specific design decisions documented in the PRDs.

### On Gemini
- Gemini API key is **server-side only**. It goes in `backend/.env` and is read by `backend/services/geminiService.js`. It never appears in the frontend, never in API responses, never in logs.
- Every Gemini call uses `responseMimeType: 'application/json'` (Feature 1 from new_changes.md)
- The quota tracker caps at 1,400 requests/day (100 buffer below the 1,500 free limit)
- When Gemini fails, return empty fallback values — never crash the user's report submission

### On AI suggestions
- Gemini classifies the issue and pre-fills the report form
- Every AI-suggested field shows a ◆ marker
- Every field is editable by the citizen before submission
- Citizen's edited values are what get stored, not Gemini's output
- The field `citizenDescription` is stored separately from `description` and is **never** passed to Gemini prompts (prompt injection protection)

### On officer assignment
- Officers are **never** auto-assigned. A human admin always makes the decision.
- The assignment dropdown filters by department AND ward AND `status === 'active'`
- Officers with `status === 'on_leave'` never appear in the dropdown
- After assignment, officer name is denormalized onto the ticket (`assignedOfficerName`) for fast public reads

### On ticket resolution
- An officer cannot mark a ticket resolved without uploading a photo
- Gemini validates the before/after photos — confidence must be ≥70% AND `issue_resolved === true` AND `same_location === true`
- If validation fails, `resolutionRetries` increments on the ticket
- After 3 failed attempts, the ticket auto-escalates to ESCALATED status
- The `evidenceReport` object is always built and stored on the ticket after resolution attempt (Feature 4 from new_changes.md)

### On ghost detection
- Ghost detection uses the new structured output: `decision: 'reject_resolution' | 'needs_review' | 'accept_resolution'`
- `reject_resolution` with confidence ≥65% → auto-reopen ticket
- `needs_review` or confidence 40–65% → flag for admin review (don't auto-reopen)
- `accept_resolution` → genuine closure, no action
- If override was used on the original closure, the accountability penalty is doubled (-20 instead of -10)

### On private fields
- `internalNotes`, `citizenPhone`, `citizenEmail` must NEVER appear in public GET responses
- Strip them explicitly: `const { internalNotes, citizenPhone, citizenEmail, ...publicData } = data`
- These fields are also excluded from any data passed to Gemini's queryBot

### On the database
- Ticket IDs have two forms: `publicId` (KOL-2026-00142, shown to users) and the Firestore document ID (KOL-2026-00142-a3f9c2, has a random salt to prevent enumeration)
- All timestamps are ISO 8601 strings, set server-side, never client-side
- The `ticket_logs` collection is append-only — never update or delete entries
- `officers.activeCaseCount` is a denormalized counter — increment on assign, decrement on resolve

### On security
- Input validation uses Joi schemas before any database write
- Photos are processed with `sharp` before storage — EXIF stripped (removes GPS from citizen photos), resized to max 800px, converted to JPEG
- Rate limiters: 5 reports/hour per IP, 10 AI calls/min per user, 5 login attempts/15min per IP
- CORS: only allow requests from `FRONTEND_URL`, never wildcard `*`
- All protected routes require `Authorization: Bearer [Firebase JWT]` header

---

## Feature Completeness Map

What makes this different from every other team's submission:

| Feature | Where documented | Why judges care |
|---|---|---|
| Ghost issue detection | prd_v2.md §15, new_changes.md Feature 3, system_design.md §6.2 | No other team has this. Catches fake resolutions automatically. |
| Gemini function calling query bot | new_changes.md Feature 2, tech_impl_guide.md §7 | Demonstrates advanced agentic Gemini use, not just simple prompts. |
| AI suggests, human confirms | prd_v2.md §8, user_flows.md §3.3 | Every field is editable. Judges understand data quality matters. |
| Manual officer assignment from staff DB | prd_v2.md §10-11, user_flows.md §5.4 | Realistic — shows understanding of how municipalities actually work. |
| RTI auto-draft with legal escalation | prd_v2.md §18, user_flows.md §3.4 | Turns the app into a citizen rights tool, not just a complaint box. |
| Resolution evidence report | new_changes.md Feature 4 | Transparency — explainable AI decision on every resolution. |
| Predictive issue flagging | prd_v2.md §16, system_design.md §6.3 | Fully agentic — AI acts without citizen trigger. |
| Three completely separate interfaces | user_flows.md all sections | Real product thinking — not one dashboard for everyone. |
| Officer accountability scoring | schema_guide.md §4.3 | Public accountability — ghost closures, overrides, SLA breaches tracked. |
| 14 Gemini touchpoints | prd_v2.md §23, tech_impl_guide.md §7 | Gemini is the backbone, not a plugin. Strong Google tech score. |

---

## Evaluation Criteria Quick Reference

When in doubt about what to build next, prioritize for these criteria:

| Criterion | Weight | What earns points |
|---|---|---|
| Problem Solving & Impact | 20% | Ghost detection, RTI ladder, officer accountability |
| Agentic Depth | 20% | Predictive flagging, ghost auto-reopen, function calling query bot, RTI auto-generation |
| Innovation & Creativity | 20% | Ghost detection, RTI, evidence report, function calling, predictive |
| Usage of Google Technologies | 15% | All 14 Gemini touchpoints, Firebase, Translate, Cloud Run, AI Studio |
| Product Experience & Design | 10% | Three clean interfaces, no-login tracking, design_doc.md principles |
| Technical Implementation | 10% | Structured JSON output, function calling, geohash queries, real-time sync |
| Completeness & Usability | 5% | Full end-to-end flow working, seed data visible, all interfaces functional |

**The highest-value things to have working for the demo:**
1. Report issue → Gemini classifies → ticket created (core flow)
2. Admin assigns officer from dropdown (shows staff DB)
3. Officer uploads resolution → Gemini validates (shows AI accountability)
4. Ghost detection card visible on admin dashboard (most unique feature)
5. NLP query bot with function calling (shows agentic depth)
6. Community map with colored pins (visual impact)
7. RTI draft button on a 30+ day old ticket (shows legal escalation)

---

## Demo Script (for judges)

Walk judges through this in 5 minutes:

```
1. Open public landing page → show live stats counter
2. Click Report Issue → upload a photo → show Gemini pre-filling fields
   (point out ◆ markers, explain AI suggests but citizen can change)
3. Submit → show ticket ID generated → KOL-2026-00142
4. Open admin dashboard → show unassigned queue sorted by severity
5. Assign Rajesh Kumar to the ticket → citizen gets notified
6. Switch to officer dashboard (Rajesh) → show the ticket in queue
7. Show the ghost flagged ticket (KOL-2026-00133) → open ghost report card
   (this is the unique feature — show the 3-photo comparison and structured report)
8. Show the RTI filed ticket (KOL-2026-00101) → click Download RTI
   (30+ days unresolved, auto-generated legal document)
9. Open NLP query bot → type "why is my ticket delayed?"
   (show function calling in action — Gemini fetches live data)
10. Show community map with prediction markers (blue dashed pins)
    (AI predicted issues before anyone reported them)
```

Total demo time: ~5 minutes. Every step shows a different judge criterion.

---

## If Something Breaks

**Gemini not responding:**
- Check quota in `geminiService.js` quota tracker
- Check `GEMINI_API_KEY` is set correctly in environment
- Fallback should kick in — citizen sees blank form, can fill manually
- Verify `responseMimeType: 'application/json'` is in the config

**Firebase permission denied:**
- Check Firestore Security Rules are deployed: `firebase deploy --only firestore:rules`
- Check that the Firebase Admin SDK private key has correct `\n` handling
- Check that the user's Firebase JWT has the correct custom claims

**Worker not running:**
- Workers start in `server.js` via `require('./workers/slaWorker').start()`
- On Cloud Run, workers run inside the same process as the API
- Check Cloud Run logs for worker errors

**Assignment dropdown empty:**
- Officers must have `status: 'active'` in Firestore
- Officers must have the matching `departmentId` and `wardIds` for the ticket
- Run the seed script if the database is empty

**WhatsApp not sending:**
- Verify the recipient's phone has joined the Twilio sandbox
- Check Twilio console for error logs
- The sandbox only sends to pre-approved numbers

**CORS errors after deployment:**
- Set `FRONTEND_URL` to the exact Cloud Run URL (no trailing slash)
- Redeploy after updating this variable
- Check that the React app's `REACT_APP_API_URL` also points to the live URL

---

*Master Build Prompt v1.0 — Community Hero*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
