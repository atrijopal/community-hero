# Community Hero — End-to-End Implementation & UI/UX Audit

**Auditor scope:** full repository (`atrijopal/community-hero`), `docs/` design + spec set, backend (`/backend`), frontend (`/frontend/src`).
**Date:** 26 June 2026

---

## Executive summary — the single most important finding

**You already wrote the redesign you are asking for.** `docs/community_hero_design_doc.md` is a genuinely excellent, opinionated, senior-level design system: anti-blue, civic-red + warm "concrete" greys, newspaper/municipal aesthetic, Tabler outline icons, a precisely-specified `TicketCard`, an 8px spacing scale, and a three-panel officer/admin layout. It explicitly forbids exactly the thing you are unhappy with — and I quote it:

> *"Generic dashboard templates with blue header bars and white cards in a 3-column grid… Any design that could plausibly belong to a food delivery app, a project management tool, or a fintech startup."* — design doc §1, "What This Rules Out"

The **implementation ignored that document almost entirely.** The shipped UI is a generic blue-and-gray Tailwind dashboard with rounded-2xl cards and emoji icons — precisely the aesthetic the doc rules out. The gap is measurable:

| Token family | Times used in `frontend/src` | Should be |
|---|---|---|
| `blue-*` / `indigo-*` (bg/text/border/ring) | **~190** | near-zero (blue is semantic-only: "assigned / in progress") |
| `gray-*` / `slate-*` | **~390** | should be the warm `concrete-*` palette |
| Documented design tokens (`civic`, `concrete`, `critical`, `predicted`…) | **~6 total** | should be the dominant palette |

So this is **not** a "design a new system" job. The system exists and it's good. This is a **"ship the system you already designed, and delete the two competing visual languages that crept in"** job. That reframing makes the whole effort dramatically cheaper and lower-risk than a from-scratch redesign.

There are currently **three conflicting visual languages** in the codebase:
1. **Landing page** — a bespoke purple theme (`brand-purple #7b39fc`, `brand-dark`, Manrope/Cabin/Instrument Serif fonts).
2. **Navbar** — the *correct* civic palette, but hard-coded as inline hex `style={{}}` with JS `onMouseEnter/onMouseLeave` handlers.
3. **Everything else** (all citizen/officer/admin pages, `StatusBadge`, `TicketCard`) — generic blue/gray Tailwind.

Unifying these onto the documented system is the core of the work.

---

# 1. Implementation vs Documentation Audit

## 1a. Feature implementation — mostly complete

Spot-checking the README/PRD feature list against the actual backend (`/backend/routes`, `/prompts`, `/workers`) and frontend pages: the product is **substantially built**, contrary to what the tracker claims (see 1b).

| Feature (per README / PRD) | Status | Evidence |
|---|---|---|
| Photo upload → AI classify | ✅ | `routes/ai.js` `POST /classify`, `prompts/classify.js`, `ReportFlow/Step2AIReview.jsx` |
| Ticket create + public ID | ✅ | `routes/tickets.js` `POST /`, `PublicTracker.jsx` |
| Duplicate detection | ✅ | `prompts/detectDuplicate.js` |
| Resolution validation (before/after) | ✅ | `prompts/validateResolution.js`, `officer/ResolutionUpload.jsx` |
| Ghost detection worker | ✅ | `workers/ghostWorker.js`, `prompts/detectGhost.js` |
| QueryBot (function calling) | ✅ | `routes/tickets.js` `POST /:id/query`, `services/queryFunctions.js` |
| RTI auto-generation | ✅ | `prompts/generateRTI.js`, `services/pdfService.js`, `workers/slaWorker.js` |
| Ward report generation | ✅ | `prompts/generateReport.js`, `admin/Reports.jsx` |
| Predictions worker | ✅ | `workers/predictWorker.js`, `prompts/predictIssues.js`, `admin/Predictions.jsx` |
| Assignment / status flow | ✅ | `PATCH /:id/assign`, `PATCH /:id/status` |
| Upvote / reopen / rate | ✅ | `POST /:id/upvote`, `/reopen`, `/rate` |
| Gamification (XP, badges, leaderboard) | ✅ | `hooks/useGamification.js`, `citizen/Leaderboard.jsx` |
| Multilingual (en/hi/bn) | ✅ | `utils/translations.js`, `services/translateService.js`, `LanguageContext` |
| Notifications (WhatsApp/email/FCM) | 🟡 | `services/notifyService.js` exists; gated on env keys, skipped if blank (per README) — not verified end-to-end |

