# User Flow & Feature Specification
## Community Hero — All Three Interfaces
**Version:** 1.0
**Date:** June 2026
**Document Type:** Detailed UI/UX Flow + Feature Specification

---

## Table of Contents

1. [App Architecture](#1-app-architecture)
2. [Public Landing Page](#2-public-landing-page)
3. [Citizen Interface](#3-citizen-interface)
4. [Officer Interface](#4-officer-interface)
5. [Admin Interface](#5-admin-interface)
6. [Shared Components](#6-shared-components)
7. [Navigation Map](#7-navigation-map)

---

## 1. App Architecture

### 1.1 Single Web App, Three Interfaces

One React SPA deployed on Cloud Run. Role-based routing determines which interface loads after login.

```
https://community-hero.app/              → Public Landing Page
https://community-hero.app/citizen       → Citizen Dashboard
https://community-hero.app/officer       → Officer Dashboard
https://community-hero.app/admin         → Admin Dashboard
https://community-hero.app/track/:id     → Public Ticket Tracker (no login)
```

### 1.2 Entry Flow

```
User visits app
      |
Public Landing Page
      |
┌─────┴──────────────────────────────┐
│                                    │
Track ticket (no login)         Choose role
                                     |
                         ┌───────────┼───────────┐
                         |           |           |
                      Citizen     Officer      Admin
                      (Google    (Email +     (Email +
                      Sign-In    Password)    Password)
                      optional)
                         |           |           |
                    Citizen      Officer      Admin
                    Dashboard   Dashboard    Dashboard
```

### 1.3 Responsive Design

- Desktop-first (1280px+), works on tablet (768px+)
- Mobile-ready layout — all touch targets 44px minimum
- Same codebase → React Native later for mobile app

---

## 2. Public Landing Page

**URL:** `/`
**Auth:** None required
**Purpose:** Anyone can report, track, and browse without an account

---

### 2.1 Top Navigation Bar

```
[ Community Hero Logo ]                    [ Track Issue ] [ Report Issue ] [ Login ▾ ]
                                                                                |
                                                                    ┌──────────┴──────────┐
                                                                    │  Login as Citizen    │
                                                                    │  Login as Officer    │
                                                                    │  Login as Admin      │
                                                                    └─────────────────────┘
```

**Buttons:**
- `Track Issue` → scrolls to Track section on page
- `Report Issue` → scrolls to Report section or opens report modal
- `Login ▾` → dropdown with three role options, each routes to correct login screen

---

### 2.2 Hero Section

**Headline:** "Fix your city. One photo at a time."
**Subheadline:** "Report potholes, broken streetlights, waterlogging, and more. We make sure someone is held responsible."

**Two primary CTAs:**
- `📷 Report an Issue` → opens report flow (no login required)
- `🔍 Track My Ticket` → scrolls to track section

**Live stats bar (real-time from Firestore):**
```
[ 1,247 Issues Reported ]  [ 891 Resolved ]  [ 43 In Progress ]  [ Ward 82: B+ ]
```

---

### 2.3 Report Issue (No Login Required)

Step-by-step inline form on the landing page. Citizen does not need an account.

**Step 1 — Upload Photo**
- Large drag-and-drop zone: "Drop your photo here or tap to upload"
- Camera capture button (mobile)
- Accepted: JPG, PNG, WEBP, max 10MB
- On upload: spinner → "AI is analyzing your photo..."
- Photo preview shown after upload

**Step 2 — Review AI Suggestions (all editable)**

Form fields, each labeled with "AI suggested ✦" badge:

| Field | Type | AI Pre-fills | Editable |
|---|---|---|---|
| Issue Type | Dropdown | Yes | Yes |
| Category | Dropdown | Yes | Yes |
| Severity | Slider 1–10 | Yes | Yes |
| Danger Level | Radio: Safe / Moderate / Critical | Yes | Yes |
| Department | Dropdown | Yes | Yes |
| Description | Text area (max 500 chars) | Yes (one-liner) | Yes |

Below each AI-filled field: small note — *"AI suggested this based on your photo. Change it if needed."*

**Step 3 — Location**
- Map pin shown on OpenStreetMap (auto from GPS)
- Address shown: "Near Gariahat Market, Ward 82, Kolkata"
- `Adjust pin` button → drag pin to correct location
- Manual address entry fallback if GPS unavailable

**Step 4 — Contact (Optional)**
- Phone number for WhatsApp updates (optional)
- Email for notifications (optional)
- Note: "Leave blank to submit anonymously. You can still track with your ticket ID."

**Step 5 — Submit**
- `Submit Report` button
- If duplicate detected: modal shown:
  ```
  ┌────────────────────────────────────────────┐
  │  Similar issue already reported nearby     │
  │                                            │
  │  KOL-2026-00089 — Pothole                  │
  │  Near Gariahat Market — Reported 2 days ago│
  │  Status: In Progress                       │
  │                                            │
  │  [ 👍 Upvote existing ticket ]             │
  │  [ Submit mine anyway (different issue) ]  │
  └────────────────────────────────────────────┘
  ```
- On success: full-screen confirmation:
  ```
  ✅ Report submitted!
  Your Ticket ID: KOL-2026-00142
  We've sent tracking details to your WhatsApp/email.
  [ 🔍 Track this ticket ]  [ Report another issue ]
  ```

---

### 2.4 Track Ticket (No Login)

Simple lookup form:

```
┌─────────────────────────────────────────────┐
│  Enter your Ticket ID                       │
│  ┌──────────────────────────┐  [ Track ]    │
│  │  KOL-2026-XXXXX          │               │
│  └──────────────────────────┘               │
└─────────────────────────────────────────────┘
```

**On valid ticket ID — shows full Public Ticket View:**

```
┌──────────────────────────────────────────────────────────┐
│  KOL-2026-00142                              IN PROGRESS  │
│  Pothole — Roads & Infrastructure                        │
│  Near Gariahat Market, Ward 82, Kolkata                  │
├──────────────────────────────────────────────────────────┤
│  TIMELINE                                                │
│  ✅ Reported       22 Jun 2026, 3:42 PM                  │
│  ✅ Verified       23 Jun 2026, 10:15 AM  (3 neighbors)  │
│  ✅ Assigned       23 Jun 2026, 2:00 PM                  │
│  🔄 In Progress    24 Jun 2026, 9:00 AM                  │
│  ⏳ Resolved       Pending                               │
├──────────────────────────────────────────────────────────┤
│  ASSIGNED OFFICER                                        │
│  👤 Rajesh Kumar                                         │
│  🏢 Roads & Infrastructure Dept.                         │
│  📅 SLA Deadline: 1 Jul 2026, 2:00 PM (7 days left)     │
├──────────────────────────────────────────────────────────┤
│  PHOTOS                                                  │
│  [ Original Report Photo ]                               │
├──────────────────────────────────────────────────────────┤
│  ASK A QUESTION                                          │
│  ┌──────────────────────────────┐  [ Ask ]              │
│  │  Why hasn't this moved?      │                       │
│  └──────────────────────────────┘                       │
│  🤖 "Your issue is assigned to Rajesh Kumar (Roads      │
│     Dept). SLA deadline is 1 Jul. Currently In          │
│     Progress — work order raised on 24 Jun."            │
├──────────────────────────────────────────────────────────┤
│  👍 Me Too (3 others reported this)                      │
│                                                          │
│  [ 👍 Me Too ]   [ 🔁 Reopen (available after resolve) ]│
└──────────────────────────────────────────────────────────┘
```

**Buttons on public ticket view:**
- `Ask` → sends question to NLP bot, response shown inline
- `👍 Me Too` → increments upvote count, requires phone/email to link (optional)
- `🔁 Reopen` → visible 7 days after resolution, requires new photo upload
- `📄 Download RTI Draft` → visible at Day 30 if unresolved

---

### 2.5 Community Map (Public)

Full-width interactive map below the report section.

**Controls:**
```
[ All Categories ▾ ]  [ All Wards ▾ ]  [ All Statuses ▾ ]  [ 🔴 Critical only ]
```

**Map pins:**
- 🔴 Red pin = Critical / danger level critical
- 🟠 Orange pin = High severity (7–9)
- 🟡 Yellow pin = Medium severity (4–6)
- 🟢 Green pin = Resolved
- 🔵 Blue dashed = AI Predicted (not yet reported)

**On pin click:**
```
┌──────────────────────────────────┐
│  KOL-2026-00142                  │
│  🕳️ Pothole — IN PROGRESS        │
│  Ward 82, Near Gariahat Market   │
│  Severity: 7/10 | 3 upvotes      │
│  SLA: 1 Jul 2026                 │
│  [ View Full Ticket ]            │
└──────────────────────────────────┘
```

**Heatmap toggle:**
- `[ 🔥 Show Heatmap ]` → overlays density layer on map

---

### 2.6 Civic Health Scores (Public)

Ward-by-ward scorecard:

```
Ward 82    ████████░░  B+   47 resolved / 52 total this month
Ward 83    ██████░░░░  C+   31 resolved / 58 total this month
Ward 84    █████████░  A-   61 resolved / 65 total this month
```

**Clicking any ward** → filters community map to that ward

---

## 3. Citizen Interface

**URL:** `/citizen`
**Auth:** Optional Google Sign-In (anonymous reporting allowed, but account needed for gamification)
**Layout:** Sidebar navigation (desktop) / Bottom tab bar (mobile-ready)

---

### 3.1 Sidebar Navigation

```
┌─────────────────────┐
│  🏘️ Community Hero  │
│  ─────────────────  │
│  🏠 Home            │
│  📷 Report Issue    │
│  📋 My Tickets      │
│  🗺️ Community Map   │
│  🏆 Leaderboard     │
│  👤 My Profile      │
│  ─────────────────  │
│  🔔 3 notifications │
│  ─────────────────  │
│  [ Logout ]         │
└─────────────────────┘
```

---

### 3.2 Home / Feed

**Top bar:**
```
Good morning, Arjun 👋              [ 🔔 3 ]
Ward 82 • Civic Score: B+  ↑ from C last month
```

**My active tickets strip:**
```
YOUR TICKETS
┌──────────────────┐  ┌──────────────────┐
│ KOL-2026-00142   │  │ KOL-2026-00138   │
│ Pothole          │  │ Broken Light     │
│ 🔄 In Progress   │  │ ✅ Resolved      │
│ 7 days left      │  │ Tap to rate ⭐   │
└──────────────────┘  └──────────────────┘
[ + Report new issue ]
```

**Nearby issues feed (from Firestore realtime):**
```
NEAR YOU — WARD 82
──────────────────────────────────────────────────
🔴  Open Manhole          50m away    CRITICAL
    Reported 2 hrs ago • 8 upvotes
    [ 👍 Me Too ]  [ View ]

🟠  Waterlogging           120m away   HIGH
    Reported yesterday • 3 upvotes
    [ 👍 Me Too ]  [ View ]

🔵  AI Predicted: Pothole  200m away   PREDICTED
    Monsoon risk zone — pre-flagged by AI
    [ View Prediction ]
──────────────────────────────────────────────────
```

**Gamification widget:**
```
YOUR PROGRESS
XP: 1,240  ━━━━━━━━░░  Active Resident → Community Guardian (260 XP to go)
🔥 7-day streak active!
🏅 New badge earned: Monsoon Watch
[ View all badges ]
```

**Weekly ward challenge:**
```
THIS WEEK'S CHALLENGE
Report 2 waterlogging issues in Ward 82
Progress: 1 / 2  ━━━━━░░░░░
Reward: +100 XP + Monsoon Watch badge
[ Go Report ]
```

---

### 3.3 Report Issue

Full multi-step reporting flow (same as landing page but inside dashboard).

**Step indicator:**
```
① Upload Photo  →  ② Review AI  →  ③ Location  →  ④ Contact  →  ⑤ Submit
```

**Step 1 — Upload Photo**
- Drag-drop zone + camera button
- Shows photo preview immediately on upload
- Spinner with text: "Gemini is analyzing your photo..."
- If Gemini fails: "AI unavailable — please fill in the details manually"

**Step 2 — Review AI Suggestions**

Each field shows:
- Field label
- AI-suggested value (pre-filled)
- "AI ✦" badge on each field
- Full edit capability

```
Issue Type      [ Pothole ▾ ]              ✦ AI suggested
Category        [ Infrastructure ▾ ]       ✦ AI suggested
Severity        [ ━━━━━━━░░░ 7 ]           ✦ AI suggested
Danger Level    ○ Safe  ● Moderate  ○ Critical   ✦ AI suggested
Department      [ Roads & Infrastructure ▾ ]   ✦ AI suggested
Description     [ Large pothole on main road... ]   ✦ AI suggested
                (420/500 characters)
```

**If severity is 9–10 or danger = Critical:**
```
⚠️ CRITICAL ISSUE DETECTED
This will be marked as high priority and fast-tracked
to the senior officer queue.
```

**Step 3 — Location**
- OpenStreetMap with auto pin
- Reverse-geocoded address shown
- `Adjust pin` drag functionality
- Manual search bar: "Search for a location"

**Step 4 — Contact (Optional)**
```
Get updates on this report (optional)
Phone (WhatsApp)  [ +91 __________ ]
Email             [ ________________ ]

☑ Send me WhatsApp updates when status changes
☑ Send me email updates

Note: Leave blank to submit anonymously.
You can still track with your ticket ID.
```

**Step 5 — Submit**
- Duplicate check runs silently
- If duplicate: show modal (see Section 2.3)
- Success screen with ticket ID + share button

**After submit — XP earned toast:**
```
🎉 +50 XP earned for submitting your first report!
```

---

### 3.4 My Tickets

**Filter bar:**
```
[ All ] [ Unassigned ] [ In Progress ] [ Resolved ] [ Escalated ] [ Overridden ]
```

**Each ticket card:**
```
┌────────────────────────────────────────────────────────┐
│  KOL-2026-00142                      🔄 IN PROGRESS    │
│  🕳️ Pothole — Roads & Infrastructure                   │
│  Near Gariahat Market, Ward 82                         │
│  Reported: 22 Jun 2026                                 │
│  Assigned to: Rajesh Kumar                             │
│  SLA: 1 Jul 2026 (7 days left)           ████████░░   │
│                                                        │
│  [ 🔍 View Details ] [ 💬 Ask a Question ] [ 👍 3 ]   │
└────────────────────────────────────────────────────────┘
```

**Ticket Detail View (expanded):**

Full page with tabs:

**Tab 1: Timeline**
```
✅ Reported       22 Jun, 3:42 PM    You submitted this report
✅ Verified       23 Jun, 10:15 AM   3 neighbors confirmed this issue
✅ Assigned       23 Jun, 2:00 PM    Rajesh Kumar assigned by Admin
🔄 In Progress    24 Jun, 9:00 AM    Officer acknowledged
⏳ Resolved       Pending
```

**Tab 2: Officer Info**
```
👤 Rajesh Kumar
🏢 Roads & Infrastructure Department
🎖️ Junior Engineer
📅 Assigned: 23 Jun 2026, 2:00 PM
⏰ SLA Deadline: 1 Jul 2026, 2:00 PM
📊 Officer resolution rate: 87%
```

**Tab 3: Photos**
```
ORIGINAL REPORT PHOTO
[ photo thumbnail ]
Taken: 22 Jun 2026, 3:40 PM

RESOLUTION PHOTO (once resolved)
[ pending ]
```

**Tab 4: Ask a Question**
```
┌──────────────────────────────────────────┐
│  Type your question...                   │
└──────────────────────────────────────────┘  [ Ask ]

PREVIOUS QUESTIONS
──────────────────────────────────────────
You: "Why hasn't this been resolved yet?"
🤖 AI: "Your issue is assigned to Rajesh Kumar
       (Roads Dept, Ward 82). SLA deadline is
       1 Jul 2026. It is currently In Progress —
       a work order was raised on 24 Jun."
22 Jun 2026, 4:15 PM
```

**Tab 5: Actions**

Actions available depend on ticket status:

| Status | Available Actions |
|---|---|
| UNASSIGNED | Upvote, Ask question, Edit description |
| VERIFIED | Upvote, Ask question |
| ASSIGNED | Upvote, Ask question |
| IN_PROGRESS | Upvote, Ask question |
| RESOLVED (< 7 days) | Rate resolution ⭐, Ask question |
| RESOLVED (> 7 days) | Reopen (ghost), Rate, Ask |
| UNRESOLVED > 30 days | Download RTI Draft, Ask, Upvote |
| ESCALATED | Ask question, Track escalation |

**Reopen (Ghost) Flow:**
```
┌────────────────────────────────────────────────┐
│  Is this issue still not fixed?                │
│                                                │
│  Upload a new photo as proof                   │
│  [ 📷 Take photo ] or [ 📁 Upload ]            │
│                                                │
│  AI will compare your photo to the resolution  │
│  photo and determine if this was truly fixed.  │
│                                                │
│  [ Submit Reopen Request ]  [ Cancel ]         │
└────────────────────────────────────────────────┘
```

**RTI Draft Flow (Day 30+):**
```
┌────────────────────────────────────────────────┐
│  📋 File an RTI                                │
│                                                │
│  Your issue has been unresolved for 32 days.  │
│  An RTI (Right to Information) application    │
│  has been auto-generated.                     │
│                                               │
│  Addressed to: KMC Roads Department          │
│  RTI Authority: Municipal Commissioner, KMC  │
│  Issue: KOL-2026-00142 — Pothole             │
│  Days unresolved: 32                         │
│  Evidence: 2 photos attached                 │
│                                              │
│  [ 📄 Preview RTI Document ]                 │
│  [ ⬇️ Download PDF ]                         │
│  [ 📧 Email to RTI Portal ]                  │
│  [ Cancel ]                                  │
└──────────────────────────────────────────────┘
```

**Resolution Rating (after RESOLVED):**
```
┌────────────────────────────────────────────────┐
│  How was your issue resolved?                  │
│                                                │
│  BEFORE                     AFTER              │
│  [ original photo ]   →   [ resolution photo ] │
│  Reported: 22 Jun         Resolved: 28 Jun     │
│                           ✅ Verified by AI    │
│                                                │
│  Rate this resolution:                         │
│  ★ ★ ★ ★ ☆  (tap to rate)                     │
│                                                │
│  Comment (optional):                           │
│  [ The pothole has been filled properly    ]   │
│                                                │
│  [ Submit Rating ]                             │
└────────────────────────────────────────────────┘
```

---

### 3.5 Community Map

Same as public map but with additional features for logged-in citizens:

**Additional controls (logged-in only):**
```
[ 📍 Center on my ward ]  [ 👁️ Show my reports ]  [ 🔵 Show predictions ]
```

**My reports shown with a special marker (star pin)**

**Prediction detail panel:**
```
🔵 AI PREDICTED ISSUE
Predicted: Pothole
Zone: Near Gariahat Flyover, Ward 82
Probability: 84%
Reason: Road last repaired 2019, monsoon
         incoming, 12 reports here last July
Recommended action: Inspect road section

[ 📢 Notify Ward Officer ]  (sends alert to admin)
```

---

### 3.6 Leaderboard

**Tabs:**
```
[ 🏆 Reporters ] [ ✅ Verifiers ] [ 👁️ Ghost Busters ] [ 🏛️ Authority ]
```

**Time filter:**
```
[ This Week ] [ This Month ] [ All Time ]
```

**Ward filter:**
```
[ My Ward (82) ] [ All Wards ] [ Zone North ]
```

**Reporter leaderboard:**
```
RANK   CITIZEN          WARD     REPORTS   XP       LEVEL
─────────────────────────────────────────────────────────
🥇 1   Priya S.         Ward 84   47       8,200    Civic Hero
🥈 2   Arjun M.         Ward 82   31       5,400    Ward Champion
🥉 3   Riya D.          Ward 83   28       4,800    Ward Champion
   4   Soumya B.        Ward 82   22       3,100    Community Guardian
   5   Rahul K.         Ward 85   19       2,700    Community Guardian
─── YOU ARE RANKED #2 IN WARD 82 ───
```

**Authority leaderboard tab:**
```
FASTEST RESOLVING DEPARTMENTS THIS MONTH
Dept.                    Avg. Days   Issues   Rate
─────────────────────────────────────────────────
🥇 Water Supply          2.4 days    34       91%
🥈 Electricity           3.1 days    28       88%
🥉 Roads & Infra.        4.7 days    61       79%
   Sanitation            6.2 days    43       71%
   Parks & Rec.          8.1 days    17       65%
```

**Ghost Busters leaderboard:**
```
RANK   CITIZEN        GHOSTS CAUGHT   BADGE
──────────────────────────────────────────
🥇 1   Priya S.       7               👁️ Ghost Master
🥈 2   Arjun M.       3               👁️ Ghost Buster
🥉 3   Ananya T.      2               👁️ Ghost Buster
```

---

### 3.7 My Profile

```
┌───────────────────────────────────────────────────────┐
│  👤 Arjun Mukherjee                  [ Edit Profile ] │
│  Ward 82, Kolkata                                     │
│  Member since: Jan 2026                               │
├───────────────────────────────────────────────────────┤
│  LEVEL                                                │
│  ⭐ Active Resident                                   │
│  1,240 XP  ━━━━━━━━░░  260 XP to Community Guardian  │
├───────────────────────────────────────────────────────┤
│  STATS                                                │
│  Total Reports      12      Ghost Catches    1        │
│  Resolved           9       RTIs Filed       0        │
│  Verifications      14      Streaks          7 days   │
├───────────────────────────────────────────────────────┤
│  BADGES (4 / 12 earned)                               │
│  🔥 First Responder    🕳️ Pothole Hunter               │
│  🌧️ Monsoon Watch      🤝 Verified Voice               │
│  ░ Light Keeper        ░ Ghost Buster    [ See all ]  │
├───────────────────────────────────────────────────────┤
│  IMPACT THIS MONTH                                    │
│  You helped resolve 4 issues in Ward 82               │
│  [ 📤 Share my impact ]                               │
├───────────────────────────────────────────────────────┤
│  SETTINGS                                             │
│  [ 🔔 Notification Preferences ]                      │
│  [ 🌐 Language: English ▾ ]                           │
│  [ 📍 My Ward: Ward 82 ▾ ]                            │
│  [ 🔗 Linked WhatsApp: +91-XXXXXX ]                   │
│  [ 🚪 Logout ]                                        │
└───────────────────────────────────────────────────────┘
```

**Notification Preferences panel:**
```
NOTIFY ME WHEN...
☑ My ticket status changes        via WhatsApp + Email
☑ My report is verified           via Push notification
☑ My report is assigned           via WhatsApp + Email
☑ My report is resolved           via WhatsApp + Email
☑ Nearby critical issue reported  via Push notification
☑ New weekly challenge            via Push notification
☐ Nearby predictions flagged      via Push notification
```

**Share Impact Card:**
```
┌────────────────────────────────┐
│      Community Hero 🏘️         │
│                                │
│   Arjun helped fix             │
│   4 issues in Ward 82          │
│   this month                   │
│                                │
│   Active Resident ⭐            │
│   1,240 XP | 7-day streak 🔥   │
│                                │
│   Join at community-hero.app   │
└────────────────────────────────┘
[ Copy Image ]  [ Share on WhatsApp ]
```

---

### 3.8 Notifications Panel

Slide-in panel from top-right bell icon:

```
NOTIFICATIONS (3 unread)
────────────────────────────────────────────
🔄  KOL-2026-00142 is now IN PROGRESS       [2h ago]
    Rajesh Kumar started work
    [ View Ticket ]

✅  KOL-2026-00138 has been RESOLVED        [1d ago]
    Tap to rate the resolution
    [ Rate Now ]

🏅  New badge earned: Monsoon Watch!         [2d ago]
    You reported 3 waterlogging issues
    [ View Profile ]
────────────────────────────────────────────
[ Mark all as read ]  [ Notification settings ]
```

---

## 4. Officer Interface

**URL:** `/officer`
**Auth:** Mandatory — Admin-created account only
**Layout:** Sidebar navigation + main content area

---

### 4.1 Sidebar Navigation

```
┌──────────────────────┐
│  🏘️ Community Hero   │
│  Officer Portal      │
│  ──────────────────  │
│  📊 My Dashboard     │
│  📋 My Queue         │
│  ✅ Resolved Cases   │
│  💬 Queries Inbox    │
│  📈 My Performance   │
│  ──────────────────  │
│  🔔 5 notifications  │
│  ──────────────────  │
│  👤 Rajesh Kumar     │
│  Roads & Infra.      │
│  Ward 82, 83         │
│  [ Logout ]          │
└──────────────────────┘
```

---

### 4.2 Officer Dashboard (Home)

**Header:**
```
Good morning, Rajesh 👋
Roads & Infrastructure • Ward 82, Ward 83
```

**Stats row:**
```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Active    │  │  SLA       │  │  Resolved  │  │ Resolution │
│  Cases     │  │  Breaching │  │  This Month│  │  Rate      │
│    4       │  │    1 ⚠️    │  │    12      │  │   87%      │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

**Critical alerts banner (if any):**
```
⚠️ URGENT: KOL-2026-00149 (Open Manhole) SLA breaches in 6 hours
[ View Ticket ]
```

**Active cases quick view:**
```
ACTIVE CASES — sorted by SLA urgency
──────────────────────────────────────────────────────────
🔴  KOL-2026-00149   Open Manhole      SLA: 6 hrs left
🟠  KOL-2026-00142   Pothole           SLA: 7 days left
🟡  KOL-2026-00145   Broken Light      SLA: 10 days left
🟢  KOL-2026-00141   Waterlogging      SLA: 14 days left
──────────────────────────────────────────────────────────
[ View full queue ]
```

**Query inbox preview:**
```
PENDING QUERIES (2)
──────────────────────────────────────────────────────────
KOL-2026-00142: "Why hasn't this been resolved yet?"
                                            2 hrs ago  [ Reply ]
KOL-2026-00141: "Is the officer aware of this?"
                                            5 hrs ago  [ Reply ]
──────────────────────────────────────────────────────────
```

---

### 4.3 My Queue

**Filter / Sort bar:**
```
[ All ] [ Unacknowledged ] [ In Progress ] [ SLA Breaching ]

Sort by: [ SLA Urgency ▾ ]   Ward: [ All ▾ ]   Category: [ All ▾ ]
```

**Each ticket card in queue:**
```
┌────────────────────────────────────────────────────────────┐
│  🔴 KOL-2026-00149                      CRITICAL           │
│  Open Manhole — Sanitation Department                      │
│  Near Lake Market, Ward 82                                 │
│  Reported: 24 Jun 2026, 8:00 AM   Severity: 9/10          │
│  Upvotes: 7   Verifications: 3/3                           │
│  ⚠️ SLA DEADLINE: 24 Jun 2026, 3:00 PM (6 hrs left)       │
│                                                            │
│  [ 📋 View Details ]  [ ▶️ Acknowledge ]  [ ✅ Resolve ]   │
└────────────────────────────────────────────────────────────┘
```

**Buttons on queue card:**
- `View Details` → opens full ticket detail page
- `Acknowledge` → moves status to IN_PROGRESS, sends notification to citizen
- `Resolve` → opens resolution upload flow

---

### 4.4 Ticket Detail View (Officer)

**Ticket header:**
```
KOL-2026-00142                                     🔄 IN PROGRESS
Pothole — Roads & Infrastructure — Ward 82
Reported by: Anonymous | 22 Jun 2026, 3:42 PM
SLA Deadline: 1 Jul 2026 | 7 days remaining         ████████░░
```

**Tabs:**

**Tab 1: Issue Details**
```
PHOTO
[ Report photo ]

AI CLASSIFICATION (original)           CITIZEN CONFIRMED
Issue Type: Pothole                     Issue Type: Pothole ← same
Severity: 7                            Severity: 7
Department: Roads & Infrastructure      Department: Roads & Infra.
Confidence: 89%

CITIZEN DESCRIPTION
"Large pothole near the Gariahat flyover entrance,
causing vehicle damage. Approx 2 feet wide."

LOCATION
[ Mini OpenStreetMap with pin ]
Near Gariahat Market, Ward 82, Kolkata
GPS: 22.5204°N, 88.3467°E
```

**Tab 2: Timeline & Audit**
```
✅ Reported       22 Jun, 3:42 PM    Anonymous citizen
✅ Verified       23 Jun, 10:15 AM   3 peer verifications (Priya S., Arjun M., +1)
✅ Assigned       23 Jun, 2:00 PM    Assigned by Admin Kumar → Rajesh Kumar
                                     Admin note: "High traffic zone, urgent"
🔄 Acknowledged   24 Jun, 9:00 AM    Rajesh Kumar marked In Progress
```

**Tab 3: Internal Notes (officer-only, not visible to citizen)**
```
Add internal note...
┌──────────────────────────────────────────────────┐
│                                                  │
└──────────────────────────────────────────────────┘
[ Save Note ]

PREVIOUS NOTES
──────────────────────────────────────────────────
Rajesh Kumar | 24 Jun, 9:05 AM
"Visited site. Pothole ~2ft wide, 6in deep.
Contractor ABC notified, scheduled repair 26 Jun."
```

**Tab 4: Actions**

```
AVAILABLE ACTIONS
──────────────────────────────────────────────────

[ ✅ Mark as Resolved ]
  Upload resolution photo required. Gemini will
  validate before/after. Cannot skip.

[ 🔄 Request Reassignment ]
  Reason required. Goes to Admin for approval.

[ ⚠️ Request Override ]
  Use only for: false reports, natural resolution,
  or already resolved by another department.
  Reason required. Senior Officer must approve.

[ 📝 Add Update ]
  Send a status note visible on the public ticket.
```

**Mark as Resolved flow:**
```
RESOLVE TICKET KOL-2026-00142

Step 1: Upload resolution photo
┌──────────────────────────────────────┐
│  📷 Take photo now (recommended)     │
│  or                                  │
│  📁 Upload from gallery              │
│                                      │
│  Tip: Take from the same angle as    │
│  the original photo for best AI      │
│  validation accuracy.                │
└──────────────────────────────────────┘

Step 2: Add resolution note (optional)
┌──────────────────────────────────────┐
│  Pothole filled with asphalt by      │
│  contractor XYZ on 26 Jun 2026.      │
└──────────────────────────────────────┘

[ Submit Resolution ]
```

**After submit — Gemini validates:**
```
🔄 Gemini AI is comparing your photo to the original...

✅ VALIDATION PASSED (Confidence: 91%)
   ✔ Same location confirmed
   ✔ Issue visibly resolved
   ✔ Photo timestamp valid

Ticket KOL-2026-00142 marked as RESOLVED.
Citizen notified via WhatsApp.
```

**If validation fails:**
```
❌ VALIDATION FAILED (Confidence: 44%)
   ✔ Same location confirmed
   ✗ Issue still visible in your photo
   ✔ Photo timestamp valid

Reason: The pothole appears to still be present
in your resolution photo.

Please re-visit the site and upload a new photo.
Retries remaining: 2 of 3

[ Upload new photo ]  [ Request Override ]
```

**Request Override flow:**
```
REQUEST MANUAL OVERRIDE
──────────────────────────────────────────────
Reason for override: (required)
○ Issue does not exist / false report
○ Already resolved by another department
○ Natural resolution (e.g. rain cleared waterlogging)
○ Other (explain below)

Reference ticket (if resolved by another dept.):
[ KOL-2026-______ ]

Explanation: (minimum 20 characters)
┌──────────────────────────────────────┐
│                                      │
└──────────────────────────────────────┘

This request will be sent to your Senior Officer
for approval before the ticket is closed.

[ Submit Override Request ]  [ Cancel ]
```

---

### 4.5 Queries Inbox

**Layout:**
```
QUERIES INBOX — 2 pending
─────────────────────────────────────────────────────────
Filter: [ All ] [ Pending ] [ Replied ] [ Overdue ]
─────────────────────────────────────────────────────────
⚠️ KOL-2026-00142                         OVERDUE (26 hrs)
   Citizen asked: "Why hasn't this been resolved yet?"
   [ Quick Reply ] [ Full Thread ]

● KOL-2026-00141                          PENDING (2 hrs)
   Citizen asked: "Is the officer aware of this issue?"
   [ Quick Reply ] [ Full Thread ]
─────────────────────────────────────────────────────────
```

**Reply flow:**
```
REPLY TO KOL-2026-00142

Citizen asked:
"Why hasn't this been resolved yet?" — 22 Jun, 4:15 PM

QUICK TEMPLATES
[ Work order raised ]  [ Contractor assigned ]
[ Site inspection done ]  [ Awaiting materials ]

Or type custom reply:
┌──────────────────────────────────────────────────┐
│  A work order was raised on 24 Jun. Contractor   │
│  has been assigned and repair is scheduled for   │
│  26 Jun 2026.                                    │
└──────────────────────────────────────────────────┘
(This reply will be visible to the citizen on their ticket)

[ Send Reply ]  [ Cancel ]
```

---

### 4.6 Resolved Cases

**Filter:**
```
[ This Week ] [ This Month ] [ All Time ]
Sort: [ Most Recent ▾ ]
```

**Each resolved card:**
```
┌────────────────────────────────────────────────────┐
│  ✅ KOL-2026-00138      RESOLVED — 20 Jun 2026      │
│  Broken Streetlight — Ward 83                      │
│  Resolved in: 3.2 days (SLA: 7 days) ✓ On time    │
│  Citizen rating: ⭐⭐⭐⭐⭐                            │
│  AI validation: Passed (confidence 94%)            │
│  [ View Details ]                                  │
└────────────────────────────────────────────────────┘
```

**Ghost alert (if applicable):**
```
⚠️ GHOST FLAGGED — KOL-2026-00133
   This ticket was marked resolved but the citizen
   re-reported the same issue 5 days later.
   AI confirmed: same issue, not truly resolved.
   Status: Reopened | Your accountability score: -10 pts
   [ View Details ]  [ Contest Ghost Flag ]
```

---

### 4.7 My Performance

```
MY PERFORMANCE DASHBOARD
────────────────────────────────────────────────────

OVERALL SCORE: 84 / 100    ████████░░

METRICS
Resolution Rate      87%    ████████░░  (Ward avg: 79%)
Avg. Resolution Time 4.3 days           (Dept avg: 5.1 days)
SLA Breaches         2      ← 2 tickets exceeded deadline
Ghost Closures       1      ← 1 false resolution detected
Overrides Used       2      ← 2 manual overrides applied
Citizen Rating       4.1 / 5.0  ⭐⭐⭐⭐☆

CASE HISTORY
Total Assigned       47
Resolved             41
In Progress          4
Escalated            2

MONTHLY TREND
Jun  ██████████  12 resolved  4.3 days avg
May  ████████░░  9 resolved   5.1 days avg
Apr  ███████░░░  8 resolved   5.8 days avg
```

---

## 5. Admin Interface

**URL:** `/admin`
**Auth:** Mandatory — Admin account only
**Layout:** Top navigation + sidebar + main content area

---

### 5.1 Top Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏘️ Community Hero Admin     Ward: [ All ▾ ]   [ 🔔 12 ] [ Admin ▾ ]│
└─────────────────────────────────────────────────────────────────────┘
```

**Admin dropdown:**
```
[ 👤 My Account ]
[ ⚙️ System Settings ]
[ 📤 Export Data ]
[ 🚪 Logout ]
```

---

### 5.2 Sidebar Navigation

```
┌──────────────────────────┐
│  📊 Overview             │
│  📥 Unassigned Queue  8  │
│  📋 All Tickets          │
│  👥 Staff Management     │
│  🗺️ Ward Map             │
│  📈 Reports & Analytics  │
│  🔮 Predictions          │
│  ⚙️ System Settings      │
└──────────────────────────┘
```

---

### 5.3 Overview Dashboard

**City-wide stats row:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Total   │ │  Open    │ │ Resolved │ │   SLA    │ │  Ghost   │ │Predicted │
│  Today   │ │ Tickets  │ │ This Mo. │ │ Breaches │ │  Flags   │ │ Issues   │
│   23     │ │  147     │ │   891    │ │    8     │ │    3     │ │   12     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Resolution rate by department:**
```
DEPARTMENT PERFORMANCE
───────────────────────────────────────────────────────────
Water Supply          ████████████  91%   34 resolved / 37 total
Electricity           ███████████░  88%   28 / 32
Roads & Infra.        ████████░░░░  79%   61 / 77
Sanitation            ███████░░░░░  71%   43 / 61
Parks & Rec.          ██████░░░░░░  65%   17 / 26
```

**Unassigned queue alert:**
```
⚠️ 8 TICKETS AWAITING ASSIGNMENT
   Oldest: KOL-2026-00140 — unassigned for 18 hours
   [ Go to Unassigned Queue ]
```

**Recent activity feed:**
```
RECENT ACTIVITY (live)
────────────────────────────────────────────────────
✅  KOL-2026-00138 resolved by Rajesh Kumar          2m ago
📥  KOL-2026-00150 new report — Open Manhole         5m ago
⚠️  KOL-2026-00141 SLA breached — Sanitation Dept   12m ago
👁️  KOL-2026-00133 GHOST FLAGGED — Priya Sharma     1h ago
────────────────────────────────────────────────────
```

---

### 5.4 Unassigned Queue

**This is the most critical admin screen — where officer assignment happens.**

**Header:**
```
UNASSIGNED QUEUE (8 tickets)
Sorted by: AI Severity Score (highest first)
```

**Bulk action bar:**
```
☐ Select all   [ Assign Selected ▾ ]   [ Bulk Escalate ]
```

**Each unassigned ticket:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ☐  🔴 KOL-2026-00149          CRITICAL | Severity: 9/10             │
│    Open Manhole                                                      │
│    Near Lake Market, Ward 82                                         │
│    Reported: 24 Jun, 8:00 AM (4 hours ago) | Upvotes: 7             │
│    AI Dept: Sanitation | Verified: ✅ (3/3 peers)                    │
│                                                                      │
│    [ 📷 View Photo ]  [ 📍 View on Map ]                            │
│                                                                      │
│    ASSIGN OFFICER                                                    │
│    Department  [ Sanitation ▾ ]   Ward  [ Ward 82 ▾ ]               │
│                                                                      │
│    ┌────────────────────────────────────────────────────────┐       │
│    │  Officer           Designation   Active   Rate         │       │
│    │  ● Priya Sharma    Sr. Inspector   2      94%   ✅ Best │       │
│    │  ○ Amit Das        Jr. Engineer    7      71%          │       │
│    │  ○ Suresh M.       Ward Officer    5      83%          │       │
│    └────────────────────────────────────────────────────────┘       │
│                                                                      │
│    Internal note for officer (optional):                             │
│    [ Near school zone — treat as urgent              ]              │
│                                                                      │
│    [ ✅ Assign to Priya Sharma ]   [ Skip for now ]                 │
└──────────────────────────────────────────────────────────────────────┘
```

**After assign — success toast:**
```
✅ KOL-2026-00149 assigned to Priya Sharma
   Citizen and officer notified via WhatsApp + FCM
```

---

### 5.5 All Tickets

**Full ticket table with filters:**

```
FILTER
Status:     [ All ▾ ]   Category: [ All ▾ ]   Ward: [ All ▾ ]
Officer:    [ All ▾ ]   Date:     [ Last 30 days ▾ ]   Severity: [ All ▾ ]
[ 🔍 Search by Ticket ID ]           [ ⬇️ Export CSV ]

RESULTS: 147 tickets
───────────────────────────────────────────────────────────────────────────
ID              Status        Issue Type      Officer       SLA        Ward
───────────────────────────────────────────────────────────────────────────
KOL-2026-00149  🔴 Critical   Open Manhole    Unassigned    6h left    W82
KOL-2026-00148  🔄 Progress   Waterlogging    Priya S.      2d left    W83
KOL-2026-00147  ✅ Resolved   Garbage         Amit D.       Done       W82
KOL-2026-00146  ⚠️ Escalated  Broken Light    —             Breached   W84
───────────────────────────────────────────────────────────────────────────
                                                         [ < 1 2 3 ... > ]
```

**Clicking any row** → opens full ticket detail (same as officer view + additional admin controls):

**Admin-only actions on ticket:**
```
ADMIN ACTIONS
[ 🔄 Reassign Officer ]
[ ⬆️ Escalate to Senior ]
[ ✅ Approve Override Request ]
[ 🗑️ Mark as False Report ]
[ 📋 Generate Ticket Report ]
```

---

### 5.6 Staff Management

**Sub-navigation:**
```
[ 👥 All Officers ] [ 🏢 Departments ] [ ➕ Add Officer ]
```

#### All Officers

**Filter / search:**
```
[ 🔍 Search by name or ID ]   Department: [ All ▾ ]   Ward: [ All ▾ ]   Status: [ Active ▾ ]
```

**Officer table:**
```
NAME            DEPT          WARD      CASES  RATE   SCORE  STATUS
──────────────────────────────────────────────────────────────────────
Rajesh Kumar    Roads & Inf.  W82,W83   4      87%    84     🟢 Active
Priya Sharma    Sanitation    W82       2      94%    91     🟢 Active
Amit Das        Roads & Inf.  W84       7      71%    68     🟡 Review
Suresh M.       Water Supply  W83,W85   3      88%    87     🟢 Active
Deepa N.        Electricity   W82       0      —      —      🔴 On Leave
──────────────────────────────────────────────────────────────────────
```

**Officer row actions:**
- Click row → Officer profile page
- `Edit` → edit profile modal
- `Deactivate` → confirmation modal → soft delete

**Officer Profile (Admin View):**
```
┌────────────────────────────────────────────────────────────┐
│  👤 Rajesh Kumar                       [ Edit ] [ Deactivate]│
│  Employee ID: KMC-ENG-0042                                 │
│  Junior Engineer — Roads & Infrastructure                  │
│  Wards: Ward 82, Ward 83                                   │
│  Email: rajesh@kmc.gov.in | Phone: +91-XXXXXXXX            │
│  Status: 🟢 Active | Member since: Jan 2026               │
├────────────────────────────────────────────────────────────┤
│  PERFORMANCE                                               │
│  Accountability Score   84 / 100    ████████░░            │
│  Resolution Rate        87%                               │
│  Avg. Resolution Days   4.3                               │
│  SLA Breaches           2                                 │
│  Ghost Closures         1    ⚠️ 1 false closure detected  │
│  Overrides Used         2                                 │
│  Citizen Rating         4.1 / 5.0                        │
├────────────────────────────────────────────────────────────┤
│  CASE HISTORY                                              │
│  Total Assigned: 47 | Resolved: 41 | In Progress: 4      │
│  [ View all cases ]                                       │
├────────────────────────────────────────────────────────────┤
│  ADMIN NOTES (private)                                    │
│  [ Add note... ]                                          │
│  No notes yet.                                            │
└────────────────────────────────────────────────────────────┘
```

#### Add Officer

```
ADD NEW OFFICER
────────────────────────────────────────────────
Full Name *           [ _________________________]
Employee ID *         [ _________________________]
Designation *         [ Junior Engineer ▾ ]
Department *          [ Roads & Infrastructure ▾ ]
Wards Assigned *      [ Ward 82 ✕ ] [ Ward 83 ✕ ] [ + Add Ward ]
Email Address *       [ _________________________]
Phone Number          [ _________________________]
Role                  ○ Officer  ○ Senior Officer

On save:
• Firebase account created automatically
• Login credentials emailed to officer
• Password reset link sent on first login

[ Create Officer Account ]  [ Cancel ]
```

#### Departments

```
DEPARTMENTS (5)
────────────────────────────────────────────────────────────────────
Department               Head Officer    Officers  Wards  SLA
────────────────────────────────────────────────────────────────────
Roads & Infrastructure   Suresh M. ▾     8         W82–85  7 days
Water Supply             Deepa N.  ▾     5         W82–86  5 days
Sanitation               Priya S.  ▾     6         W82–84  5 days
Electricity              Amit D.   ▾     4         W82–83  3 days
Parks & Recreation       —         ▾     3         W82     10 days
────────────────────────────────────────────────────────────────────
[ + Add Department ]
```

**Edit department modal:**
```
EDIT DEPARTMENT: Roads & Infrastructure
────────────────────────────────────────────
Department Name   [ Roads & Infrastructure ]
Head Officer      [ Suresh M. ▾ ]
Default SLA       [ 7 ] days
Wards Covered     [ W82 ✕ ] [ W83 ✕ ] [ + Add ]
Issue Types       [ Pothole ✕ ] [ Damaged Road ✕ ] [ + Add ]

[ Save Changes ]  [ Cancel ]
```

---

### 5.7 Ward Map (Admin)

Full-screen map with admin controls:

```
TOP BAR:
[ All Wards ▾ ] [ All Categories ▾ ] [ All Statuses ▾ ]
[ 🔥 Heatmap ] [ 🔵 Predictions ] [ ⚠️ SLA Breaches only ]
[ 📍 Show unassigned only ]

MAP: Full OpenStreetMap
- All ticket pins (color by severity)
- Heatmap overlay (toggle)
- Prediction markers (blue dashed)
- Ward boundary overlays (admin only)

RIGHT PANEL (on pin click):
┌────────────────────────────────┐
│  KOL-2026-00149                │
│  🔴 Open Manhole — CRITICAL    │
│  Ward 82 | 4 hrs ago           │
│  Officer: UNASSIGNED           │
│  [ Assign Officer ]            │
│  [ View Full Ticket ]          │
└────────────────────────────────┘
```

---

### 5.8 Reports & Analytics

**Sub-navigation:**
```
[ 📊 Ward Reports ] [ 👥 Officer Reports ] [ 📈 Trends ]
```

#### Ward Reports

```
GENERATE WARD REPORT
────────────────────────────────────────────
Ward          [ Ward 82 ▾ ]
Period        [ June 2026 ▾ ]
[ Generate Report ]

─── REPORT: WARD 82 — JUNE 2026 ──────────────────────────────

Generated by Gemini AI | 24 Jun 2026

SUMMARY
Issues Reported:    52
Issues Resolved:    47    (90.4% resolution rate)
SLA Breaches:        3
Ghost Closures:      1
Avg Resolution Time: 4.1 days

TOP PROBLEM ZONES
1. Near Gariahat Market — 12 issues (Pothole: 8, Waterlogging: 4)
2. Lake Market Road — 9 issues (Garbage: 6, Broken Light: 3)
3. Rashbehari Ave — 7 issues (Drainage: 7)

CATEGORY BREAKDOWN
Infrastructure:  22   ████████████████████
Sanitation:      14   ████████████░░
Water/Drainage:  10   █████████░░░░
Electricity:      6   █████░░░░░░░░

TOP OFFICERS THIS MONTH
1. Priya Sharma — 94% rate — 2.8 days avg
2. Rajesh Kumar — 87% rate — 4.3 days avg
3. Suresh M.    — 88% rate — 3.9 days avg

AI NARRATIVE
"Ward 82 showed strong performance in June 2026 with a
90.4% resolution rate, up from 82% in May. The primary
concern remains the Gariahat Market corridor, which
accounted for 23% of all reports. Monsoon-related
waterlogging issues are expected to increase in July —
preemptive drain inspection is recommended..."

[ ⬇️ Download PDF ]  [ 📧 Email to Senior Officers ]
```

#### Officer Reports

```
SELECT OFFICER: [ Rajesh Kumar ▾ ]
PERIOD:         [ June 2026 ▾ ]
[ Generate ]

OFFICER PERFORMANCE REPORT: RAJESH KUMAR — JUNE 2026

Accountability Score:  84/100
Resolution Rate:       87% (12/14 resolved)
Avg. Resolution Time:  4.3 days
On-time Completions:   92%
SLA Breaches:          1
Ghost Closures:        0  ✅
Override Requests:     0  ✅
Citizen Rating:        4.1/5.0

AI NARRATIVE
"Rajesh Kumar demonstrated consistent performance in
June, resolving 87% of assigned cases within SLA. His
average resolution time of 4.3 days is below the
department average of 5.1 days..."

[ Download PDF ]
```

#### Trends

```
ISSUE TRENDS — WARD 82 — LAST 6 MONTHS

Monthly reports:
Jan  ████░░░░░░░░  38
Feb  █████░░░░░░░  45
Mar  ████████░░░░  67  ← peak (summer)
Apr  ███████░░░░░  58
May  ██████░░░░░░  51
Jun  █████████░░░  74  ← monsoon begins

Top growing categories (Jun vs May):
▲ Waterlogging    +240% (monsoon)
▲ Potholes        +35%
▼ Garbage          -8%

PREDICTION: July 2026 is expected to have 85–100 reports,
primarily waterlogging (+40%) and pothole (+50%) driven
by monsoon conditions.
```

---

### 5.9 Predictions Dashboard

```
AI PREDICTED ISSUES — NEXT 30 DAYS (12 predictions)

FILTER: [ All Wards ▾ ] [ All Categories ▾ ] [ High probability only ]

──────────────────────────────────────────────────────────────────────
ZONE                  ISSUE TYPE    PROBABILITY  RECOMMENDED ACTION
──────────────────────────────────────────────────────────────────────
Gariahat Flyover      Pothole       84%  🔴       Pre-patch road
Lake Market Drain     Waterlogging  79%  🟠       Clear drain before monsoon
Rashbehari Ave        Garbage dump  71%  🟠       Increase collection freq.
School Zone Ward 83   Streetlight   65%  🟡       Inspect lighting
──────────────────────────────────────────────────────────────────────

[ Convert to Work Order ]  ← creates proactive ticket without citizen report

PREDICTION ACCURACY (last 3 months)
Predictions made: 34 | Came true: 27 | Accuracy: 79%
```

**Convert to Work Order flow:**
```
CREATE PROACTIVE WORK ORDER
────────────────────────────────────────────
Based on AI prediction:
Zone:         Gariahat Flyover, Ward 82
Issue Type:   Pothole (predicted)
Probability:  84%

This will create a ticket with:
  Status:     ASSIGNED (skip citizen report step)
  Priority:   HIGH
  Source:     AI Prediction
  Category:   Infrastructure

Assign to officer:
  [ Rajesh Kumar — 4 active — 87% rate  ✅ Recommended ]

[ Create Work Order ]  [ Cancel ]
```

---

### 5.10 System Settings

```
SYSTEM SETTINGS (Admin only)
────────────────────────────────────────────────────────────────

SLA DEFAULTS (days)
Electricity:      [ 3  ]
Water Supply:     [ 5  ]
Sanitation:       [ 5  ]
Roads & Infra.:   [ 7  ]
Parks & Rec.:     [ 10 ]

ESCALATION TIMELINE (days)
Officer reminder:       [ 7  ]
Escalate to senior:     [ 14 ]
RTI auto-draft:         [ 30 ]
First Appeal:           [ 60 ]

GHOST DETECTION
GPS radius (metres):    [ 50  ]
Ghost window (days):    [ 14  ]
Min. confidence (%):    [ 65  ]

DUPLICATE DETECTION
GPS radius (metres):    [ 50  ]
Min. confidence (%):    [ 60  ]

GEMINI THRESHOLDS
Classification:         min [ 50 ]% confidence to auto-fill
Resolution validation:  min [ 70 ]% confidence to approve
Ghost detection:        min [ 65 ]% to auto-reopen

CITY CONFIGURATION
City name:              [ Kolkata ]
City code:              [ KOL ]
Active wards:           [ 82 ✕ ] [ 83 ✕ ] [ 84 ✕ ] [ + Add ]

NOTIFICATION TEMPLATES
[ Edit WhatsApp templates ]
[ Edit Email templates ]
[ Edit Push notification templates ]

[ Save All Settings ]
```

---

## 6. Shared Components

### 6.1 Notification Panel (All Roles)

Slide-in panel triggered by bell icon. Role-specific notifications:

**Citizen:** ticket status changes, badge earned, challenge completed
**Officer:** new ticket assigned, query received, SLA breach warning, ghost flag
**Admin:** unassigned tickets accumulating, ghost flags, SLA breaches, override requests

---

### 6.2 Language Selector (All Roles)

Available on all interfaces:
```
[ 🌐 English ▾ ]
   ✅ English
   ○  हिन्दी (Hindi)
   ○  বাংলা (Bengali)
```

Changing language re-renders all UI strings and switches Gemini bot response language.

---

### 6.3 Photo Viewer

Full-screen lightbox on any photo click:
```
┌──────────────────────────────────────────────────────┐
│  [X]                               KOL-2026-00142   │
│                                                      │
│              [ FULL PHOTO ]                         │
│                                                      │
│  Taken: 22 Jun 2026, 3:40 PM                        │
│  Location: Ward 82, Kolkata                         │
│  Type: Report Photo                                 │
│  [ ⬇️ Download ]  [ < Prev ]  [ Next > ]            │
└──────────────────────────────────────────────────────┘
```

---

### 6.4 Confirmation Modals

All destructive or irreversible actions require confirmation:
```
┌────────────────────────────────────┐
│  Confirm: Deactivate Officer       │
│                                    │
│  Deactivating Rajesh Kumar will:   │
│  • Remove from assignment dropdown │
│  • Keep all historical case data   │
│  • Disable their login             │
│                                    │
│  This can be reversed.             │
│                                    │
│  [ Deactivate ]  [ Cancel ]        │
└────────────────────────────────────┘
```

---

### 6.5 Error States

| Error | Message |
|---|---|
| Gemini unavailable | "AI classification unavailable. Fill in the details manually." |
| Photo too large | "Photo must be under 10MB. Please compress and retry." |
| Invalid ticket ID | "Ticket ID not found. Check the ID and try again." |
| Rate limit hit | "Too many requests. Please wait a moment and try again." |
| Session expired | "Your session has expired. Please log in again." |
| Offline | "You appear to be offline. Changes will sync when reconnected." |

---

### 6.6 Loading States

All async operations show:
- Inline spinner for < 1 second operations
- Skeleton screen for page loads
- Progress text for Gemini calls: "AI is analyzing your photo...", "Validating resolution...", "Generating RTI document..."

---

## 7. Navigation Map

```
PUBLIC
  /                     → Landing: Report + Track + Map + Scores
  /track/:id            → Public ticket view (no login)

CITIZEN (/citizen/*)
  /citizen              → Home feed
  /citizen/report       → Report issue flow (5 steps)
  /citizen/tickets      → My tickets list
  /citizen/tickets/:id  → Ticket detail (tabs: Timeline, Officer, Photos, Ask, Actions)
  /citizen/map          → Community map
  /citizen/leaderboard  → Leaderboard (tabs: Reporters, Verifiers, Ghosts, Authority)
  /citizen/profile      → My profile + badges + settings

OFFICER (/officer/*)
  /officer              → Officer dashboard
  /officer/queue        → Active ticket queue
  /officer/queue/:id    → Ticket detail (tabs: Details, Timeline, Notes, Actions)
  /officer/resolved     → Resolved cases
  /officer/queries      → Queries inbox
  /officer/performance  → My performance stats

ADMIN (/admin/*)
  /admin                → City overview dashboard
  /admin/unassigned     → Unassigned queue (priority assignment screen)
  /admin/tickets        → All tickets table
  /admin/tickets/:id    → Ticket detail + admin actions
  /admin/staff          → Staff management
  /admin/staff/new      → Add officer form
  /admin/staff/:id      → Officer profile
  /admin/map            → Admin ward map
  /admin/reports        → Reports & analytics
  /admin/predictions    → AI predictions dashboard
  /admin/settings       → System settings
```

---

*Community Hero — User Flow & Feature Specification v1.0*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
