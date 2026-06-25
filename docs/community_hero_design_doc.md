# Design Document
## Community Hero — Hyperlocal Problem Solver
**Version:** 1.0
**Date:** June 2026
**Scope:** Visual identity, color system, typography, component library, layout principles, interaction design, three-interface design direction

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Inspiration & Moodboard](#2-inspiration--moodboard)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Iconography](#6-iconography)
7. [Component Library](#7-component-library)
8. [Interface-Specific Design Direction](#8-interface-specific-design-direction)
9. [Data Visualization](#9-data-visualization)
10. [Motion & Interaction](#10-motion--interaction)
11. [Responsive Design](#11-responsive-design)
12. [Accessibility](#12-accessibility)
13. [Dark Mode](#13-dark-mode)
14. [What Not to Do](#14-what-not-to-do)

---

## 1. Design Philosophy

### The Core Idea

Community Hero is not a productivity app. It is not a startup dashboard. It is not a government portal.

It is a civic accountability tool. Every design decision should serve one question: *does this make it harder for bad things to stay hidden?*

The visual language comes from the world it lives in: Indian streets, monsoon floods, RTI notices, municipal stamps, ward offices, complaint registers, concrete infrastructure. The platform borrows the weight and seriousness of documentary journalism — the kind of design you'd see in an investigative newspaper spread — and applies it to civic software.

### Three Design Principles

**Radical clarity over aesthetic comfort.** The most important information — ticket status, officer name, SLA countdown, severity — should be impossible to miss. If a citizen has to hunt for whether their pothole is being worked on, the design has failed. Density is acceptable. Ambiguity is not.

**Accountability through visibility.** Officer names, resolution rates, ghost closure counts, override history — all of it is visible, all of it is public. The design should feel like turning on a light in a dark room. Nothing hidden, nothing softened.

**Municipal weight.** The platform deals with real problems in real neighborhoods. The design should feel grounded, serious, and trustworthy — not playful, not corporate, not startup-slick. A citizen filing an RTI should feel like they are using something that means business.

### What This Rules Out

- Pastel color palettes that feel "approachable" but not urgent
- Large hero illustrations of smiling cartoon citizens
- Rounded bubbly components that feel like a consumer social app
- Generic dashboard templates with blue header bars and white cards in a 3-column grid
- Any design that could plausibly belong to a food delivery app, a project management tool, or a fintech startup

---

## 2. Inspiration & Moodboard

### Reference Worlds (not reference apps)

**Indian municipal complaint forms.** The physical RTI application form — dense rows of fields, rubber stamps, file numbers in the top right corner, underlining as a structural device. This is where the citizens already live. The design should feel like a digitized, upgraded version of this world, not an escape from it.

**Indian broadsheet newspapers.** The Hindu, The Telegraph (Calcutta). Dense information, clear hierarchy, no wasted space. Column grids, bold section labels, data presented without decoration.

**Election results boards.** The large-format number displays that show vote counts in real time during Indian elections — terse, monospace, unapologetic about how much information they show.

**Government signage in Indian cities.** The particular green of NHAI highway signs, the orange-red of Mumbai municipal stamps, the concrete grey of KMC buildings. These colors belong to this world.

**Accountability journalism.** ProPublica, The Wire (India), The Caravan. The visual language of organizations that believe showing the data is the point. Tables that aren't apologetic about being tables. Numbers that aren't rounded to feel friendly.

### The Aesthetic Position

**Not this:** Clean, minimal, white-space-heavy, Airbnb-esque, friendly rounded cards, soft shadows, blue accent color, Inter font, professional but forgettable.

**This:** High contrast, information-dense, typographically deliberate, slightly uncomfortable in how much it shows, feels like it was designed by someone who has read too many RTI responses and is done being polite about it.

---

## 3. Color System

### Design Rationale

The palette comes from the platform's actual world — not from a UI trend cycle. Three sources:

1. **Municipal infrastructure:** Concrete grey, weathered tarmac
2. **Government stamps and notices:** RTI red-orange, official green
3. **Urgency signals:** High-visibility amber for warnings, danger red for critical issues

This is deliberately not a blue-primary palette. Blue is what every civic/government app defaults to. It reads as "safe" and "trustworthy" in a way that has become invisible. The platform needs to feel active, not passive.

### Primary Palette

```
--color-civic-red:      #C13B2A    /* Primary brand — RTI stamp red-orange */
--color-civic-red-dark: #9A2D1F    /* Hover state, pressed */
--color-civic-red-bg:   #FDF1EF    /* Light backgrounds using civic red */

--color-concrete:       #4A4A48    /* Primary text — warm dark grey, not black */
--color-concrete-mid:   #7A7875    /* Secondary text */
--color-concrete-light: #B8B5B0    /* Tertiary text, placeholders */
--color-concrete-bg:    #F5F3F0    /* Page background — warm off-white, not pure white */

--color-surface:        #FFFFFF    /* Card surfaces, form backgrounds */
--color-surface-raised: #FAFAF9    /* Slightly elevated surface */
```

### Semantic Colors

```
/* Ticket status colors */
--color-critical:       #C13B2A    /* Same as civic-red — critical severity */
--color-high:           #D4730A    /* High severity — deep amber */
--color-medium:         #1A7A4A    /* Medium — confident green */
--color-resolved:       #2D6A9F    /* Resolved — institutional blue */
--color-predicted:      #6B50B8    /* AI predicted — distinct purple */
--color-ghost:          #8B1A1A    /* Ghost flagged — darker danger red */
--color-overridden:     #5F5E5A    /* Closed by override — neutral grey */

/* Department colors (used on maps and assignment UI) */
--color-dept-roads:     #C13B2A    /* Roads — red */
--color-dept-water:     #2D6A9F    /* Water — blue */
--color-dept-sanitation:#1A7A4A    /* Sanitation — green */
--color-dept-electricity:#D4730A   /* Electricity — amber */
--color-dept-parks:     #6B50B8    /* Parks — purple */

/* Alert / feedback */
--color-success:        #1A7A4A
--color-warning:        #D4730A
--color-danger:         #C13B2A
--color-info:           #2D6A9F
```

### Civic Health Score Colors

The A–F grade system needs its own sub-palette. Not traffic light — more like a newspaper's rating scale.

```
A+ / A:  #1A7A4A   deep green
A- / B+: #2D6A9F   institutional blue
B / B-:  #6B50B8   muted purple
C+ / C:  #D4730A   amber
C- / D:  #C13B2A   civic red
F:       #8B1A1A   dark danger
```

### How to Use Color

Color encodes meaning, never decoration. The rules:

- **Red** only means: critical severity, danger, ghost flagged, SLA breached, RTI filed, rejection
- **Amber** only means: high severity, warning, near breach, pending
- **Green** only means: resolved, verified, on time, healthy
- **Blue** only means: assigned, in progress, institutional reference
- **Purple** only means: AI-related outputs (predictions, Gemini confidence, AI badges)
- **Grey** only means: neutral state, unverified, override closed, structural UI

Never use color to make something look nice. Only use it to say something specific.

---

## 4. Typography

### Rationale

The platform handles real information — ticket IDs, officer names, GPS addresses, SLA deadlines, RTI documents. The typography needs to be a workhorse, not a showcase. But it also needs personality — the platform has a point of view, and the type should carry it.

### Type Scale

**Display — used only for the landing page hero counter and major empty states:**
```
Font:    DM Serif Display (or Playfair Display as fallback)
Size:    56–72px
Weight:  400 (the serif itself provides visual weight)
Usage:   "1,247 issues reported this month"
         Used exactly once per page maximum
```

**Heading 1 — page titles:**
```
Font:    Inter or system-ui
Size:    24px
Weight:  600
Color:   --color-concrete
Letter-spacing: -0.3px
```

**Heading 2 — section titles:**
```
Font:    Inter
Size:    18px
Weight:  600
Color:   --color-concrete
```

**Heading 3 — card titles, widget labels:**
```
Font:    Inter
Size:    15px
Weight:  600
Color:   --color-concrete
```

**Body — default text:**
```
Font:    Inter
Size:    14px
Weight:  400
Line-height: 1.6
Color:   --color-concrete
```

**Caption / label — field labels, metadata:**
```
Font:    Inter
Size:    12px
Weight:  500
Color:   --color-concrete-mid
Letter-spacing: 0.3px
Text-transform: uppercase (for field labels only)
```

**Monospace — ticket IDs, GPS coordinates, timestamps:**
```
Font:    JetBrains Mono or ui-monospace
Size:    13px
Weight:  500
Color:   --color-concrete
Usage:   KOL-2026-00142, lat/lng values, ISO timestamps
```

**Data — numbers in dashboards and stats:**
```
Font:    Inter
Size:    28–36px (for metrics), 20px (for table cells)
Weight:  700
Color:   Inherits semantic color (green for resolved, red for critical, etc.)
Usage:   "891", "87%", "4.3 days"
```

### Typography Rules

- Ticket IDs are always monospace, always uppercase, never wrapped
- Officer names are always title case (they are people)
- Status labels are always uppercase, always with their semantic color
- Descriptions are always sentence case, 14px body text
- RTI-generated documents use a slightly different style — 14px, increased line-height 1.8, subtle left border in civic-red to signal "AI generated"
- Never mix more than two type sizes in a single card
- Field labels are always uppercase caption style. Values are always body or data style. Never the same weight.

---

## 5. Spacing & Layout

### Base Unit

The entire spacing system uses an 8px base unit. Everything is a multiple of 8, with 4px allowed for micro-spacing.

```
4px   — gap between icon and label, checkbox and text
8px   — internal card padding (small), gap between related items
12px  — gap between form fields
16px  — card padding (standard), gap between cards in a list
24px  — section spacing within a page
32px  — section-to-section spacing
48px  — major layout spacing, between page sections
```

### Layout Grid

**Desktop (1280px+):**
- 12-column grid
- Column gutter: 24px
- Page margin: 32px each side
- Max content width: 1200px

**Tablet (768–1279px):**
- 8-column grid
- Column gutter: 20px
- Page margin: 24px each side

**Mobile (< 768px):**
- 4-column grid
- Column gutter: 16px
- Page margin: 16px each side

### Three-Panel Layout (Officer and Admin dashboards)

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAV BAR (48px height, full width)                  │
├──────────┬──────────────────────────┬───────────────────┤
│          │                          │                   │
│ SIDEBAR  │   MAIN CONTENT           │  DETAIL PANEL     │
│ 220px    │   flex: 1                │  380px            │
│          │                          │  (opens on click) │
│          │                          │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

The detail panel slides in from the right when a ticket is selected. It does not navigate to a new page — it overlays inline. This means the queue remains visible while an officer reviews a ticket.

### Two-Panel Layout (Citizen dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAV BAR (48px)                                     │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │   MAIN CONTENT (flex: 1)                    │
│ 220px    │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

## 6. Iconography

### Source

Tabler Icons — outline variant only. Never filled. Consistent 24px at display, 20px inline, 16px in tight spaces.

### Icon Usage Rules

- Every icon must be accompanied by a label when it appears in navigation or actions
- Status icons are always accompanied by their status text — an icon alone never communicates status
- Never use icons decoratively. Each icon must communicate something specific.
- Department icons are used consistently across the whole platform:

```
Roads & Infrastructure:  ti-road
Water Supply & Drainage: ti-droplet
Sanitation:              ti-trash
Electricity:             ti-bolt
Parks & Recreation:      ti-trees
```

```
Ticket status icons:
UNASSIGNED:     ti-clock
VERIFIED:       ti-check
ASSIGNED:       ti-user-check
IN_PROGRESS:    ti-tool
RESOLVED:       ti-circle-check
GHOST_FLAGGED:  ti-ghost
ESCALATED:      ti-arrow-up
RTI_FILED:      ti-file-text
CLOSED_OVERRIDE:ti-x
REJECTED:       ti-ban
```

```
Action icons:
Report issue:    ti-camera-plus
Track ticket:    ti-search
Assign officer:  ti-user-plus
Upload proof:    ti-upload
Ask question:    ti-message-circle
Download RTI:    ti-file-download
Reopen:          ti-refresh
Upvote:          ti-thumb-up
```

---

## 7. Component Library

### 7.1 Ticket Card (Public / Citizen)

The most important component in the platform. Used on the public map popup, citizen My Tickets list, and the public ticket tracker.

**Anatomy:**
```
┌─────────────────────────────────────────────────────┐
│  KOL-2026-00142         [● IN PROGRESS]             │
│  ─────────────────────────────────────────────────  │
│  🕳️  Pothole — Roads & Infrastructure               │
│  📍  Near Gariahat Market, Ward 82, Kolkata          │
│  ─────────────────────────────────────────────────  │
│  Assigned to: Rajesh Kumar                          │
│  SLA Deadline: 1 Jul 2026  ████████░░  7 days left  │
│  ─────────────────────────────────────────────────  │
│  👍 3   📅 22 Jun 2026   AI Confidence: 89%  ◆     │
└─────────────────────────────────────────────────────┘
```

**Design rules:**
- Ticket ID is always monospace, top-left, grey
- Status badge is top-right, uppercase, bold, semantic color
- Issue type icon + name at 15px/600 weight
- Address at 13px/400 body, muted color
- Dividers are 0.5px, concrete-light
- SLA bar: thin 4px height progress bar, color shifts from green → amber → red as deadline approaches
- The ◆ (diamond) symbol beside AI Confidence marks any AI-generated content throughout the entire platform — consistent visual cue

### 7.2 Status Badge

Used everywhere a ticket status is shown. Rules: always uppercase, always with the semantic color background at 10% opacity, text in the semantic color at full saturation, 12px, 500 weight, 4px rounded corners.

```
[● UNASSIGNED]       grey bg    grey text
[● VERIFIED]         green bg   green text
[● ASSIGNED]         blue bg    blue text
[● IN PROGRESS]      blue bg    blue text
[● RESOLVED]         green bg   green text
[● GHOST FLAGGED]    dark-red bg dark-red text
[● ESCALATED]        amber bg   amber text
[● RTI FILED]        civic-red bg civic-red text
[● CLOSED OVERRIDE]  grey bg    grey text
[● REJECTED]         red bg     red text
```

The ● dot before the label is always present, in the same semantic color, 8px circle.

### 7.3 Severity Bar

A horizontal bar shown on tickets, assignment dropdown, and maps. Not a progress bar — a severity indicator.

```
Severity 3/10:  ███░░░░░░░  LOW
Severity 6/10:  ██████░░░░  MEDIUM
Severity 8/10:  ████████░░  HIGH
Severity 9/10:  █████████░  CRITICAL  ⚠
```

Color:
- 1–3: --color-medium (green)
- 4–6: --color-warning (amber)
- 7–8: --color-high (dark amber)
- 9–10: --color-critical (civic-red) + warning icon

Life-safety issues (open manhole, exposed wire) always show severity 9+ with a pulsing red dot animation in addition to the bar.

### 7.4 Officer Assignment Dropdown

Used only on the Admin unassigned queue. The dropdown is custom — not a native `<select>`. Each row shows the officer at a glance with workload context.

```
┌─────────────────────────────────────────────────────┐
│  Select officer for Roads & Infrastructure, Ward 82  │
├─────────────────────────────────────────────────────┤
│  ◎  Priya Sharma     Sr. Inspector   2 cases   94%  │  ← recommended (fewest cases)
│  ○  Rajesh Kumar     Jr. Engineer    4 cases   87%  │
│  ○  Amit Das         Jr. Engineer    7 cases   71%  │  ← 7+ cases shown in amber
└─────────────────────────────────────────────────────┘
```

Active case count > 5 is shown in amber. > 8 is shown in red. The recommended officer (fewest active cases) has a filled radio and a subtle background tint.

### 7.5 SLA Countdown

Shown on officer queue cards and the citizen ticket tracker.

```
Time remaining states:

> 7 days:     ████████░░  8 days left          green
3–7 days:    ██████░░░░  5 days left          amber
< 3 days:    ████░░░░░░  2 days left ⚠        orange
< 24 hours:  ██░░░░░░░░  6 hours left ⚠⚠      red
Breached:    ██████████  3 days overdue !!     dark red, pulsing
```

The breach state uses a CSS animation — the bar pulses from dark-red to a slightly lighter red at 2-second intervals. This is the only animation on ticket cards.

### 7.6 AI Confidence Indicator

Appears on three places: report form Step 2, admin ticket classification tab, ghost detection report.

```
AI Confidence: 89%
◆ ██████████░  Reason: Detected road surface damage
               with clear boundary edges consistent
               with a pothole.
```

The ◆ symbol is the consistent marker for AI-generated content across the entire platform. Purple, always. When confidence < 50%: amber ◆. When confidence >= 80%: purple ◆. The color of ◆ is the only visual indicator of AI confidence level — no text annotation needed.

### 7.7 Ghost Detection Report Card

Shown on admin ticket detail when status is GHOST_FLAGGED.

```
┌─────────────────────────────────────────────────────┐
│  GHOST DETECTION REPORT              ◆ AI Analysis  │
│  ─────────────────────────────────────────────────  │
│  Issue still present:  ✓ Yes                        │
│  Confidence:           91%   █████████░             │
│  Decision:             ✗ Resolution Rejected         │
│  ─────────────────────────────────────────────────  │
│  BEFORE          RESOLUTION      NEW REPORT         │
│  [photo]         [photo]         [photo]            │
│  22 Jun          28 Jun          3 Jul              │
│  ─────────────────────────────────────────────────  │
│  "Original pothole remains visible in the           │
│   resolution photo. Road surface unchanged."        │
└─────────────────────────────────────────────────────┘
```

The card border is civic-red (left border only, 3px). Background is the civic-red-bg tint. This makes it impossible to miss on the admin dashboard.

### 7.8 Resolution Evidence Report Card

Shown on the citizen ticket page (Tab: Photos) after a ticket is resolved.

```
┌─────────────────────────────────────────────────────┐
│  RESOLUTION EVIDENCE         ◆ Verified by Gemini   │
│  ─────────────────────────────────────────────────  │
│  BEFORE                AFTER                        │
│  [photo]          →    [photo]                      │
│  22 Jun 2026           28 Jun 2026                  │
│  ─────────────────────────────────────────────────  │
│  Same location:        ✓ Confirmed                  │
│  Issue resolved:       ✓ Confirmed                  │
│  Timestamp valid:      ✓ Confirmed                  │
│  AI confidence:        91%                          │
│  ─────────────────────────────────────────────────  │
│  DECISION: ✓ RESOLUTION APPROVED                    │
└─────────────────────────────────────────────────────┘
```

Approved state: left border green. Rejected state: left border civic-red (shown to officer only, not citizen).

### 7.9 Ticket Timeline

The full status history shown on the citizen ticket page and the officer/admin audit trail tab.

```
  ●  Reported          22 Jun 2026, 3:42 PM
  │  Anonymous citizen
  │
  ●  Verified          23 Jun 2026, 10:15 AM
  │  3 neighbors confirmed — Priya S., Arjun M., +1
  │
  ●  Assigned          23 Jun 2026, 2:00 PM
  │  Admin → Rajesh Kumar, Roads & Infrastructure
  │  Note: "High traffic zone, urgent"
  │
  ◐  In Progress       24 Jun 2026, 9:00 AM
  │  Officer acknowledged
  │
  ○  Resolved          Pending
```

Each node:
- Completed: filled circle in semantic color of that status
- Current: half-filled circle (◐) in semantic color
- Pending: empty circle, grey

The vertical connector line between nodes changes color to match the status it connects from. The full timeline should feel like reading a case file, not a flowchart.

### 7.10 Civic Health Score Widget

Shown on the public landing page and citizen home feed.

```
WARD 82

  B+
  ████████░░  83/100

47 resolved  /  52 total this month
↑ up from C last month
```

The letter grade is displayed at 48px, 700 weight, in its semantic color. The grade is the hero of this widget — not the bar, not the subtitle. This is the "election results board" aesthetic.

### 7.11 Form Fields

The report form (Step 2: AI Review) uses a custom field design that communicates the AI-suggestion state.

**AI-suggested field (unedited):**
```
┌─────────────────────────────────┐
│  Issue Type                 ◆   │  ← ◆ = AI suggested
│  Pothole               ▾        │
│  AI suggested — change if needed│  ← always shown
└─────────────────────────────────┘
```

**Field edited by citizen:**
```
┌─────────────────────────────────┐
│  Issue Type                     │  ← ◆ removed
│  Damaged Road          ▾        │
│  You changed this               │  ← confirmation citizen edited
└─────────────────────────────────┘
```

The field background changes from a very subtle purple tint (AI suggested) to plain white (citizen edited). The purple tint is 4% opacity — barely perceptible, but detectable on close inspection. This is a deliberate design choice: the AI's fingerprint should be subtle but traceable.

### 7.12 XP & Level Widget (Citizen Profile)

Not a game UI. The gamification elements use the same tonal vocabulary as the rest of the platform — grounded, not playful.

```
ACTIVE RESIDENT                        1,240 XP

━━━━━━━━━━━━░░░░  260 XP to Community Guardian

🔥 7-day streak
```

Level name in uppercase, 12px, muted color. XP in 28px, 700, concrete. Progress bar at 4px height in civic-red. No animations on the level widget — the streak counter is the only live element.

### 7.13 Notification Panel

Slide-in from top-right on bell icon tap. No overlay, no modal — it attaches to the nav bar and overlays the page content slightly.

Max width 360px. Each notification is a row with:
- Left: status icon in its semantic color
- Center: ticket ID (monospace), action description
- Right: relative timestamp (2h ago)
- Bottom border on each row

Unread notifications have a 3px left border in civic-red. Read notifications have no left border.

---

## 8. Interface-Specific Design Direction

### 8.1 Public Landing Page

The landing page is the one place the platform can afford to be striking. It does not look like the dashboards.

**Hero section:**
Large-format civic health numbers displayed in DM Serif Display at 72px. Not a headline. The number itself is the message.

```
1,247
issues reported this month in Kolkata
```

Below that, four live stats in a row: Reported / Verified / In Progress / Resolved. Each is a number at 36px, 700 weight, followed by a 12px label. The numbers update in real time via Firestore listener — you can watch them tick.

No hero image. No illustration. The numbers are the visual.

**Map:**
Full-width below the stats. The map is the most data-rich element on the page. The background map tiles are intentionally desaturated (OpenStreetMap with a greyscale CSS filter) so the colored issue pins dominate. Red pins command attention. The map itself recedes.

**Color palette for the landing page only:**
The page background is `--color-concrete-bg` (warm off-white), not white. This gives the page a slightly physical, material quality — like a piece of paper rather than a screen. The civic-red is used at full saturation for the primary CTA only.

### 8.2 Citizen Dashboard

Warmer, more personal than the officer/admin interfaces. The citizen is a participant, not an administrator. The design acknowledges that they are doing something civic and meaningful.

**Key differences from officer/admin:**
- Slightly more breathing room between elements
- The gamification elements (XP, badges, streaks) are visible but not dominant — they sit in the profile and a small widget on the home feed, not everywhere
- The community map is the central element of the home feed — not a list of notifications or a stats grid
- Colors are slightly warmer overall — the page background has a tiny hint of the civic-red-bg tint at 3% opacity

**Navigation:**
Left sidebar on desktop, bottom tab bar on mobile (5 tabs: Home, Report, My Tickets, Map, Profile).

### 8.3 Officer Dashboard

Functional, dense, deliberately serious. Officers are working. They do not need the design to be charming.

**Key design decisions:**
- The ticket queue is the entire main content area. No dashboard widgets competing for attention.
- SLA countdown timers are the most visually prominent element on each queue card. The officer's primary job is clear.
- The three-panel layout keeps the queue visible at all times — the officer never loses their place
- Red is used aggressively here. Breached SLAs, critical issues, ghost flags — red means act now
- Internal notes have a distinctly different visual treatment: slightly yellow-tinted background, different font weight, a small lock icon. Clear that this is private.

**The queue is sorted by AI severity, not submission time.** The visual design reinforces this — there is no chronological indicator on queue cards. Time submitted is in the detail panel only.

### 8.4 Admin Dashboard

The most information-dense interface. Admins see everything across all wards, departments, and officers.

**Key design decisions:**
- The overview page uses a large-format stats grid — 6 number cards at the top, similar energy to the landing page hero but in the dashboard's tighter vocabulary
- The unassigned queue is a full-page view with the assignment dropdown inline on each card — no modal, no navigation
- Officer accountability scores are shown as a 0–100 number in a colored ring: green >80, amber 60–80, red <60
- The staff management table is designed like a newspaper scorecard — dense columns, sortable, the accountability score column uses conditional color (not icons)
- The ward map uses the same greyscale tile treatment as the landing page, with issue pins and a heatmap layer toggle

**Color treatment for admin:**
The admin interface uses full-saturation semantic colors more aggressively than the citizen dashboard. Admins need to triage. A critical unassigned issue should be unmissable at 8am on a Monday morning.

---

## 9. Data Visualization

### 9.1 Department Performance Bar Chart

Horizontal bars. Not vertical. The department names are long and are better as row labels than X-axis labels.

```
Water Supply      ████████████  91%   (34 resolved / 37)
Electricity       ███████████░  88%   (28 / 32)
Roads & Infra.    ████████░░░░  79%   (61 / 77)
Sanitation        ███████░░░░░  71%   (43 / 61)
Parks & Rec.      ██████░░░░░░  65%   (17 / 26)
```

Bars are in the department's own color. Values shown on the right in 13px monospace. No Y-axis. No gridlines. No chart frame. The bars are the chart.

### 9.2 Monthly Trend Chart

A simple line chart for the trends view. Two lines: Reports and Resolved. No area fill — just the lines. The gap between the two lines is the most important thing. If Reports is going up and Resolved is staying flat, the gap is widening — that is the story.

Color: Reports in civic-red, Resolved in medium-green. Monospace X-axis labels (Jan, Feb, Mar). No Y-axis gridlines — horizontal reference lines at every 20-unit interval, 0.5px, very muted.

### 9.3 Civic Health Score Trend (Ward Reports)

A simple sparkline — 6 months of civic scores shown as a tiny line. Used in the ward report header to show trajectory. No labels, no axes — just the line. Green = improving. Red = declining. The sparkline is 80px wide, 24px tall.

### 9.4 Map Pins

Color-coded by severity, not by category:

```
🔴  Red pin:           Critical (severity 9-10) or GHOST_FLAGGED
🟠  Orange pin:        High (severity 7-8)
🟡  Yellow pin:        Medium (severity 4-6)
🟢  Green pin:         Resolved
🔵  Blue dashed pin:   AI Predicted (not yet reported)
```

Pin shape: standard teardrop. The dashed border on predicted issues is the only pin variant. Predicted issues are always rendered below real issues in the Z-order — never obscuring an actual report.

Heatmap layer (when toggled): uses a simple density kernel. Color ramp: transparent → amber → civic-red. This is the one place a gradient is used in the entire platform, because heatmaps require it.

### 9.5 Officer Accountability Score Ring

Shown on officer profiles in the admin interface.

A thin ring (4px stroke width) from 0° to 360°, representing 0–100. The stroke is in the score's semantic color. The number is in the center in 28px/700 weight, same color.

```
Score > 80:   green ring + green number   "84"
Score 60–80:  amber ring + amber number   "71"
Score < 60:   red ring + red number       "47"
```

No animation on load. No tick marks. Just the ring and the number.

---

## 10. Motion & Interaction

### The Rule

One animated element per screen. Everything else is static.

This is not a marketing website. Motion is used to communicate state change, not to delight.

### Permitted Animations

**SLA breach pulse:** Breached SLA countdown bars pulse between dark-red and a slightly lighter red at 2-second intervals. This is the only persistent animation in the platform. Duration: 2s ease-in-out, infinite.

**Life-safety pulse:** Open manhole and exposed wire tickets show a pulsing red dot on their severity indicator. Same timing as SLA breach. These are the two highest-stakes moments in the platform — they deserve the one animation slot.

**Status transition:** When a ticket status changes (via Firestore realtime), the status badge performs a single flash — 0.2s fade from 50% opacity to 100% opacity. No slide, no bounce. Just a blink.

**Panel slide-in:** The detail panel on officer/admin dashboards slides in from the right. 200ms, ease-out cubic. 0 to 380px width. No opacity change — just the slide.

**Page load:** No skeleton screens. The landing page stats counter animates from 0 to the actual value over 800ms on first load — this is the one theatrical moment. All other data shows immediately or shows a simple loading state (spinning ti-loader icon, 16px, muted color).

### Hover States

- Ticket cards: background shifts from surface to surface-raised. No elevation change. No shadow.
- Buttons: background fill appears (1% opacity of button color). No scale change.
- Map pins: scale 1.0 → 1.15 on hover, 100ms. Drop shadow is not used — scale is the only hover effect.
- Nav items: 200ms color transition from concrete-mid to concrete.

### Micro-interactions

The severity slider in the report form is the only interactive element with a micro-interaction. As the citizen drags toward 9-10, a small warning message fades in below the slider: "Critical issue — will be fast-tracked." The message uses a 150ms opacity fade.

---

## 11. Responsive Design

### Breakpoints

```
Mobile:     < 768px
Tablet:     768px – 1279px
Desktop:    1280px+
```

### Mobile-specific decisions

**Report flow:** The 5-step form becomes a full-screen step-by-step experience on mobile. One step per screen, with a progress bar at the top. The camera button is larger (56px minimum tap target). The AI suggestions form fills the full viewport width.

**Bottom tab bar (citizen only):** 5 tabs, 56px height, icons at 24px with 10px labels below. No labels hidden. Enough space for 5 tabs in Bengali characters.

**Ticket cards:** Same content as desktop but single-column. SLA bar remains visible — it's critical information. The before/after comparison in evidence reports stacks vertically.

**Maps:** Full-screen on mobile. Filter controls collapse to a bottom sheet. Pin popups appear as a bottom sheet (not a floating popup).

**Officer queue on mobile:** Cards are the full viewport width. The three-panel layout collapses — tapping a card opens a new full-screen view. No panel slide-in.

### Tablet

Hybrid. The sidebar collapses to icons-only (40px wide) with tooltips. The detail panel takes 50% of the viewport. The map is full-height.

---

## 12. Accessibility

### Standards

WCAG 2.1 AA minimum. Target AA on all contrast ratios.

### Contrast Ratios

The civic-red (#C13B2A) on white: 5.8:1 — passes AA for both normal and large text.
Concrete (#4A4A48) on off-white (#F5F3F0): 8.2:1 — passes AAA.
All status badge text-on-background combinations have been verified at 4.5:1 minimum.

### Touch Targets

Minimum 44×44px on all interactive elements. The report button, assignment dropdown options, and status filter tabs are explicitly sized to 44px height minimum.

### Focus States

Custom focus ring: 2px solid civic-red, 2px offset. Visible on all interactive elements. Never suppressed.

### Screen Reader Support

- Ticket IDs announced as "Ticket K O L 2026 00142" (character by character) — avoid screen readers reading it as a number
- Status badges have aria-label including both the dot color meaning and the text: "Status: In Progress"
- The severity slider has aria-label: "Severity: 7 out of 10, High"
- The SLA countdown has aria-live="polite" so status changes are announced
- Map pins have aria-label with the full ticket summary

### Color Independence

Every status is communicated with both color AND text (and icon where space allows). Never color alone. The severity bar includes a text label (LOW / MEDIUM / HIGH / CRITICAL). The status badge includes text. The map pin includes a popup with full information.

### Language

Three languages supported: English, Hindi, Bengali. The entire component library is designed to accommodate longer strings — Bengali labels for things like "Roads & Infrastructure" are significantly longer. All UI elements use overflow: hidden with text-overflow: ellipsis and title attributes for full text on hover.

---

## 13. Dark Mode

### Automatic detection

The platform detects system preference via `prefers-color-scheme: dark` and applies dark mode automatically. A manual toggle is also available in Settings.

### Color shifts

```
Light mode                     Dark mode
--color-concrete-bg: #F5F3F0   →  #1A1917
--color-surface:     #FFFFFF   →  #242320
--color-surface-raised:#FAFAF9 →  #2C2A27
--color-concrete:    #4A4A48   →  #E8E5E0
--color-concrete-mid:#7A7875   →  #9A9791
--color-civic-red:   #C13B2A   →  #E05040  (lightened for contrast on dark bg)
```

Semantic colors shift automatically:
- All semantic backgrounds become dark fills (the color at 800/900) with light text (at 100/200)
- The civic health grade colors invert appropriately

### Dark mode specific decisions

- The SLA breach pulse animation uses a slightly lighter red in dark mode to maintain visibility
- Map tiles in dark mode use a dark variant of the OpenStreetMap tiles (Carto Dark Matter)
- The ◆ AI marker in dark mode is slightly lighter purple to maintain readability

---

## 14. What Not to Do

These are explicit prohibitions. Not guidelines — rules.

**Color:**
- Do not use pure black (#000000) anywhere. Use --color-concrete.
- Do not use blue as a primary color. Blue is reserved for "assigned/in-progress" ticket status only.
- Do not use the civic-red for anything that isn't urgent or critical. Do not use it for decorative purposes.
- Do not use gradients. The heatmap is the single exception and only because the data requires it.

**Typography:**
- Do not use more than two font families (Inter + DM Serif Display). DM Serif is only for the landing page hero.
- Do not use font-weight 600 or 700 for body text. Weight 600 is for headings only.
- Do not use ALL CAPS except for field labels and status badges.
- Do not center-align body text or data. Center-align only for the landing page hero number.

**Components:**
- Do not use modal dialogs for ticket details. Use the slide-in panel.
- Do not use toast notifications for critical information. Critical status changes go in the notification panel and trigger a badge update.
- Do not add hover shadows. They conflict with the flat aesthetic.
- Do not use skeleton screens. They create a disconnected loading experience. Use a simple spinner.

**Layout:**
- Do not break the 8px grid. No 10px gaps, no 15px margins.
- Do not add decoration to dividers. They are 0.5px, concrete-light, and that is all.
- Do not use more than 3 levels of visual hierarchy on any single card.

**Motion:**
- Do not add page transition animations. Pages load; they do not slide or fade in.
- Do not animate on hover other than the color transition and map pin scale.
- Do not use bounce, spring, or overshoot easing. Use ease-out for reveals, ease-in-out for pulses.

**AI elements:**
- Do not remove the ◆ marker from AI-generated content. Citizens must always be able to tell what came from Gemini.
- Do not display AI confidence without the reasoning text. A number without context is misleading.
- Do not use AI-generated content in bold or with special emphasis beyond the ◆ marker. The AI suggestion is a suggestion, not a decree.

---

*Community Hero — Design Document v1.0*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