**The functional layer is in good shape.** Your problem is genuinely the presentation layer, not missing features.

## 1b. Documentation discrepancies — ⚠

1. **⚠ The build tracker is stale and badly understates reality.** `docs/community_hero_build_tracker.md` (last updated 24 June) shows `AI Features 0%`, `Officer UI 0%`, `Admin UI 0%`, `Workers 0%`, and **every checklist item unchecked `[ ]`** — yet all of those are implemented in the repo. Anyone reading the tracker would conclude the project is ~20% done. **Fix:** bring the tracker in line with the code, or delete it; right now it actively misleads.

2. **⚠ The design doc is implemented at <5% fidelity.** This is the central discrepancy and is detailed in §2–§3. Files: `tailwind.config.js` defines the tokens correctly but they're unused; `index.css` and almost every page use generic Tailwind instead.

3. **⚠ The AI marker color contradicts the doc.** Doc §3: *purple* (`--color-predicted #6B50B8`) is reserved for "AI-related outputs." Implementation `Step2AIReview.jsx` renders the `◆ AI` badge as `bg-blue-100 text-blue-600` — blue, not purple. The diamond glyph is right; the color is wrong.

4. **⚠ Confidence bar uses blue for "medium."** `ConfidenceBar` colors medium confidence `bg-blue-500`. Per the doc's semantic rules, amber means "warning/uncertain," blue means "in progress." Medium confidence should be amber.

5. **⚠ `TicketCard` does not match its spec.** Doc §7.1 gives the card a full anatomy (monospace ID, top-right semantic status, hairline dividers, a 4px SLA progress bar that shifts green→amber→red, the `◆` AI-confidence marker). The shipped `TicketCard.jsx` has none of the SLA bar, none of the AI marker, uses `rounded-xl border-gray-200 hover:border-blue-300 group-hover:text-blue-600`, and substitutes emoji (👤 👍 ⚡ 👻) for the specified icon set.

6. **⚠ Three-panel layout never built.** Doc §5 specifies officer/admin screens as `sidebar (220px) + main + slide-in detail panel (380px)` so the queue stays visible while reviewing a ticket. Implementation routes each view to a **separate full page** behind the same top `Navbar` (e.g. `admin/UnassignedQueue.jsx`, `officer/MyQueue.jsx`). This is a real UX regression, not just cosmetics — see §3.

7. **⚠ Iconography violates the doc.** Doc §6 mandates Tabler **outline** icons, never decorative, each paired with a label. Implementation uses emoji as primary iconography across nearly every page (`🏛️ ⚡ 📋 ✅ 👻 🔮 🗺️ 🤖 …`). Emoji render inconsistently across OS/browser, aren't theme-able, and read as "consumer app," not "civic accountability tool."

8. **⚠ Leftover Google-blue artifacts.** `public/index.html` sets `<meta name="theme-color" content="#1A73E8">` (Google blue). `index.css` scrollbar uses slate `#f1f5f9 / #cbd5e1 / #94a3b8`. Both contradict the warm palette.

---

# 2. Design System Proposal

**Recommendation: adopt `docs/community_hero_design_doc.md` as-is.** It is better than what most teams produce from scratch and it already fits the product's purpose. Below is the operational version — what to put in code so the system is actually enforced rather than re-typed per file.

## 2.1 Color — move tokens into one source of truth

