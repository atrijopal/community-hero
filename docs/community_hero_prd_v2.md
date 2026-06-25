# Product Requirements Document
## Community Hero — Hyperlocal Problem Solver
**Version:** 2.0 (Final)
**Date:** June 2026
**Hackathon:** BlockseBlock × Google AI Studio Challenge
**Problem Statement:** PS2 — Community Hero: Hyperlocal Problem Solver
**Deployment:** Google AI Studio (Free Tier) + Firebase Spark Plan + OpenStreetMap

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [User Roles & Access Levels](#4-user-roles--access-levels)
5. [Pre-Login & Landing Interface](#5-pre-login--landing-interface)
6. [Issue Categories](#6-issue-categories)
7. [Core Reporting Flow](#7-core-reporting-flow)
8. [Gemini Vision Classification — AI Suggests, Human Confirms](#8-gemini-vision-classification--ai-suggests-human-confirms)
9. [Ticket & Tracking System](#9-ticket--tracking-system)
10. [Officer & Staff Database (Admin-Managed)](#10-officer--staff-database-admin-managed)
11. [Officer Assignment Flow (Manual by Authority)](#11-officer-assignment-flow-manual-by-authority)
12. [Officer Public Accountability](#12-officer-public-accountability)
13. [Resolution Proof System](#13-resolution-proof-system)
14. [Manual Override System](#14-manual-override-system)
15. [Ghost Issue Detection](#15-ghost-issue-detection)
16. [Predictive Issue Flagging](#16-predictive-issue-flagging)
17. [Duplicate Detection](#17-duplicate-detection)
18. [RTI Auto-Draft & Escalation Ladder](#18-rti-auto-draft--escalation-ladder)
19. [Citizen Dashboard](#19-citizen-dashboard)
20. [Officer Dashboard](#20-officer-dashboard)
21. [Admin Dashboard](#21-admin-dashboard)
22. [Gamification System](#22-gamification-system)
23. [AI Features (All Gemini)](#23-ai-features-all-gemini)
24. [Technology Stack & Cost](#24-technology-stack--cost)
25. [Unique Differentiators](#25-unique-differentiators)
26. [Evaluation Criteria Mapping](#26-evaluation-criteria-mapping)
27. [Deployment Plan](#27-deployment-plan)

---

## 1. Executive Summary

Community Hero is a three-interface AI-powered civic issue reporting and resolution platform connecting citizens with municipal authorities. Built entirely on Google AI Studio using Gemini Vision as the core AI engine, the platform covers the complete lifecycle of a civic issue — from photo-based reporting to AI classification (with human confirmation), manual officer assignment from a staff database, AI-validated resolution proof, gamified citizen engagement, and legal escalation via auto-generated RTI documents if issues remain unresolved.

**Three core failures addressed:**

1. Citizens have no structured, accountable way to report hyperlocal infrastructure issues
2. Authorities face no real accountability — issues get fake-resolved with zero consequence
3. Citizens have no legal recourse when issues remain unresolved beyond deadlines

**Key design principles in this version:**
- Gemini suggests, humans confirm — no forced AI decisions
- Officers are not auto-assigned; authority manually selects from a managed staff database
- Three separate authenticated interfaces: Citizen, Officer, Admin
- Public pre-login landing page for ticket tracking and issue reporting without login
- All Google technologies used are available on free tiers for this hackathon

---

## 2. Problem Statement

Communities frequently face issues such as potholes, water leakages, damaged streetlights, waste management concerns, and public infrastructure challenges. Reporting these issues is often fragmented, difficult to track, and lacks transparency.

**Core pain points identified:**
- No unified platform for multi-category civic reporting in one place
- AI tools in existing platforms force classifications without allowing human correction
- Officers get auto-assigned without a structured staff database or workload consideration
- Authorities mark issues resolved without actual fixing — ghost resolutions are rampant
- Citizens have no visibility into who is personally responsible for their complaint
- No legal escalation pathway when issues remain unresolved beyond reasonable deadlines
- Language barriers (Hindi, Bengali) prevent inclusive participation across demographics
- No separation between citizen, officer, and admin interfaces — everything is jumbled

---

## 3. Solution Overview

A full-stack web application with three distinct authenticated interfaces — Citizen, Officer, and Admin — plus a public pre-login landing page. Gemini Vision powers all AI decisions but every AI output is editable by the human before it is committed.

**Updated core flow:**

```
PUBLIC LANDING PAGE
      |
Citizen reports issue (no login required)
      |
Photo uploaded → Gemini Vision analyzes → suggests category, severity,
                 department, description
      |
Citizen REVIEWS and EDITS all suggestions before submitting
(UI shows: "AI suggested — you can change this")
      |
Ticket created → sits in UNASSIGNED queue
Unique Ticket ID sent via WhatsApp + email
      |
AUTHORITY SIDE: Reviews unassigned queue
Manually selects officer from staff database dropdown
Confirms assignment → officer notified
      |
Officer's name + department becomes publicly visible on ticket
Citizen notified of assignment with officer name + SLA deadline
      |
Officer works on issue → uploads resolution photo from field
      |
Gemini validates before vs. after photo (AI-gated resolution)
      |
Citizen receives before/after comparison card
      |
If unresolved beyond 30 days → RTI auto-draft generated by Gemini
```

---

## 4. User Roles & Access Levels

| Role | Login Required | Interface | Key Permissions |
|---|---|---|---|
| Anonymous Visitor | No | Public Landing Page | Track ticket by ID, report issue, view community map |
| Citizen | Optional (Google Sign-In) | Citizen Dashboard | Report issues, track own tickets, upvote, gamification, RTI filing |
| Officer | Mandatory | Officer Dashboard | View assigned tickets, update status, upload resolution proof, respond to queries |
| Senior Officer | Mandatory | Officer Dashboard (elevated) | All officer permissions + approve overrides, handle escalations, fast-close |
| Admin | Mandatory | Admin Dashboard | Manage staff database, assign tickets, view all wards, generate reports, configure system |

**Role separation rules:**
- Citizens cannot see officer internal notes
- Officers cannot see other officers' tickets unless reassigned
- Only Admin can add, edit, or deactivate officer accounts
- Only Senior Officer or Admin can approve manual overrides
- Admin dashboard is the only interface with full cross-ward visibility

---

## 5. Pre-Login & Landing Interface

The public landing page is the first screen all users see before any login. It is fully functional without an account.

**Landing page sections:**

### 5.1 Public Hero Section
- Platform name, tagline, and brief description
- Two primary CTAs: **Report an Issue** and **Track My Ticket**
- No login required for either action

### 5.2 Track Ticket (No Login)
- Single input field: Enter Ticket ID (e.g., KOL-2026-00142)
- Full status timeline displayed publicly
- Officer name, department, SLA deadline visible
- Before/after resolution card visible once resolved
- NLP query box: type a question about the ticket in plain English

### 5.3 Community Map (Public, Read-Only)
- Live map of all active issues in the city
- Color coded: Red = Critical, Orange = High, Yellow = Medium, Green = Resolved
- Click any pin to see ticket summary (no sensitive details)
- Filter by category, ward, status

### 5.4 Role-Based Login Selection
Three distinct login entry points clearly displayed:
```
[ Login as Citizen ]   [ Login as Officer ]   [ Login as Admin ]
```
Each routes to a separate login screen and a completely separate interface post-authentication.

### 5.5 Civic Health Score (Public)
- Ward-level A–F civic health score visible without login
- Updates weekly based on resolution rates
- Encourages community engagement by showing relative performance

---

## 6. Issue Categories

### Infrastructure
- Potholes and damaged roads
- Damaged footpaths and pavements
- Broken traffic signals
- Collapsed boundary walls
- Damaged bus shelters and benches
- Broken road signs and dividers

### Water & Drainage
- Water pipeline leakages
- Blocked or overflowing drains
- Waterlogging after rain
- Sewage overflow on streets
- Open manholes (critical — life safety)
- No water supply in area

### Sanitation & Waste
- Uncollected garbage
- Illegal dumping sites
- Overflowing dustbins
- Dead animals not removed
- Non-functional public toilets

### Electricity
- Exposed or hanging wires (critical — life safety)
- Transformer issues
- Broken streetlights
- Frequent power cuts in area

### Public Safety
- Open manholes
- Fallen trees blocking roads
- Illegal construction
- Broken railings near water bodies

### Environment
- Illegal tree cutting
- Noise pollution from construction at night
- Air pollution from burning waste
- Stagnant water breeding mosquitoes (dengue risk)

### Public Facilities
- Broken park equipment
- Damaged water ATMs
- Encroached footpaths
- Damaged public toilets

**Note:** Open manholes and exposed wires are automatically assigned severity 9–10 and danger level CRITICAL regardless of Gemini's output, overriding any lower AI suggestion.

---

## 7. Core Reporting Flow

Reporting is available both on the public landing page (no login) and inside the Citizen Dashboard (logged in).

**Step-by-step:**

1. Citizen taps **Report an Issue**
2. Camera opens or file upload option shown
3. Citizen takes or uploads photo
4. GPS auto-captures location (with manual pin-drop override if GPS is inaccurate)
5. Gemini Vision processes image in background (see Section 8)
6. Pre-filled form appears with all AI suggestions clearly labeled as editable
7. Citizen reviews every field — edits what is wrong
8. Citizen submits
9. System checks for duplicate tickets within 50 metres + same category
10. If duplicate found: citizen shown the existing ticket and asked to upvote instead
11. If no duplicate: new ticket created
12. Unique Ticket ID generated: format `[CITY CODE]-[YEAR]-[SEQUENCE]` e.g., `KOL-2026-00142`
13. Ticket ID + tracking link sent via WhatsApp and email instantly
14. Ticket status set to: **Unassigned** (not yet in officer queue)
15. Ticket appears in Admin/Authority unassigned queue for manual officer assignment

---

## 8. Gemini Vision Classification — AI Suggests, Human Confirms

This is a critical design decision. Gemini Vision analyzes the uploaded photo and returns structured suggestions, but the citizen has full control to change any field before submitting.

**UI behavior:**
- Every AI-suggested field shows a small "AI" badge next to it
- Tooltip on hover: "This was suggested by AI based on your photo. Feel free to change it."
- Fields are pre-filled but not locked
- If citizen changes a field, the AI badge disappears from that field
- Submit button only activates after citizen has reviewed (must scroll through form)

**Gemini Vision prompt (server-side, never exposed to client):**

```json
{
  "prompt": "Analyze this civic issue image carefully. Return ONLY valid JSON with no explanation:
  {
    'issue_type': 'one of: pothole/damaged_road/broken_footpath/broken_streetlight/open_manhole/
                   waterlogging/garbage/sewage_overflow/water_leakage/broken_signal/exposed_wire/
                   fallen_tree/illegal_dumping/broken_park_equipment/other',
    'category': 'one of: Infrastructure/Water_Drainage/Sanitation/Electricity/Public_Safety/
                  Environment/Public_Facilities',
    'severity': 'integer 1-10',
    'danger_level': 'one of: safe/moderate/critical',
    'department': 'one of: Roads_Infrastructure/Water_Supply/Sanitation/Electricity/
                   Parks_Recreation/Environment',
    'description': 'one sentence describing the issue in plain language',
    'confidence': 'integer 0-100',
    'ai_notes': 'any caveats or uncertainty about the classification'
  }",
  "image": "[base64 encoded image]",
  "context": {
    "location": "ward name and city from GPS",
    "time_of_day": "morning/afternoon/evening/night",
    "season": "monsoon/summer/winter",
    "nearby_context": "school/hospital/highway/residential (from Maps API)"
  }
}
```

**Weighted severity override rules (hardcoded, not AI):**
- Open manhole detected: severity forced to minimum 9
- Exposed wire detected: severity forced to minimum 9
- Near school or hospital (from Maps context): severity +2 added
- Night time + broken streetlight: severity +1 added

**Fallback behavior:**
- If Gemini confidence < 50%: form fields left blank, citizen must fill manually
- If Gemini API fails: form opens blank, citizen fills everything manually
- Error shown: "AI classification unavailable. Please fill in the details."

---

## 9. Ticket & Tracking System

### 9.1 Ticket ID Format
`[CITY]-[YEAR]-[5-DIGIT-SEQUENCE]`
Examples: `KOL-2026-00142`, `MUM-2026-00891`, `DEL-2026-01204`

### 9.2 Ticket Status States
```
UNASSIGNED    → Ticket submitted, no officer assigned yet
VERIFIED      → Community peer verification passed (or Gemini backup verified)
ASSIGNED      → Authority selected officer from staff database
IN_PROGRESS   → Officer acknowledged and started work
RESOLVED      → Officer uploaded proof, Gemini validated before/after
GHOST_FLAGGED → Resolved but re-reported at same location — under review
ESCALATED     → Passed to senior officer due to SLA breach
RTI_FILED     → Day 30 reached, RTI auto-drafted
CLOSED_OVERRIDE → Closed via manual override (visible to public)
REJECTED      → False report confirmed after peer review
```

### 9.3 Public Ticket View (No Login Required)
Accessible at: `[domain]/track/[TICKET-ID]`

Displays:
- Ticket ID, submission date and time
- Issue category and type (as submitted by citizen, not AI's original suggestion)
- GPS location and reverse-geocoded address
- Current status with timestamp
- Full status timeline with all transitions logged
- Assigned officer name and department (once assigned)
- SLA deadline and time remaining
- Evidence thread: all photos uploaded (original + any re-reports + resolution photo)
- Before/after comparison card (once resolved)
- AI confidence note if Gemini classified it
- "Closed via override" label if applicable (with override type but not internal reason)

Citizen actions on ticket page:
- **Ghost Re-open Button**: appears 7 days after resolution, requires new photo upload
- **Query Box**: type a question, Gemini responds in plain English with ticket data
- **Me Too Button**: upvote to add weight (increases severity ranking)
- **RTI Draft Button**: appears at Day 30 if unresolved

### 9.4 NLP Ticket Query Bot
Citizen types free-form: *"why hasn't my issue been resolved"* or *"who is working on my problem"*

Gemini receives:
- Citizen's question
- Full ticket data (status, officer, timestamps, department, SLA)
- Responds in plain English, in citizen's language preference

Example response:
> "Your issue (KOL-2026-00142 — pothole near Gariahat Market) was assigned to Rajesh Kumar from the Roads Department on 24th June. The SLA deadline is 1st July. It is currently marked In Progress. If it is not resolved by 1st July, it will be automatically escalated to a senior officer."

### 9.5 Notification System
Every status change triggers:
- WhatsApp message (via WhatsApp Business API or Twilio)
- Email notification
- In-app push notification (Firebase Cloud Messaging) if citizen has account

Notification content includes: ticket ID, new status, officer name (if assigned), SLA deadline, and tracking link.

---

## 10. Officer & Staff Database (Admin-Managed)

This is a core backend system managed exclusively by Admin. Officers do not self-register — Admin creates all officer accounts.

### 10.1 Officer Profile Fields
```
Full Name
Employee ID
Designation (e.g., Junior Engineer, Senior Inspector, Ward Officer)
Department (Roads / Water Supply / Sanitation / Electricity / Parks / Environment)
Ward(s) Assigned (can be multiple)
Contact Number
Email
Status: Active / On Leave / Deactivated
Current Active Cases (auto-counted from assigned tickets)
Resolution Rate (auto-calculated: resolved / total assigned × 100)
Average Resolution Time (auto-calculated)
Ghost Closure Count (auto-flagged by system)
Override Count (auto-logged)
Accountability Score (0-100, auto-calculated from above metrics)
Date Joined
Notes (Admin-only private field)
```

### 10.2 Admin Staff Management Actions
- **Add Officer**: fill profile form, system auto-creates login credentials, sends welcome email to officer
- **Edit Officer**: update any profile field
- **Deactivate Officer**: removes from assignment dropdown, retains historical data
- **Reassign Ward**: change jurisdiction without losing case history
- **View Officer Dashboard**: Admin can view any officer's personal dashboard
- **Export Staff Report**: full department performance export

### 10.3 Department Structure
Admin configures departments once. Each department has:
- Department name
- Head officer (Senior Officer designation)
- Member officers list
- Ward coverage
- Default SLA days (configurable per department)

### 10.4 Assignment Dropdown Logic
When Admin assigns a ticket to an officer, the dropdown shows:
```
Officer Name — Designation — Active Cases — Resolution Rate
──────────────────────────────────────────────────────────
Rajesh Kumar    Jr. Engineer     4 active     87% resolution
Priya Sharma    Sr. Inspector    2 active     94% resolution
Amit Das        Ward Officer     7 active     71% resolution
```
Sorted by: fewest active cases first (workload balancing)
Filtered by: department matching the issue category
Color coded: green (<5 cases), yellow (5–8), red (>8)

---

## 11. Officer Assignment Flow (Manual by Authority)

This replaces the old auto-assignment model entirely.

**Full flow:**

```
Step 1: Ticket submitted by citizen → status: UNASSIGNED
        ↓
Step 2: Community peer verification (3 nearby users, or Gemini backup)
        Verified → status: VERIFIED
        Rejected → status: REJECTED (citizen notified)
        ↓
Step 3: UNASSIGNED queue on Authority/Admin dashboard
        Sorted by: AI severity score (highest first)
        Color coded: red = critical, orange = high, yellow = medium
        ↓
Step 4: Admin reviews ticket — sees photo, AI classification, citizen edits, location
        Selects department from dropdown (pre-suggested by Gemini, changeable)
        Selects officer from staff database dropdown (filtered by dept + ward)
        Optionally adds internal note for officer
        Clicks ASSIGN
        ↓
Step 5: Status changes to: ASSIGNED
        Officer receives push notification + email with full ticket details
        Citizen receives notification: "Your issue has been assigned to [Officer Name],
        [Department]. Expected resolution by [SLA Date]."
        Officer name and department become publicly visible on ticket
        ↓
Step 6: Officer acknowledges ticket → status: IN_PROGRESS
        Officer works on issue in field
        ↓
Step 7: Officer uploads resolution photo → Resolution Proof System (Section 13)
```

**Reassignment:**
- Admin can reassign any ticket at any time
- Reason required
- Full reassignment log maintained per ticket
- Previous officer notified of reassignment
- Public ticket shows: "Transferred to [New Officer] — [Date]"

---

## 12. Officer Public Accountability

Once assigned, citizen ticket page shows:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSIGNED OFFICER
Name:          Rajesh Kumar
Department:    Roads & Infrastructure
Designation:   Junior Engineer
Assigned On:   24 Jun 2026, 2:00 PM
SLA Deadline:  1 Jul 2026, 2:00 PM
Days Remaining: 7 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Officer name is permanently public for the life of the ticket
- Accountability score (0–100) shown to Admin and Senior Officers only
- Ghost closure count and override count visible to Admin only
- Citizens cannot contact officer directly — all queries go through the NLP query bot

---

## 13. Resolution Proof System

An issue **cannot** be marked resolved unless all validation steps pass.

### 13.1 Officer Resolution Flow
1. Officer navigates to their assigned ticket
2. Taps **Mark as Resolved**
3. Mandatory: upload resolution photo from field
4. Optional: add resolution note (e.g., "Pothole filled with asphalt by contractor XYZ")
5. System sends photo to Gemini for before/after validation

### 13.2 Gemini Before/After Validation

```json
{
  "prompt": "Compare these two images of the same civic issue location.
  Image 1: Original report photo
  Image 2: Officer's claimed resolution photo
  Return ONLY valid JSON:
  {
    'same_location': true/false,
    'issue_visible_in_image1': true/false,
    'issue_resolved_in_image2': true/false,
    'timestamp_appears_recent': true/false,
    'confidence_score': 0-100,
    'rejection_reason': 'string if any check failed, else null',
    'notes': 'any observations'
  }",
  "image1": "[original report photo base64]",
  "image2": "[resolution photo base64]"
}
```

### 13.3 Gating Logic
| Condition | Outcome |
|---|---|
| All checks pass AND confidence ≥ 70% | Resolution approved, status → RESOLVED |
| Any check fails OR confidence < 70% | Resolution blocked, officer sees rejection reason |
| Officer re-uploads 3 times and fails | Ticket auto-escalated to Senior Officer |
| Senior Officer reviews and confirms manually | Override logged, resolution approved |

### 13.4 Citizen Resolution Notification
Citizen receives:
```
Your issue KOL-2026-00142 has been RESOLVED.

BEFORE                        AFTER
[Original photo thumbnail] →  [Resolution photo thumbnail]
Reported: 22 Jun 2026          Resolved: 28 Jun 2026
                               ✅ Verified by Gemini AI

Rate this resolution: ⭐⭐⭐⭐⭐
If the issue is not actually fixed, tap REOPEN below.
```

### 13.5 Citizen Resolution Rating
Citizen can rate the resolution 1–5 stars.
Rating data feeds into:
- Officer accountability score
- Department performance dashboard
- Monthly ward report

---

## 14. Manual Override System

For edge cases where normal resolution proof flow is not applicable.

| Situation | Who Can Override | Requirement |
|---|---|---|
| Issue does not exist / false report | Junior Officer | Written reason + Senior Officer approval |
| Already resolved by another department | Junior Officer | Reference ticket number required |
| Natural resolution (rain cleared waterlogging) | Junior Officer | Written reason required |
| Emergency fast-close | Senior Officer | One-click, reason logged automatically |
| Citizen disputes resolution | Senior Officer only | Mandatory written justification |
| Gemini validation failed but issue genuinely resolved | Senior Officer | Photo review + written confirmation |

**Accountability rules:**
- Every override logged: timestamp, officer ID, reason, approver
- Override count feeds into officer accountability score (each override = −2 points)
- Excessive overrides (>5 in 30 days) → auto-flagged to Admin
- Citizens see "Closed via override" label on ticket (transparent but reason not fully disclosed)
- Ghost detection remains active even after override closures
- If ghost detected on override-closed ticket: double accountability penalty

---

## 15. Ghost Issue Detection

**Problem:** Authorities mark issues resolved, receive credit, but never actually fix them. Citizens re-report the same issue days later.

### 15.1 Detection Flow
```
Issue marked RESOLVED (by proof or override)
      ↓
System starts 14-day monitoring window for that GPS coordinate (±30 metres radius)
      ↓
New report comes in at same location + same/similar category
      ↓
Gemini compares:
  - New report photo vs. original report photo
  - New report photo vs. resolution photo
  Returns: {is_same_issue: bool, confidence: int, notes: string}
      ↓
If same issue confirmed (confidence ≥ 65%):
  - Original ticket REOPENED (status: GHOST_FLAGGED)
  - Resolution photo flagged as FALSE CLOSURE
  - Officer notified: "Ghost issue detected — your resolution has been challenged"
  - Admin notified with both photos side by side
  - Officer accountability score: −10 points
  - If override was used on the original closure: −20 points (double penalty)
      ↓
After 3 ghost detections for same officer/contractor:
  - Auto-escalated to Admin with full history
  - Contractor accountability score updated
  - Admin receives recommendation to review contractor contract
```

### 15.2 False Ghost Prevention
- Gemini confidence must be ≥ 65% to trigger ghost flag (prevents false positives)
- If confidence is 40–65%: flagged for Admin manual review, not auto-reopened
- Citizen who re-reports must upload photo (cannot re-report text-only)
- System cannot be gamed by citizen re-reporting the same issue repeatedly (rate limit: 1 re-report per 7 days per GPS coordinate per user)

---

## 16. Predictive Issue Flagging

**Concept:** AI identifies problem-prone areas and flags them before citizens report anything.

### 16.1 Data Inputs
- Historical ticket data for each GPS zone (past 2 years)
- Seasonal patterns (monsoon month identification)
- Last recorded repair date per zone (from resolved tickets)
- Frequency of reports per zone per category
- Current date and season context

### 16.2 Prediction Logic (Gemini prompt)
```
Given this zone's historical data: [JSON of past tickets, dates, categories, repair history]
Current date: [date], Season: [monsoon/summer/winter]
Which issue types are likely to appear in this zone in the next 30 days?
Return JSON: {
  predictions: [{
    issue_type: string,
    probability: 0-100,
    reason: string,
    recommended_preemptive_action: string
  }]
}
```

### 16.3 Display
- Predicted issues appear as **yellow dashed markers** on community map (distinct from active issues)
- Label: "AI Predicted — Not Yet Reported"
- Citizens can see predictions in their neighborhood
- Authority dashboard shows predictions with recommended preemptive actions
- Admin can convert a prediction into a proactive work order directly

---

## 17. Duplicate Detection

**Purpose:** Prevent multiple tickets for the same physical issue; consolidate community weight instead.

### 17.1 Duplicate Check Flow
When a new ticket is submitted:
1. System checks Firestore for active tickets within 50-metre GPS radius
2. Filters by same or closely related category
3. If candidate tickets found: Gemini compares photos
4. If duplicate confirmed (confidence ≥ 60%): citizen shown existing ticket
5. Citizen offered: **Upvote existing ticket** or **Submit anyway (different issue)**
6. If citizen upvotes: their account linked to existing ticket, upvote count increases
7. Upvote count increases severity ranking of existing ticket on authority queue

### 17.2 Merge Logic
- Original ticket retains its ID
- New report's photo added to evidence thread
- Upvote count and Me Too count displayed publicly
- Citizen who upvoted receives notifications on original ticket status changes

---

## 18. RTI Auto-Draft & Escalation Ladder

### 18.1 Escalation Timeline
```
Day 0   → Issue submitted, ticket created
Day 7   → Automated reminder sent to assigned officer (system-generated)
Day 7   → If still UNASSIGNED: escalation to Admin with alert
Day 14  → Auto-escalated to Senior Officer if no IN_PROGRESS status
Day 30  → RTI draft auto-generated by Gemini, citizen notified
Day 45  → Follow-up reminder to citizen if RTI not filed
Day 60  → First Appeal draft generated if RTI filed but unanswered
```

### 18.2 RTI Document Contents (Gemini-Generated)
Gemini receives all ticket data and generates a legally structured RTI application:

**Document includes:**
- Applicant section: citizen name and address (from profile or prompted to fill)
- Public Authority addressed: correct government department for the ward
- RTI Filing Authority: pre-filled based on ward + city + department
- Subject line: auto-generated from issue type and location
- Body:
  - Ticket ID and original submission date
  - GPS location and reverse-geocoded address
  - Issue category and description
  - Number of days elapsed without resolution
  - Status history log (all transitions with timestamps)
  - Names of all officers assigned (accountability trail)
  - Information sought: resolution timeline, action taken, budget allocated
- Evidence section: all photos embedded (original report + any re-reports)
- Declaration section: standard RTI format
- Date and applicant signature space

**Output:** Downloadable PDF + option to email directly to RTI portal
**Language:** Generated in English by default, with Hindi option

### 18.3 First Appeal (Day 60)
If RTI filed but no response received within 30 days:
- Gemini generates First Appeal document referencing original RTI filing date and application number (citizen inputs if they have it)
- Routes to First Appellate Authority (pre-filled based on department)

---

## 19. Citizen Dashboard

Accessible after Google Sign-In (optional — anonymous reporting allowed on landing page).

### 19.1 Navigation
- Home / Feed
- Report an Issue
- My Tickets
- Community Map
- Leaderboard
- My Profile & Badges

### 19.2 Home / Feed
- Active issues in citizen's neighborhood (based on their registered ward)
- Predicted issues panel: AI-flagged problems near them
- Ghost alerts: recently re-opened issues in their ward
- Civic Health Score for their ward: A–F with trend arrow
- Quick stats: X issues reported in their ward this month, Y resolved

### 19.3 Report an Issue
- Camera / file upload
- Real-time GPS capture with map pin (editable)
- Gemini classification form (all fields labeled "AI suggested")
- Citizen edits any field before submitting
- Duplicate check shown inline before final submit

### 19.4 My Tickets
- All tickets submitted by this citizen
- Status timeline for each
- Evidence thread per ticket
- Query box per ticket (NLP bot)
- Ghost re-open button (appears 7 days after resolution)
- RTI draft button (appears at Day 30 if unresolved)
- Resolution rating (appears after RESOLVED status)

### 19.5 Community Map
- All issues in city color-coded by status and severity
- Filter by: category, ward, status, date range
- Predicted issues layer (toggle on/off)
- Heatmap layer (toggle on/off)
- Click pin: see ticket summary card

### 19.6 Leaderboard
- Top reporters this week / month
- Top verifiers this week / month
- Top ghost busters all time
- Ward vs. ward resolution rate comparison
- Authority leaderboard: fastest resolution per department (publicly visible)

### 19.7 My Profile & Badges
- XP total and current level
- Level progress bar
- All earned badges displayed
- Active streaks
- Personal impact stats: total reports, resolved count, ghost catches, RTIs filed
- Monthly civic impact card (shareable to WhatsApp)

---

## 20. Officer Dashboard

Accessible only after Admin-created officer login credentials.

### 20.1 Navigation
- My Queue (assigned tickets)
- Resolved Cases
- Queries & Messages
- My Performance

### 20.2 My Queue
- All tickets assigned to this officer
- Sorted by SLA urgency (soonest deadline first)
- Status filter: In Progress / Pending Acknowledgement / Escalated
- Each ticket card shows: ticket ID, issue type, location, severity, days remaining on SLA
- Tap ticket → full ticket detail view

### 20.3 Ticket Detail View (Officer)
- Full issue description and citizen's photo
- GPS location with map link
- AI classification details (original suggestion vs. citizen's edit shown side by side)
- Status history log
- Internal notes area (not visible to citizen)
- Admin's assignment note (if provided)
- **Action buttons:**
  - Acknowledge (moves to IN_PROGRESS)
  - Add Update (adds timestamped note to evidence thread — visible to citizen)
  - Mark Resolved (triggers resolution photo upload + Gemini validation)
  - Request Override (sends override request to Senior Officer with reason field)
  - Request Reassignment (with reason — goes to Admin)

### 20.4 Resolution Upload
- Officer taps Mark Resolved
- Camera opens for resolution photo (or file upload)
- Photo sent to Gemini for before/after validation
- If approved: status changes to RESOLVED
- If rejected: rejection reason shown, officer re-uploads or requests override
- After 3 failed uploads: Senior Officer auto-notified

### 20.5 Queries & Messages
- All citizen queries routed to this officer's inbox
- 48-hour response SLA shown per query
- Pre-built response templates available
- Responses visible to citizen on their ticket page

### 20.6 My Performance
- Resolution rate (%)
- Average resolution time (days)
- Active cases vs. completed cases
- Ghost closure count
- Override count
- Accountability score (0–100)
- Citizen rating average
- SLA breach count

---

## 21. Admin Dashboard

The most powerful interface. Manages the entire system.

### 21.1 Navigation
- Overview (city-wide)
- Unassigned Queue
- All Tickets
- Staff Management
- Ward Reports
- Predictive Insights
- System Settings

### 21.2 Overview
- City-wide stats: total reports today / this week / this month
- Resolution rate by department
- Average resolution time by department
- SLA breach count
- Ghost issue count
- Heatmap of problem zones across all wards
- Predictive issue count (AI-flagged, not yet reported)

### 21.3 Unassigned Queue
- All tickets awaiting officer assignment
- Sorted by: AI severity score (highest first)
- Each ticket shows: photo thumbnail, AI classification, citizen edits, GPS, category, severity badge
- Admin selects department → officer dropdown filters automatically
- Dropdown shows: officer name, designation, active case count, resolution rate
- Admin selects officer, adds optional internal note, clicks ASSIGN
- Bulk assignment available for multiple tickets of same category

### 21.4 All Tickets
- Full ticket management across all wards
- Filter by: status, category, ward, officer, date range, severity
- Bulk actions: reassign, escalate, close
- Export to CSV
- Click any ticket for full detail + audit trail

### 21.5 Staff Management
- Full officer directory
- Add / Edit / Deactivate officers
- Configure departments
- Set default SLA per department (in days)
- View officer accountability scores and performance metrics
- Flag underperforming officers (>5 ghost closures or >10 overrides in 30 days)
- Generate officer performance report (Gemini-generated narrative)

### 21.6 Ward Reports
- Select ward + date range → Gemini generates structured report
- Report contains: issues reported, categories breakdown, resolution rate, SLA breaches, ghost closures, top problem zones, officer performance summary
- Downloadable as PDF
- Auto-generated monthly (sent to Senior Officers on 1st of each month)

### 21.7 Predictive Insights
- All AI-predicted issues across all wards
- Filter by ward, category, probability
- Admin can convert prediction into proactive work order
- Track if prediction came true (accuracy dashboard)

### 21.8 System Settings
- Configure ward boundaries
- Set SLA defaults per issue category
- Configure ghost detection sensitivity (GPS radius, time window)
- Configure escalation timeline (Day 7 / 14 / 30 / 60 thresholds)
- Manage WhatsApp and email notification templates
- Configure Gemini confidence thresholds

---

## 22. Gamification System

### 22.1 XP Earning Actions

| Action | XP Earned |
|---|---|
| First report submitted | +50 |
| Report peer-verified by community | +30 |
| Report resolved by authority | +100 |
| Upvoted / Me Too on someone else's issue | +5 |
| Ghost issue caught (re-report confirmed as ghost) | +150 |
| Verified someone else's report (peer verification) | +20 |
| 7-day reporting streak | +200 |
| RTI successfully filed | +75 |
| Resolution rated (any rating) | +10 |
| First report in a new ward | +25 |
| Weekly challenge completed | +100 |

### 22.2 Level Tiers

| XP Range | Level Title |
|---|---|
| 0 – 500 | Aware Citizen |
| 500 – 1,500 | Active Resident |
| 1,500 – 3,500 | Community Guardian |
| 3,500 – 7,000 | Ward Champion |
| 7,000+ | Civic Hero |

### 22.3 Badges

| Badge | Trigger Condition |
|---|---|
| Pothole Hunter | Report 5 potholes |
| Light Keeper | Report 3 streetlight issues |
| Ghost Buster | Catch 2 false closures |
| Monsoon Watch | Report 3 waterlogging issues |
| First Responder | First to report an issue in their ward |
| RTI Warrior | File first RTI |
| Ward Legend | #1 on ward leaderboard for a full calendar month |
| Verified Voice | 10 of own reports verified by community |
| Streak Master | 14-day consecutive reporting streak |
| Explorer | Report issues in 5 different geographic zones |
| Safety Sentinel | Report 2 critical (danger level = critical) issues |
| Fact Checker | Successfully verify 20 peer reports |

### 22.4 Leaderboards
- Weekly leaderboard (resets every Monday)
- Monthly leaderboard (resets 1st of each month)
- All-time leaderboard
- Filter by: ward / zone / city
- Separate leaderboards: top reporters / top verifiers / top ghost busters
- Authority leaderboard: fastest average resolution time per department (publicly visible)
- Ward vs. ward monthly resolution rate ranking (public)

### 22.5 Community Peer Verification
- When a new ticket is submitted, system identifies 3 citizens in the same ward who have been active in the past 7 days
- They receive a push notification: "New issue reported near you — can you verify it?"
- They see the photo and location, vote: Real Issue / Cannot Confirm / Looks Fake
- 2/3 vote Real Issue → ticket status upgrades to VERIFIED, reporter +30 XP
- 2/3 vote Looks Fake → ticket flagged for Admin review (not auto-deleted)
- If no 3 active nearby citizens found within 2 hours → Gemini acts as backup verifier
- Verifier earns +20 XP per verification

### 22.6 Streaks & Challenges
- **Daily Streak**: report or verify at least one issue per day (displayed on profile)
- **Weekly Ward Challenge**: system generates contextual challenge (e.g., "Report 2 waterlogging issues this week" during monsoon)
- **Monthly Ward Challenge**: entire ward competes to achieve 90% resolution rate — top ward gets a digital "Clean Ward" badge on the public map
- **Seasonal Challenges**: monsoon-specific (waterlogging, drainage), winter-specific (fog-related streetlight importance)

### 22.7 Social Proof & Sharing
- "X people in your area reported this too" counter on every ticket
- Personal impact card on resolution: "Your report led to this being resolved"
- Shareable card: "I helped fix [issue] in [ward] — Join Community Hero"
- Monthly civic impact summary: total reports, resolved, XP earned, badges — shareable image
- Ward-level collective impact: "Ward 82 resolved 47 issues this month"

---

## 23. AI Features (All Gemini)

All AI features run server-side. The Gemini API key is never exposed to the client.

| # | Feature | Gemini Role |
|---|---|---|
| 1 | Issue Classification | Analyzes photo, suggests type/category/severity/dept/description |
| 2 | Weighted Severity Scoring | Considers image + GPS context (school/hospital/highway nearby) + season |
| 3 | Resolution Validation | Before/after photo comparison — gates resolution approval |
| 4 | Ghost Issue Detection | Two-image comparison detects false closures |
| 5 | Duplicate Detection | Cross-checks new report photo against existing nearby tickets |
| 6 | Predictive Issue Flagging | Historical data analysis → predicts future issues by zone and season |
| 7 | NLP Ticket Query Bot | Answers citizen plain-English questions about their ticket |
| 8 | Community Verification Assist | Backup verifier when no nearby active citizens available |
| 9 | RTI Document Generation | Legally structured RTI application from ticket data |
| 10 | First Appeal Generation | First Appeal document referencing original RTI |
| 11 | Ticket Description Generation | Writes issue description from photo — citizen just confirms |
| 12 | Department Routing Recommendation | Suggests optimal department based on issue + location + workload |
| 13 | Escalation Note Generation | Structured escalation summary when ticket auto-escalates |
| 14 | Monthly Ward Report Generation | Narrative performance report per ward for Admin |

**Total: 14 Gemini touchpoints across the full platform lifecycle.**

---

## 24. Technology Stack & Cost

### 24.1 Full Stack

| Layer | Technology | Cost |
|---|---|---|
| AI Engine | Gemini 2.0 Flash (Google AI Studio) | Free tier: 1,500 req/day, 15 req/min |
| Frontend | React.js | Free |
| Backend | Node.js / Express on Cloud Run | Free (Starter Tier: 2 apps) |
| Database | Firebase Firestore | Free (Spark): 50k reads/day, 20k writes/day, 1GB storage |
| Auth | Firebase Authentication | Free, unlimited |
| File Storage | Firebase Storage | Free: 5GB |
| Push Notifications | Firebase Cloud Messaging (FCM) | Free, unlimited |
| Maps | OpenStreetMap + Leaflet.js | Completely free, no card required |
| Geocoding | OpenStreetMap Nominatim API | Free |
| Translation | Google Translate API | $300 free trial credit — effectively free for hackathon |
| Deployment | Google AI Studio → Cloud Run Starter Tier | Free (no billing account needed) |
| WhatsApp Notifications | Twilio WhatsApp Sandbox (dev) | Free for testing |
| Email Notifications | EmailJS or Firebase Functions + nodemailer | Free tier sufficient |

### 24.2 Why OpenStreetMap Instead of Google Maps
- Google Maps Platform requires a billing account (credit card) even for free usage
- OpenStreetMap + Leaflet.js is completely free with no card required
- Supports all required features: interactive map, pins, layers, heatmap (via Leaflet plugins)
- Used by Swachh Nagar and multiple comparable civic platforms
- Decision: use OpenStreetMap for map rendering, OpenStreetMap Nominatim for reverse geocoding

### 24.3 Free Tier Risk Assessment

| Service | Daily Free Limit | Estimated Hackathon Usage | Risk |
|---|---|---|---|
| Gemini API | 1,500 req/day | ~200 req/day (demo) | Low |
| Firestore reads | 50,000/day | ~5,000/day | Low |
| Firestore writes | 20,000/day | ~500/day | Low |
| Firebase Storage | 5GB total | ~500MB | Low |
| FCM notifications | Unlimited | Low | None |
| Google Translate | $300 credit | Negligible | None |

**Verdict: Fully buildable and deployable at zero cost for this hackathon.**

---

## 25. Unique Differentiators

Compared to every other team building PS2:

1. **Ghost Issue Detection with Gemini two-image comparison** — detects fake resolutions automatically. No other team will have this.
2. **AI Suggests, Human Confirms** — Gemini classifications are editable by citizen before submission. Prevents wrong data from entering the system.
3. **Officer name publicly visible on every ticket** — personal accountability, not just departmental.
4. **AI-validated resolution proof** — officer cannot mark resolved without photo that passes Gemini's before/after check.
5. **Manual officer assignment from admin-managed staff database** — workload-balanced, department-filtered, not auto-assigned.
6. **Three separate interfaces** — citizen, officer, admin — each purpose-built, not a single jumbled view.
7. **Public pre-login landing page** — anyone can track and report without creating an account.
8. **RTI auto-draft with legal escalation ladder** — turns platform from complaint box into citizen rights tool.
9. **Predictive issue flagging** — AI acts before citizens report. Fully agentic.
10. **Authority leaderboard publicly visible** — institutional pressure, not just individual accountability.
11. **Contractor accountability score** — tracks which contractors consistently under-deliver across multiple tickets.
12. **Community peer verification** — spam prevention tied directly to gamification XP.
13. **Gemini as backup verifier** — AI steps in when no nearby active citizens are available.
14. **Ghost escalation after 3 instances** — systemic accountability, not just one-off flagging.
15. **Zero cost deployment** — entire stack runs on free tiers, no credit card required.

---

## 26. Evaluation Criteria Mapping

| Criterion | Weight | How Community Hero Addresses It |
|---|---|---|
| **Problem Solving & Impact** | 20% | Complete civic issue lifecycle: report → classify → assign → resolve → escalate → legal recourse. Ghost detection addresses the single biggest failure (fake resolutions) in Indian municipal systems. RTI ladder gives citizens real power. |
| **Agentic Depth** | 20% | Predictive issue flagging (acts before anyone reports), ghost detection (auto-reopens tickets), auto-escalation ladder (Day 7/14/30/60), Gemini backup verifier, RTI auto-generation, department routing — all operate without citizen trigger. |
| **Innovation & Creativity** | 20% | Ghost issue detection via two-image Gemini comparison is novel. RTI legal escalation is unprecedented in civic platforms. Officer public accountability with proof-gated resolution is unique. Predictive civic flagging has no precedent in hackathon projects. |
| **Usage of Google Technologies** | 15% | 14 Gemini touchpoints — Gemini is the backbone of every core feature, not an add-on. Firebase (Auth, Firestore, Storage, FCM), Google Translate API, Cloud Run deployment, Google AI Studio as build + deploy platform. |
| **Product Experience & Design** | 10% | Public landing page requires no login. Three purpose-built interfaces eliminate UI clutter. No-login ticket tracking. WhatsApp notifications meet citizens where they are. Multilingual UI (English/Hindi/Bengali). Resolution rating system closes the feedback loop. |
| **Technical Implementation** | 10% | Gemini JSON pipeline server-side (API key never exposed). Two-image comparison for ghost detection. GPS-based duplicate detection with 50m radius. Firebase real-time listeners for live status updates. OpenStreetMap for zero-cost mapping. Admin staff database with workload-balanced assignment dropdown. |
| **Completeness & Usability** | 5% | Every user journey is complete: citizen (report → track → RTI), officer (acknowledge → work → prove resolution), admin (manage staff → assign → report). No dead ends in any flow. |

---

## 27. Deployment Plan

### 27.1 Build & Deploy Stack
| Component | Tool |
|---|---|
| Build Platform | Google AI Studio Build Mode |
| Backend Hosting | Google Cloud Run (Starter Tier — free) |
| Frontend | React app served via Cloud Run |
| Database | Firebase Firestore (Spark Plan) |
| File Storage | Firebase Storage |
| Auth | Firebase Authentication |
| AI | Gemini 2.0 Flash API (server-side only) |

### 27.2 Deployment Steps
1. Build application in Google AI Studio Build Mode
2. Connect Firebase project (Spark Plan — free)
3. Set environment variables (Gemini API key, Firebase config) in AI Studio
4. Click Publish → Get Started → Publish App
5. Cloud Run URL generated — this is the submission link
6. Test all three interfaces (citizen, officer, admin) on live URL
7. Ensure URL remains active throughout evaluation period

### 27.3 Environment Configuration
```
GEMINI_API_KEY=           # Server-side only, never in client bundle
FIREBASE_PROJECT_ID=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=
TRANSLATE_API_KEY=        # Server-side only
NODE_ENV=production
```

### 27.4 Submission Checklist
- [ ] Deployed application link (Cloud Run URL) — live and accessible
- [ ] GitHub repository — source code + documentation
- [ ] Google Doc — Problem Statement, Solution Overview, Key Features, Technologies, Google Technologies
- [ ] Google Doc accessible to anyone with link
- [ ] Deployed URL active throughout evaluation period
- [ ] All three interfaces functional: citizen, officer, admin
- [ ] Gemini API working on deployed instance
- [ ] Firebase connected and real-time updates working

---

*Community Hero — Product Requirements Document v2.0 (Final)*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
*Problem Statement: PS2 — Community Hero: Hyperlocal Problem Solver*