`tailwind.config.js` already has the right values. Three corrections:
- **Delete** `brand-purple` and `brand-dark` (the Landing-only purple theme). Landing should use the same system as the app.
- **Add** the missing semantic tokens so pages stop reaching for raw Tailwind: `success #1A7A4A`, `warning #D4730A`, `danger #C13B2A`, `info #2D6A9F`, and the warm surface tokens `surface #FFFFFF`, `surface-raised #FAFAF9`, plus a `border #E5E2DE` token.
- **Enforcement rule (the one that fixes "heavily blue"):** blue (`resolved/info #2D6A9F`) is allowed **only** for `ASSIGNED` / `IN_PROGRESS` status and "institutional reference." Every other blue in the codebase is a bug. Treat `bg-blue-*`, `text-blue-*`, `bg-gray-*`, `text-gray-*` as **lint failures** (add an ESLint `no-restricted-syntax` / Tailwind class denylist) so they can't silently return.

Semantic encoding (verbatim from the doc, worth restating because it's the discipline that makes the UI feel premium): **red** = critical/danger/ghost/SLA-breach/RTI; **amber** = high severity/warning/near-breach/pending; **green** = resolved/verified/on-time; **blue** = assigned/in-progress only; **purple** = AI outputs only; **grey** = neutral/structural. Color never decorates.

## 2.2 Typography

Keep the doc's scale; fix the font loading to match it. Currently `index.html` loads Manrope/Cabin/Instrument Serif (for the purple Landing) **plus** Inter/JetBrains Mono. Standardize on:
- **Inter** — UI, headings, body (H1 24/600 −0.3px, H2 18/600, H3 15/600, body 14/400 lh 1.6, label 12/500 uppercase +0.3px).
- **JetBrains Mono** — ticket IDs, coordinates, timestamps (always; IDs uppercase, never wrapped).
- **One serif display** (DM Serif / Instrument Serif) — used **once per page maximum**, only for the landing hero counter and major empty states.
- **Data numerals** — Inter 700, 28–36px for metrics, inheriting semantic color.

Drop Manrope and Cabin entirely — they're the purple-theme remnants and add two font payloads for no system benefit.

## 2.3 Spacing, radius, elevation

- **Spacing:** 8px base (4 / 8 / 12 / 16 / 24 / 32 / 48). Already in the doc; just apply it.
- **Radius:** the doc's serious aesthetic implies **tight corners**: `4px` (badges/inputs), `6–8px` (cards/buttons). The pervasive `rounded-2xl` (16px) and `rounded-3xl` and `rounded-full` pills are the biggest single contributor to the "generic SaaS" feel. **Standardize on an 8px card radius and 4px badge radius; remove `rounded-2xl/3xl/full`** except true circles (avatars).
- **Elevation:** prefer **1px hairline borders** (`#E5E2DE`) over drop shadows. The current `hover:shadow-md` everywhere reads as Material/cloud-console. Use shadow sparingly — only for the slide-in detail panel and modals.

## 2.4 Grid & layout (see §3 for per-page)

- Desktop 12-col, 24px gutters, 32px page margins, 1200px max content.
- **Officer & Admin:** implement the documented `Sidebar 220px → Main (flex) → Detail panel 380px (slide-in)` shell as a reusable layout, replacing the current top-nav-only, page-per-view pattern.
- **Citizen:** the two-panel `Sidebar 220px → Main` shell.

## 2.5 Iconography

Replace all emoji with **Tabler outline icons** (`@tabler/icons-react`), 20px inline / 16px tight, every nav/action icon paired with a text label. Map the status/department/action icons exactly as the doc §6 lists them.

---

# 3. UI/UX Audit — page by page

> The blue/gray/rounded-2xl/emoji pattern is **global** (verified by class-frequency counts across every page). To avoid repetition, the recurring defects are listed once, then each page gets its specific notes.

**Recurring defects (apply to nearly every screen):** generic blue primary buttons (`bg-blue-600 hover:bg-blue-700`); pages on `bg-gray-50` instead of warm `concrete-bg #F5F3F0`; `rounded-2xl` cards with `hover:shadow-md`; emoji icons; `StatusBadge` as colored pills using raw Tailwind colors; no use of the documented tokens.

### Landing (`pages/Landing.jsx`)
- **Wrong:** a third visual language — bespoke purple (`brand-purple`) with Manrope/Cabin/Instrument Serif. It doesn't resemble the app the user enters after sign-in, breaking trust continuity.
- **Redesign:** rebuild on the civic system. Lead with the doc's prescribed serif **display counter** ("1,247 issues reported this month") in `concrete` on `concrete-bg`; civic-red primary CTA; the ticket-tracker input as a prominent monospace field; "How it works" as three bordered (not shadowed) cards with Tabler icons. Keep the community map but restyle markers to department colors.

### Login (`pages/Login.jsx`)
- 9 blue / 12 gray usages. Generic centered card.
- **Redesign:** single civic-red primary action, concrete neutrals, mono for any IDs, hairline-bordered card on warm background. Remove the blue ring focus in favor of a `civic` focus ring (see accessibility).

### Citizen Home (`pages/citizen/CitizenHome.jsx`)
- The **only** page already touching civic tokens (3 usages) — but still 7 `rounded-2xl` and 9 gray. Half-migrated.
- **Redesign:** finish the migration; this is your reference page. Two-panel shell; "Report an issue" as the dominant civic-red action; recent tickets rendered with the corrected `TicketCard`.

### Report flow (`components/citizen/ReportFlow/Step1–5`)
- Step2 (`Step2AIReview.jsx`): AI badge is blue (should be purple); medium confidence bar is blue (should be amber); spinner `border-blue-500`; emoji headers (🤖).
- **Redesign:** a clear stepper (1 Photo · 2 AI Review · 3 Location · 4 Contact · 5 Submit) with a thin progress indicator. AI-suggested fields marked with the purple `◆` diamond and an "edited" state when the citizen overrides. Replace spinner color; make the low-confidence warning amber per semantics. This flow is functionally good — it just needs the palette and the AI-marker discipline.

### My Tickets (`pages/citizen/MyTickets.jsx`) & Public Tracker (`pages/PublicTracker.jsx`)
- Tracker timeline uses emoji medallions (📋 👮 ✅ 👻) in gray circles; `StatusBadge` pills.
- **Redesign:** the tracker is the product's emotional core ("is my pothole being fixed?"). Make status + officer name + SLA countdown impossible to miss at the top (doc's "radical clarity"). Timeline as a true vertical timeline with Tabler icons colored by action semantics. QueryBot answers marked with the purple `◆`.

### Officer Dashboard / My Queue (`pages/officer/*`)
- 7 blue / 18 gray (dashboard); page-per-view, no detail panel.
- **Redesign:** implement the **three-panel** shell. Queue list center; clicking a ticket slides in the 380px detail panel (photo, AI classification, SLA, actions: assign-self, status, upload resolution) **without leaving the queue**. This removes a full navigation round-trip per ticket — the biggest workflow win available.

### Queries Inbox / Performance (`pages/officer/*`)
- Standard blue/gray. Performance uses Recharts with default colors.
- **Redesign:** charts must use semantic palette (resolved=green, breached=red), not Recharts defaults. Performance metrics in the doc's large data-numeral style.

### Admin Overview (`pages/admin/AdminOverview.jsx`)
- **Textbook example of the problem.** `StatCard` defaults to `text-blue-600 bg-blue-50`; the six stat cards are blue/green/orange/red/purple/indigo pastel tiles; `rounded-2xl`; emoji icons; blue CTA. This is the "generic dashboard with blue header and white cards in a grid" the doc explicitly forbids.
- **Redesign:** dense, newspaper-style metric row — large Inter-700 numerals in semantic color over uppercase labels, separated by hairlines rather than pastel tiles. One serif display number for the headline metric. Trends chart restyled to the semantic palette. CTA in civic-red.

### Unassigned Queue / All Tickets (`pages/admin/*`)
- 7 blue / 22 gray (Unassigned); 15 gray (All Tickets). Tables/filters in generic styling.
- **Redesign:** lean into "tables that aren't apologetic about being tables" (doc §2). Monospace IDs, semantic status, sortable columns, sticky header, density toggle. Assignment via the slide-in detail panel. Filters as a left rail, not a row of blue chips.

### Staff Management / System Settings / Ward Map / Predictions / Reports (`pages/admin/*`)
- All generic blue/gray (Staff: 8 blue/21 gray; Settings: 3/11). Predictions should be the **purple** AI surface per semantics but currently isn't.
- **Redesign:** Predictions and any AI output framed in purple with the `◆` marker. Ward Map markers in department colors. Settings as a clean two-column form (label left, control right) using the typography label/value distinction.

### Shared components
- **`Navbar.jsx`:** correct colors but implemented as inline hex + JS hover handlers — no `:focus-visible`, not keyboard-accessible on hover styling, can't be themed. **Rebuild with Tailwind civic tokens and real CSS states.** Replace emoji role labels with Tabler icons + text.
- **`StatusBadge.jsx`:** raw Tailwind color map, `rounded-full`. Rebuild to spec: 4px radius, semantic color at 10% bg + full-saturation text, uppercase, with the documented status icon.
- **`TicketCard.jsx`:** rebuild to doc §7.1 (mono ID, top-right status, SLA progress bar, `◆` AI marker, hairline dividers, Tabler icons). This one component appears on the map popup, My Tickets, and the tracker — fixing it propagates everywhere.
- **`LoadingSpinner`, `ConfirmModal`, toasts (`react-hot-toast`):** spinner uses blue; modals/toasts likely default-styled. Theme all three to the system (civic spinner, hairline modal, neutral toasts with semantic left-border for success/error).

### State coverage (empty / loading / error / success)
- Loading states exist (spinners) but are blue and generic. **Empty states** are mostly plain text ("No timeline events yet."). The doc calls for major empty states to use the serif display voice — make them intentional ("No tickets in your ward yet. The street is quiet."). **Error states** weren't found as a consistent pattern — add a shared error component. Success currently relies on toasts.

---

# 4. Page-by-Page Redesign Plan (condensed)

For every page the plan is the same shape, so here's the template plus the three highest-leverage screens called out.

**Template per page:** (1) swap page bg to `concrete-bg`; (2) replace blue/gray classes with `civic`/`concrete`/semantic tokens; (3) cards → 8px radius + hairline border, drop shadow; (4) emoji → Tabler icons + labels; (5) `StatusBadge`/`TicketCard` → corrected shared components; (6) apply type scale (labels uppercase 12/500, values body/data).

**Highest leverage, do first:**
1. **`tailwind.config.js` + token cleanup + lint rule** — unblocks everything, ~½ day.
2. **`StatusBadge` + `TicketCard` + `Navbar` + `LoadingSpinner`** — shared components that propagate across all pages, ~1 day.
3. **Officer/Admin three-panel shell** — the one true UX (not cosmetic) improvement; converts page-per-ticket into inline review, ~1–2 days.

**Then** Admin Overview, Tracker, Report flow, and the rest, page by page, using the template.

---

# 5. Component Library Specification

| Component | Shape / radius | Border / elevation | Color | States |
|---|---|---|---|---|
| **Button (primary)** | 6–8px | none / hairline | `civic` bg, white text | hover `civic-dark`; focus `civic` ring 2px offset; active darken; disabled `concrete-light` |
| **Button (secondary)** | 6–8px | 1px `border` | transparent → `civic-bg` on hover | same focus ring |
| **Input / Select** | 4–6px | 1px `border`; focus `civic` ring | white bg, `concrete` text | error: `danger` border + helper text |
| **Status badge** | 4px | none | semantic @10% bg + full-sat text, uppercase, status icon | static |
| **Ticket card** | 8px | 1px `border`; hover border-darken (no shadow) | mono ID, semantic status, SLA bar green→amber→red, `◆` AI | hover, selected (left `civic` rail) |
| **Severity chip / bar** | 2px bar | none | severity color 1–10 | n/a |
| **Progress / SLA bar** | full | none | 4px height, color shifts by % to deadline | animates on update |
| **Table** | 0 | hairline row dividers, sticky header | mono IDs, semantic status cells | row hover `surface-raised`, sortable headers |
| **Tabs** | 0 | 2px bottom border on active | active `civic`, rest `concrete-mid` | focus-visible underline |
| **Modal / dialog** | 8px | shadow (one of the few allowed) | white surface, `civic` primary action | focus-trapped, ESC to close |
| **Toast** | 6px | hairline + 3px semantic left border | neutral bg, semantic accent | auto-dismiss, role=status |
| **AI badge** | 4px | none | **purple** `predicted` @10% bg, `◆` glyph | mark all AI output |
| **Nav item** | 6px | none | `concrete-mid` → `civic` on hover/active, `civic-bg` active bg | `:focus-visible` ring |
| **Detail panel** | 0 | left hairline + soft shadow | white, slides 380px from right | open/close transition 150–200ms |

Interaction defaults: transitions 120–200ms ease-out; hover changes border/color, not size; **every** interactive element has a visible `:focus-visible` ring in `civic`.

---

# 6. Prioritized Action Plan

### Critical — must fix before release
- **C1. Unify on the documented design system; remove the purple Landing theme and blue/gray everywhere.** This is the user's actual complaint. Start at `tailwind.config.js` (delete `brand-*`, add semantic + surface tokens) and `index.html`/`index.css` (kill `theme-color #1A73E8`, restyle scrollbar).
- **C2. Add a lint/denylist** for `blue-*`, `indigo-*`, `gray-*`, `slate-*`, `rounded-2xl/3xl/full` so the generic look can't return.
- **C3. Rebuild the four shared components** (`StatusBadge`, `TicketCard`, `Navbar`, `LoadingSpinner`) to spec — propagates fixes app-wide.
- **C4. Replace emoji iconography** with Tabler outline icons + labels.
- **C5. Fix AI-marker semantics** (purple, not blue) and confidence-bar color (amber for medium).
- **C6. Correct the build tracker** (or remove it) — it currently claims the app is ~20% built when it's ~90% built.

### Important — strongly recommended
- **I1. Implement the three-panel officer/admin shell** with inline slide-in detail panel (real workflow gain, removes a navigation round-trip per ticket).
- **I2. Restyle all Recharts** to the semantic palette.
- **I3. Standardize spacing (8px), radius (8/4px), and replace shadows with hairlines** across pages.
- **I4. Add shared empty/error/loading state components** in the system's voice.
- **I5. Accessibility pass:** `:focus-visible` rings everywhere; verify contrast of `concrete-mid #7A7875` on `concrete-bg` for small text (it's borderline — use `concrete #4A4A48` for body); ensure status is never color-only (always icon + label, which the doc already mandates); keyboard-operable nav (the current JS-hover Navbar isn't).

### Nice to have — future polish
- **N1.** Serif display numerals on hero/empty states.
- **N2.** Detail-panel open/close and SLA-bar update animations.
- **N3.** Dark mode (doc §13 anticipates it).
- **N4.** Density toggle on admin tables.
- **N5.** Consolidate fonts (drop Manrope/Cabin) to cut payload.

---

## Closing note
The most efficient path is not a redesign sprint — it's an **enforcement sprint**: make the codebase obey the design document it already ships with. Two thirds of the "premium" feeling will arrive the moment C1–C4 land, because the underlying system was already designed to deliver exactly the enterprise, civic, anti-blue product you're after.

---

# 7. Report Flow Redesign — citizen intake (added per request)

## Current pipeline
`Step1 Photo → (auto AI classify) → Step2 AI Review → Step3 Location → Step4 Contact → Step5 Submit`
(`pages/citizen/ReportPage.jsx`, `components/citizen/ReportFlow/*`). The AI is the **decider**: it classifies from the photo alone (`POST /ai/classify`, `prompts/classify.js`), and the citizen edits its guess in Step2. This anchors users to whatever the model decided and has no integrity check — an unrelated or mismatched photo sails through.

## Proposed pipeline
`Category → Photo → Details → AI Review + Match Check → Location → Contact → Submit`

The change reframes AI from **decider** to **assistant + verifier**, which is a better fit for an accountability product.

**Step order and rationale**
1. **Category** — citizen selects department/issue type up front (large tappable cards + Tabler icons). **Must include a "Not sure? Let AI decide" escape hatch** that skips declaration and falls back to today's photo-first AI classification. This preserves the "snap and AI does it" selling point the Landing page advertises, while giving confident users the structured path.
2. **Photo** — unchanged capture/upload.
3. **Details** — short free-text description (and optional severity hint).
4. **AI Review + Match Check** — the upgraded Step2. AI now does two jobs:
   - **(a) Match verification:** cross-checks the photo against the declared category + details and surfaces a clear banner — e.g. `✓ Photo matches — looks like a pothole (92%)` or `⚠ Possible mismatch — the photo appears to show garbage, not a pothole. Recategorize?`
   - **(b) Enrichment:** confirms/sets severity (1–10), danger level, department routing, and a refined description. AI-touched fields carry the purple `◆` marker (per design-system semantics).
5–7. **Location → Contact → Submit** — unchanged.

## Critical design rule — soft-gate, never hard-block
On a detected mismatch: **warn, suggest recategorizing, and flag the ticket for officer review — but still allow submission.** Hard-blocking would suppress legitimate edge-case reports the model fails to recognize, which contradicts the platform's purpose. The mismatch flag also becomes a useful spam/quality signal for triage and feeds naturally into existing ghost/duplicate logic.

## Why this is an improvement
- **Integrity gate at intake** — catches spam, joke uploads, and category errors before they reach an officer's queue.
- **Reduces anchoring** — the citizen states intent first; AI confirms rather than dictates.
- **Trust signal** — an explicit "photo matches your report" line reads as diligence, reinforcing the accountability brand.
- **Better routing for confident users** — human-declared category + AI confirmation beats photo-only classification when the user actually knows the category; the escape hatch protects the rest.

## Implementation impact

**Frontend (small):**
- `ReportPage.jsx`: extend `STEPS` to `['Category','Photo','Details','AI Review','Location','Contact','Submit']`; add `category`/`details` state; move the `/ai/...` call to fire after Details (so it has photo + category + details) instead of immediately after photo.
- New `Step0Category.jsx` (cards + "Let AI decide" escape) and `StepDetails.jsx` (textarea).
- Upgrade `Step2AIReview.jsx` to render the match/mismatch banner above the existing editable fields.

**Backend (the real work — new AI touchpoint):**
- Add `prompts/verifyReport.js` and a route (extend `routes/ai.js`, e.g. `POST /ai/verify`) that accepts **photo + declaredCategory + declaredType + description** and returns:
  ```
  { match: boolean, matchConfidence: 0–100, detectedType, mismatchReason,
    severity, dangerLevel, departmentId, refinedDescription }
  ```
- When the user takes the "Let AI decide" escape hatch, call the existing `classify` instead (no declared category to verify against). Keep both paths.
- Persist `match`, `matchConfidence`, and `mismatchReason` on the ticket so officers and triage can see the intake integrity signal; surface a mismatch flag on the `TicketCard` / admin queue.

## Priority placement
This is **Important** (not Critical) for launch: the existing flow is functional. But the **match-check** specifically is the high-value half — if scoping down, ship the AI match-verification first (biggest quality/trust gain) and treat strict category-first ordering as the second increment behind the escape hatch.
