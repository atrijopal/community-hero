# Database Schema & Seed Data Guide
## Community Hero — Hyperlocal Problem Solver
**Version:** 1.0
**Date:** June 2026
**Database:** Firebase Firestore (NoSQL document store)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Collections Summary](#2-collections-summary)
3. [Enums & Constants Reference](#3-enums--constants-reference)
4. [Collection Schemas](#4-collection-schemas)
   - [tickets](#41-tickets)
   - [ticket_logs](#42-ticket_logs)
   - [officers](#43-officers)
   - [departments](#44-departments)
   - [users](#45-users)
   - [gamification](#46-gamification)
   - [predictions](#47-predictions)
   - [queries](#48-queries)
   - [ward_reports](#49-ward_reports)
   - [overrides](#410-overrides)
   - [counters](#411-counters)
   - [ward_stats](#412-ward_stats)
   - [verifications](#413-verifications)
5. [Seed Data — Departments](#5-seed-data--departments)
6. [Seed Data — Officers](#6-seed-data--officers)
7. [Seed Data — Admin User](#7-seed-data--admin-user)
8. [Seed Data — Sample Tickets](#8-seed-data--sample-tickets)
9. [Seed Data — Gamification](#9-seed-data--gamification)
10. [Seed Data — Predictions](#10-seed-data--predictions)
11. [Seed Data — Ward Stats](#11-seed-data--ward-stats)
12. [Seed Data — Counters](#12-seed-data--counters)
13. [Seed Script](#13-seed-script)
14. [Fake Image URLs](#14-fake-image-urls)
15. [Firestore Index Requirements](#15-firestore-index-requirements)
16. [Data Relationships Map](#16-data-relationships-map)

---

## 1. Overview

### Why Firestore?
Firestore is a NoSQL document database. There are **no joins** — data is either embedded in documents or referenced by document ID. Denormalization is intentional and necessary for performance.

### Key Design Decisions
- **Append-only audit trail**: `ticket_logs` is never updated, only added to
- **Denormalized officer name**: stored on `tickets.assignedOfficerName` for fast reads without a join
- **Denormalized counters**: `officers.activeCaseCount` maintained by server on each assign/resolve
- **Geohash stored on tickets**: enables geo-proximity queries without Google Maps API
- **publicId vs docId**: tickets have a human-readable `publicId` (KOL-2026-00142) and a salted Firestore document ID (KOL-2026-00142-a3f9c2) to prevent enumeration
- **internalNotes field**: exists on tickets but Firestore Security Rules prevent citizens from reading it
- **All timestamps as ISO 8601 strings**: e.g. `"2026-06-22T15:42:00.000Z"` — consistent across timezones

### Storage Structure (Firebase Storage)
```
gs://community-hero-xxx.appspot.com/
├── tickets/
│   └── {ticketDocId}/
│       ├── report/
│       │   └── {timestamp}.jpg        ← original report photo
│       ├── resolution/
│       │   └── {timestamp}.jpg        ← officer's resolution photo
│       └── reopen/
│           └── {timestamp}.jpg        ← ghost re-report photos
└── reports/
    └── ward_82_june_2026.pdf          ← admin-generated PDF reports
```

---

## 2. Collections Summary

| Collection | Documents | Write By | Read By | Purpose |
|---|---|---|---|---|
| `tickets` | One per civic issue | Anyone (create), Officer/Admin (update) | Public (masked) | Core issue tracking |
| `ticket_logs` | One per state change | Server only | Public | Append-only audit trail |
| `officers` | One per officer | Admin only | Admin, Officer | Staff profiles + metrics |
| `departments` | One per department | Admin only | Officer, Admin | Department config |
| `users` | One per citizen | Citizen (own), Server | Citizen (own), Admin | Citizen profiles + FCM tokens |
| `gamification` | One per citizen | Server, Citizen (own) | Public | XP, badges, streaks |
| `predictions` | One per AI prediction | Server only | Public | Predictive issue flags |
| `queries` | One per citizen question | Anyone (create) | Officer (assigned), Admin | Ticket Q&A inbox |
| `ward_reports` | One per ward+month | Server only | Officer, Admin | Monthly Gemini reports |
| `overrides` | One per override request | Server only | Admin, Senior Officer | Override audit log |
| `counters` | One per city | Server only | Server only | Sequential ticket ID counter |
| `ward_stats` | One per ward | Server only | Public | Cached civic health scores |
| `verifications` | One per ticket | Server only | Server, Officer | Peer verification tracking |

---

## 3. Enums & Constants Reference

These values are used across all collections. All validation in the backend uses these exact strings.

### 3.1 Ticket Status States
```javascript
const TICKET_STATUS = {
  UNASSIGNED:       'UNASSIGNED',       // submitted, no officer yet
  VERIFIED:         'VERIFIED',         // peer verification passed
  ASSIGNED:         'ASSIGNED',         // officer manually assigned by admin
  IN_PROGRESS:      'IN_PROGRESS',      // officer acknowledged
  RESOLVED:         'RESOLVED',         // officer uploaded proof, Gemini validated
  GHOST_FLAGGED:    'GHOST_FLAGGED',    // resolved but re-reported, AI confirmed same issue
  ESCALATED:        'ESCALATED',        // passed to senior officer
  RTI_FILED:        'RTI_FILED',        // Day 30 — RTI auto-generated
  CLOSED_OVERRIDE:  'CLOSED_OVERRIDE',  // closed via manual override
  REJECTED:         'REJECTED',         // false report confirmed by peers/admin
};
```

### 3.2 Issue Types
```javascript
const ISSUE_TYPES = [
  'pothole',
  'damaged_road',
  'broken_footpath',
  'open_manhole',         // auto-severity: minimum 9
  'waterlogging',
  'garbage',
  'sewage_overflow',
  'water_leakage',
  'broken_light',
  'broken_signal',
  'exposed_wire',         // auto-severity: minimum 9
  'fallen_tree',
  'illegal_dumping',
  'broken_park_equipment',
  'other',
];
```

### 3.3 Categories
```javascript
const CATEGORIES = [
  'Infrastructure',
  'Water_Drainage',
  'Sanitation',
  'Electricity',
  'Public_Safety',
  'Environment',
  'Public_Facilities',
];
```

### 3.4 Danger Levels
```javascript
const DANGER_LEVELS = ['safe', 'moderate', 'critical'];
```

### 3.5 Department IDs
```javascript
const DEPARTMENT_IDS = [
  'roads_infrastructure',
  'water_supply',
  'sanitation',
  'electricity',
  'parks_recreation',
  'environment',
];
```

### 3.6 Officer Statuses
```javascript
const OFFICER_STATUS = ['active', 'on_leave', 'deactivated'];
```

### 3.7 Officer Roles (Firebase Custom Claims)
```javascript
const OFFICER_ROLES = {
  CITIZEN:        'citizen',        // default, no custom claim
  OFFICER:        'officer',        // claim: { officer: true }
  SENIOR_OFFICER: 'senior_officer', // claim: { senior_officer: true }
  ADMIN:          'admin',          // claim: { admin: true }
};
```

### 3.8 Designation Labels
```javascript
const DESIGNATIONS = [
  'Junior Engineer',
  'Senior Engineer',
  'Junior Inspector',
  'Senior Inspector',
  'Ward Officer',
  'Assistant Commissioner',
  'Deputy Commissioner',
];
```

### 3.9 Badge IDs
```javascript
const BADGE_IDS = [
  'pothole_hunter',     // Report 5 potholes
  'light_keeper',       // Report 3 broken lights
  'ghost_buster',       // Catch 2 ghost closures
  'monsoon_watch',      // Report 3 waterlogging issues
  'first_responder',    // First report in ward
  'rti_warrior',        // File first RTI
  'ward_legend',        // #1 leaderboard for full month
  'verified_voice',     // 10 reports verified by peers
  'streak_master',      // 14-day streak
  'explorer',           // Report in 5 different zones
  'safety_sentinel',    // Report 2 critical issues
  'fact_checker',       // Verify 20 peer reports
];
```

### 3.10 XP Action Values
```javascript
const XP_ACTIONS = {
  FIRST_REPORT:         50,
  REPORT_VERIFIED:      30,
  REPORT_RESOLVED:     100,
  UPVOTED_OTHER:         5,
  GHOST_CAUGHT:        150,
  VERIFIED_REPORT:      20,
  SEVEN_DAY_STREAK:    200,
  RTI_FILED:            75,
  RESOLUTION_RATED:     10,
  FIRST_IN_NEW_WARD:    25,
  WEEKLY_CHALLENGE:    100,
};
```

### 3.11 Level Tiers
```javascript
const LEVELS = [
  { name: 'Aware Citizen',      minXP: 0     },
  { name: 'Active Resident',    minXP: 500   },
  { name: 'Community Guardian', minXP: 1500  },
  { name: 'Ward Champion',      minXP: 3500  },
  { name: 'Civic Hero',         minXP: 7000  },
];
```

### 3.12 Verification States
```javascript
const VERIFICATION_STATUS = [
  'PENDING',    // waiting for peer votes
  'VERIFIED',   // 2/3 peers confirmed
  'REJECTED',   // 2/3 peers denied
  'GEMINI',     // verified by Gemini backup (no nearby peers)
];
```

### 3.13 Log Action Types
```javascript
const LOG_ACTIONS = [
  'TICKET_CREATED',
  'PEER_VERIFICATION_SENT',
  'VERIFIED',
  'REJECTED',
  'OFFICER_ASSIGNED',
  'OFFICER_REASSIGNED',
  'ACKNOWLEDGED',
  'STATUS_CHANGE',
  'RESOLVED',
  'RESOLUTION_REJECTED',
  'GHOST_FLAGGED',
  'GHOST_REOPENED',
  'ESCALATED',
  'OVERRIDE_REQUESTED',
  'OVERRIDE_APPROVED',
  'OVERRIDE_REJECTED',
  'RTI_GENERATED',
  'FIRST_APPEAL_GENERATED',
  'UPVOTED',
  'QUERY_SUBMITTED',
  'QUERY_REPLIED',
  'REMINDER_SENT',
  'RATING_SUBMITTED',
  'TICKET_CREATED',
  'CLOSED_OVERRIDE',
];
```

### 3.14 City Codes
```javascript
const CITY_CODES = {
  'Kolkata':   'KOL',
  'Mumbai':    'MUM',
  'Delhi':     'DEL',
  'Bangalore': 'BLR',
  'Chennai':   'CHE',
  'Hyderabad': 'HYD',
  'Pune':      'PUN',
};
```

### 3.15 Season Detection
```javascript
const getSeason = (month) => {
  if ([6,7,8,9].includes(month))  return 'monsoon';
  if ([3,4,5].includes(month))    return 'summer';
  return 'winter';
};
```

---

## 4. Collection Schemas

### 4.1 `tickets`

**Document ID:** `{CITY_CODE}-{YEAR}-{5-digit-seq}-{6-char-salt}`
Example: `KOL-2026-00142-a3f9c2`

**Complete field reference:**

```javascript
{
  // ── IDENTITY ──────────────────────────────────────────────────────────
  publicId: String,
  // Human-readable ticket ID shown to users. Format: KOL-2026-00142
  // Indexed for lookup queries. NOT the Firestore document ID.

  // ── STATUS ────────────────────────────────────────────────────────────
  status: String,
  // One of TICKET_STATUS values. Server enforces valid transitions.
  // Default: 'UNASSIGNED'

  // ── CLASSIFICATION ────────────────────────────────────────────────────
  issueType: String,
  // One of ISSUE_TYPES values
  // Example: 'pothole'

  category: String,
  // One of CATEGORIES values
  // Example: 'Infrastructure'

  severity: Number,
  // Integer 1–10. Life-safety issues (open_manhole, exposed_wire) forced to min 9.
  // Example: 7

  dangerLevel: String,
  // One of: 'safe' | 'moderate' | 'critical'

  departmentId: String,
  // One of DEPARTMENT_IDS values
  // Example: 'roads_infrastructure'

  // ── AI CLASSIFICATION (original Gemini output) ────────────────────────
  aiSuggested: {
    issueType:    String,    // Gemini's original suggestion
    category:     String,
    severity:     Number,
    dangerLevel:  String,
    departmentId: String,
    description:  String,
    confidence:   Number,    // 0–100
    aiNotes:      String,    // Gemini's caveats, or null
  },

  // ── CITIZEN INPUT (what citizen confirmed / changed) ──────────────────
  citizenEdited: {
    issueType:    String,    // may differ from aiSuggested
    category:     String,
    severity:     Number,
    dangerLevel:  String,
    departmentId: String,
    // Note: description stored separately below for prompt injection safety
  },

  description: String,
  // Citizen-confirmed description. Max 500 chars. NEVER injected into Gemini prompts.

  citizenDescription: String,
  // Same as description — kept as separate field to make the injection risk explicit.

  // ── LOCATION ──────────────────────────────────────────────────────────
  location: {
    geohash: String,
    // Precision-7 geohash (±76m accuracy). Used for geo-proximity queries.
    // Example: 'tuvz4dg'

    lat: Number,
    // Raw latitude. Example: 22.5204
    // NOTE: Never returned in public reads — only approximate address shown

    lng: Number,
    // Raw longitude. Example: 88.3467
    // NOTE: Never returned in public reads

    ward: String,
    // Ward name. Example: 'Ward 82'

    city: String,
    // City name. Example: 'Kolkata'

    address: String,
    // Nominatim reverse-geocoded address. Example: 'Near Gariahat Market, Ward 82, Kolkata'
  },

  // ── PHOTOS ────────────────────────────────────────────────────────────
  photos: {
    report: String,
    // Firebase Storage public URL of original report photo (EXIF stripped)
    // Example: 'https://storage.googleapis.com/bucket/tickets/KOL.../report/1719068520000.jpg'

    resolution: String | null,
    // Firebase Storage URL of officer's resolution photo. null until resolved.

    reopen: Array<String>,
    // Array of re-report photo URLs (for ghost detection). Empty initially.
  },

  // ── CITIZEN ───────────────────────────────────────────────────────────
  citizenId: String | null,
  // Firebase Auth UID of reporting citizen. null for anonymous reports.

  citizenPhone: String | null,
  // WhatsApp-capable phone number. Example: '+919876543210'
  // NEVER returned in public reads.

  citizenEmail: String | null,
  // Email address for notifications. NEVER returned in public reads.

  // ── OFFICER ASSIGNMENT ────────────────────────────────────────────────
  assignedOfficerId: String | null,
  // Firebase Auth UID of assigned officer. null until assigned.

  assignedOfficerName: String | null,
  // Denormalized officer name for fast public reads without a join.
  // Example: 'Rajesh Kumar'
  // Updated if officer is reassigned.

  // ── SLA ───────────────────────────────────────────────────────────────
  slaDeadline: String,
  // ISO 8601 datetime. Computed at creation as createdAt + department default SLA days.
  // Example: '2026-07-01T14:00:00.000Z'

  slaBreached: Boolean,
  // Set to true by SLA worker when current time > slaDeadline.
  // Default: false

  // ── UPVOTES / ME TOO ──────────────────────────────────────────────────
  upvoteCount: Number,
  // Total upvote count. Denormalized for fast display. Default: 0

  upvoterIds: Array<String>,
  // Array of user UIDs or phone/email hashes (anonymous). Used for deduplication.
  // Example: ['uid_abc', '+919876543210']

  // ── VERIFICATION ──────────────────────────────────────────────────────
  verificationStatus: String,
  // One of VERIFICATION_STATUS values. Default: 'PENDING'

  verifierIds: Array<String>,
  // UIDs of citizens who verified this ticket.

  verifiedBy: String | null,
  // 'PEERS' | 'GEMINI_BACKUP' | null

  // ── GHOST DETECTION ───────────────────────────────────────────────────
  ghostWindowOpen: Boolean,
  // True for 14 days after resolution. Ghost worker monitors during this window.
  // Default: false

  ghostWindowExpiry: String | null,
  // ISO 8601 datetime. Set to resolvedAt + 14 days when ticket resolves.

  ghostCount: Number,
  // Number of times this ticket has been ghost-flagged. Default: 0

  resolvedAt: String | null,
  // ISO 8601 datetime of resolution. null until resolved.

  // ── OVERRIDE ──────────────────────────────────────────────────────────
  overrideCount: Number,
  // Number of override requests on this ticket. Default: 0

  resolutionRetries: Number,
  // Number of times officer tried to resolve and Gemini rejected. Default: 0

  // ── ESCALATION / RTI ──────────────────────────────────────────────────
  reminderSent: Boolean,
  // True after Day-7 reminder sent to officer. Default: false

  escalatedAt: String | null,
  // ISO 8601 datetime of escalation. null until escalated.

  rtiGenerated: Boolean,
  // True after RTI document generated at Day 30. Default: false

  rtiPdfUrl: String | null,
  // Firebase Storage URL of generated RTI PDF. null until generated.

  appealGenerated: Boolean,
  // True after First Appeal generated at Day 60. Default: false

  // ── CITIZEN RATING ────────────────────────────────────────────────────
  citizenRating: Number | null,
  // 1–5 stars. null until citizen rates after resolution.

  citizenRatingNote: String | null,
  // Optional text note with the rating. Max 200 chars.

  // ── INTERNAL (never returned in public reads) ─────────────────────────
  internalNotes: String,
  // Admin's private note to officer on assignment. Firestore rules block public access.

  // ── TIMESTAMPS ────────────────────────────────────────────────────────
  createdAt: String,
  // ISO 8601 creation datetime. Set server-side.

  updatedAt: String,
  // ISO 8601 last update datetime. Updated on every state change.
}
```

**Required fields on creation:**
`publicId`, `status`, `issueType`, `category`, `severity`, `dangerLevel`, `departmentId`, `description`, `location`, `photos.report`, `createdAt`, `updatedAt`

**Fields set to null/defaults on creation:**
`assignedOfficerId: null`, `assignedOfficerName: null`, `photos.resolution: null`, `photos.reopen: []`, `upvoteCount: 0`, `ghostWindowOpen: false`, `ghostCount: 0`, `overrideCount: 0`, `reminderSent: false`, `rtiGenerated: false`, `appealGenerated: false`, `citizenRating: null`, `slaBreached: false`, `resolutionRetries: 0`

---

### 4.2 `ticket_logs`

**Document ID:** Auto-generated by Firestore
**Write:** Server only (Admin SDK, no client write permission)
**Read:** Public

```javascript
{
  ticketId: String,
  // Firestore document ID of the parent ticket (with salt).
  // Example: 'KOL-2026-00142-a3f9c2'

  ticketPublicId: String,
  // Human-readable public ID for easy display.
  // Example: 'KOL-2026-00142'

  actorId: String,
  // Firebase Auth UID of the person or system that made this change.
  // Use 'system' for automated worker actions.
  // Use 'anonymous' for anonymous citizen actions.

  actorRole: String,
  // One of: 'citizen' | 'officer' | 'senior_officer' | 'admin' | 'system'

  action: String,
  // One of LOG_ACTIONS values
  // Example: 'OFFICER_ASSIGNED'

  previousState: String | null,
  // Previous ticket status. null for TICKET_CREATED.

  newState: String | null,
  // New ticket status. null for actions that don't change status (e.g. UPVOTED).

  metadata: Object,
  // Flexible key-value store for action-specific context.
  // Examples:
  //   OFFICER_ASSIGNED:   { officerId: 'uid', officerName: 'Rajesh Kumar', note: '...' }
  //   GHOST_FLAGGED:      { confidence: 78, newTicketId: 'KOL-2026-00155-...' }
  //   OVERRIDE_APPROVED:  { reason: 'Natural resolution', approverId: 'uid' }
  //   UPVOTED:            { upvoteCount: 4 }
  //   RATING_SUBMITTED:   { rating: 4, note: 'Properly fixed' }

  timestamp: String,
  // ISO 8601 datetime. Set server-side, never client-side.
}
```

---

### 4.3 `officers`

**Document ID:** Firebase Auth UID of the officer
**Write:** Admin only
**Read:** Admin and Officer roles

```javascript
{
  // ── IDENTITY ──────────────────────────────────────────────────────────
  id: String,
  // Firebase Auth UID. Same as document ID.

  name: String,
  // Full name. Example: 'Rajesh Kumar'

  employeeId: String,
  // Municipality employee ID. Example: 'KMC-ENG-0042'

  designation: String,
  // One of DESIGNATIONS values. Example: 'Junior Engineer'

  // ── DEPARTMENT & WARDS ────────────────────────────────────────────────
  departmentId: String,
  // One of DEPARTMENT_IDS. Example: 'roads_infrastructure'

  wardIds: Array<String>,
  // Wards this officer is responsible for. Example: ['ward_82', 'ward_83']

  // ── CONTACT ───────────────────────────────────────────────────────────
  email: String,
  // Login email. Example: 'rajesh.kumar@kmc.gov.in'

  phone: String | null,
  // Optional phone number. Example: '+919876543210'

  // ── STATUS ────────────────────────────────────────────────────────────
  status: String,
  // One of: 'active' | 'on_leave' | 'deactivated'
  // Deactivated officers are excluded from assignment dropdown.

  role: String,
  // One of: 'officer' | 'senior_officer'
  // Mirrors Firebase custom claim.

  // ── PERFORMANCE METRICS (denormalized, maintained by server) ──────────
  activeCaseCount: Number,
  // Current number of assigned, non-resolved tickets.
  // Incremented on ASSIGNED, decremented on RESOLVED or CLOSED_OVERRIDE.

  totalAssigned: Number,
  // Lifetime total tickets assigned.

  resolvedCount: Number,
  // Lifetime total tickets resolved.

  resolutionRate: Number,
  // Float 0–100. Computed: (resolvedCount / totalAssigned) * 100
  // Recalculated on each resolution.

  avgResolutionDays: Number,
  // Rolling average of days taken to resolve. Updated on each resolution.

  ghostClosureCount: Number,
  // Total number of ghost detections attributed to this officer.

  overrideCount: Number,
  // Total number of manual overrides used by this officer.

  slaBreachCount: Number,
  // Total tickets where SLA was breached under this officer.

  accountabilityScore: Number,
  // 0–100. Composite score. Starts at 80. Adjusted by:
  // +5 per on-time resolution
  // -2 per override used
  // -5 per SLA breach
  // -10 per ghost closure (-20 if override was used on that ticket)
  // Capped at 0 minimum, 100 maximum.

  citizenRatingAvg: Number,
  // Average citizen rating (1–5) across all resolved tickets.

  citizenRatingCount: Number,
  // Total number of citizen ratings received.

  // ── ADMIN NOTES ───────────────────────────────────────────────────────
  adminNotes: String,
  // Private admin-only notes. Not returned in officer reads.

  // ── TIMESTAMPS ────────────────────────────────────────────────────────
  createdAt: String,
  // ISO 8601 datetime when account was created by admin.

  createdBy: String,
  // UID of admin who created this account.

  lastActiveAt: String | null,
  // ISO 8601 datetime of last ticket action.
}
```

---

### 4.4 `departments`

**Document ID:** Department slug (e.g. `roads_infrastructure`)
**Write:** Admin only
**Read:** Officer, Admin

```javascript
{
  id: String,
  // Same as document ID. One of DEPARTMENT_IDS.

  name: String,
  // Display name. Example: 'Roads & Infrastructure'

  shortName: String,
  // Abbreviated name for tight UI spaces. Example: 'Roads'

  defaultSlaDays: Number,
  // Default SLA for this department in days.
  // Values: Electricity: 3, Water: 5, Sanitation: 5, Roads: 7, Parks: 10

  headOfficerId: String | null,
  // Firebase Auth UID of the head officer (Senior Officer role).

  headOfficerName: String | null,
  // Denormalized name for fast display without join.

  wardIds: Array<String>,
  // Wards this department is responsible for.

  issueTypes: Array<String>,
  // Issue types routed to this department (from ISSUE_TYPES).
  // Example: ['pothole', 'damaged_road', 'broken_footpath', 'broken_signal']

  officerCount: Number,
  // Denormalized count of active officers in this department.

  color: String,
  // Hex color for UI display. Example: '#1A73E8'

  icon: String,
  // Emoji icon for UI. Example: '🛣️'

  createdAt: String,
  updatedAt: String,
}
```

---

### 4.5 `users`

**Document ID:** Firebase Auth UID
**Write:** Citizen (own), Server
**Read:** Citizen (own), Admin

```javascript
{
  uid: String,
  // Firebase Auth UID.

  displayName: String | null,
  // Name from Google Sign-In or user-set. null for anonymous.

  email: String | null,
  // Email from Google Sign-In or user-set.

  phone: String | null,
  // WhatsApp-capable phone number. Optional.

  ward: String | null,
  // Home ward. User-set during onboarding. Example: 'Ward 82'

  city: String | null,
  // City. Example: 'Kolkata'

  language: String,
  // Preferred language. One of: 'en' | 'hi' | 'bn'
  // Default: 'en'

  fcmToken: String | null,
  // Firebase Cloud Messaging device token for push notifications.
  // Updated on each app load.

  notificationPrefs: {
    statusChange:      Boolean,  // default: true
    verified:          Boolean,  // default: true
    assigned:          Boolean,  // default: true
    resolved:          Boolean,  // default: true
    nearbyCritical:    Boolean,  // default: true
    weeklyChallenge:   Boolean,  // default: true
    nearbyPredictions: Boolean,  // default: false
  },

  isAnonymous: Boolean,
  // true for anonymous submissions (no Google Sign-In)

  createdAt: String,
  lastSeenAt: String,
}
```

---

### 4.6 `gamification`

**Document ID:** Citizen Firebase Auth UID
**Write:** Server (for XP/badge awards), Citizen (for notification prefs)
**Read:** Public (leaderboard), Citizen (own full profile)

```javascript
{
  uid: String,
  // Firebase Auth UID.

  displayName: String,
  // Cached from users collection for leaderboard display.

  ward: String,
  // Cached from users collection for ward leaderboard filtering.

  // ── XP & LEVEL ────────────────────────────────────────────────────────
  xp: Number,
  // Total XP earned. Default: 0

  level: String,
  // Computed from xp using LEVELS array.
  // Example: 'Active Resident'

  // ── BADGES ────────────────────────────────────────────────────────────
  badges: Array<String>,
  // Array of earned badge IDs. Example: ['pothole_hunter', 'first_responder']

  // ── STREAKS ───────────────────────────────────────────────────────────
  streakDays: Number,
  // Current consecutive days active. Resets if no activity for >24 hours.

  longestStreak: Number,
  // Lifetime longest streak.

  lastActiveDate: String,
  // ISO 8601 date (not datetime) of last activity. Example: '2026-06-24'

  // ── COUNTERS (for badge progress tracking) ────────────────────────────
  totalReports: Number,
  // Total issues reported by this citizen.

  resolvedReports: Number,
  // Total of citizen's reports that got resolved.

  ghostCatches: Number,
  // Total ghost issues this citizen detected and re-reported.

  rtiFiled: Number,
  // Total RTIs generated (1 = first RTI earned badge).

  verificationsDone: Number,
  // Total peer verifications this citizen has completed.

  upvotesDone: Number,
  // Total upvotes/Me Too clicks.

  wardsReportedIn: Array<String>,
  // Distinct wards where this citizen has reported issues. For Explorer badge.

  criticalIssuesReported: Number,
  // Count of danger_level='critical' issues reported. For Safety Sentinel badge.

  potholeCount: Number,
  // For Pothole Hunter badge.

  streetlightCount: Number,
  // For Light Keeper badge.

  waterlLoggingCount: Number,
  // For Monsoon Watch badge.

  // ── WEEKLY / MONTHLY CHALLENGE ────────────────────────────────────────
  currentChallenge: {
    id: String,
    // Example: 'monsoon_waterlogging_june_w4'

    description: String,
    // Example: 'Report 2 waterlogging issues this week'

    target: Number,
    // Example: 2

    progress: Number,
    // Example: 1

    expiresAt: String,
    // ISO 8601 end of challenge period.

    completed: Boolean,
  } | null,

  // ── LEADERBOARD SNAPSHOTS (updated weekly) ────────────────────────────
  weeklyXP: Number,
  // XP earned this week. Reset every Monday at midnight.

  monthlyXP: Number,
  // XP earned this month. Reset on 1st of each month.

  weeklyRankWard: Number | null,
  // Cached rank within own ward this week.

  monthlyRankWard: Number | null,
  // Cached rank within own ward this month.

  createdAt: String,
  updatedAt: String,
}
```

---

### 4.7 `predictions`

**Document ID:** Auto-generated by Firestore
**Write:** Server (Predict Worker) only
**Read:** Public

```javascript
{
  // ── LOCATION ──────────────────────────────────────────────────────────
  zoneGeohash: String,
  // Precision-6 geohash of the predicted problem zone (~610m accuracy).

  ward: String,
  // Ward name. Example: 'Ward 82'

  city: String,
  // Example: 'Kolkata'

  approximateLocation: String,
  // Human-readable zone description. Example: 'Near Gariahat Flyover, Ward 82'

  lat: Number,
  // Approximate center latitude of the predicted zone.

  lng: Number,
  // Approximate center longitude of the predicted zone.

  // ── PREDICTION ────────────────────────────────────────────────────────
  issueType: String,
  // One of ISSUE_TYPES values.

  category: String,
  // One of CATEGORIES values.

  probability: Number,
  // 0–100 integer. Gemini's estimated probability.

  reason: String,
  // Gemini's explanation. Example: 'Road last repaired 2019, monsoon incoming,
  // 12 reports at this location last July.'

  recommendedAction: String,
  // Gemini's preemptive recommendation.
  // Example: 'Inspect and pre-patch road section before monsoon onset.'

  season: String,
  // Season when prediction was made. Example: 'monsoon'

  // ── LIFECYCLE ─────────────────────────────────────────────────────────
  generatedAt: String,
  // ISO 8601 datetime when prediction was created by worker.

  expiresAt: String,
  // ISO 8601 datetime. Predictions expire after 30 days.

  convertedToTicket: Boolean,
  // true if admin converted this prediction to a proactive work order ticket.
  // Default: false

  convertedTicketId: String | null,
  // Public ticket ID if convertedToTicket is true.

  cameTrue: Boolean | null,
  // Set by ghost worker if a real ticket appeared at this location within expiry.
  // null = still open, true = prediction was correct, false = expired without issue.

  // ── ACCURACY TRACKING ─────────────────────────────────────────────────
  actualTicketId: String | null,
  // If cameTrue = true, the public ID of the ticket that matched this prediction.

  createdAt: String,
}
```

---

### 4.8 `queries`

**Document ID:** Auto-generated by Firestore
**Write:** Anyone (create), Officer/Admin (update with reply)
**Read:** Assigned officer, Admin

```javascript
{
  ticketId: String,
  // Firestore document ID of the parent ticket.

  ticketPublicId: String,
  // Human-readable public ID. Example: 'KOL-2026-00142'

  assignedOfficerId: String,
  // UID of the officer responsible for replying.

  // ── QUESTION ──────────────────────────────────────────────────────────
  question: String,
  // Citizen's question text. Max 300 chars.

  askedBy: String | null,
  // Citizen UID or null for anonymous.

  askedAt: String,
  // ISO 8601 datetime.

  // ── AI BOT RESPONSE ───────────────────────────────────────────────────
  botAnswer: String | null,
  // Gemini's automated response. Shown immediately.

  botAnsweredAt: String | null,
  // ISO 8601 datetime of bot response.

  // ── OFFICER REPLY ─────────────────────────────────────────────────────
  officerReply: String | null,
  // Human officer reply. Visible to citizen on ticket page.

  repliedBy: String | null,
  // Officer UID who replied.

  repliedAt: String | null,
  // ISO 8601 datetime of officer reply.

  // ── STATUS ────────────────────────────────────────────────────────────
  status: String,
  // One of: 'PENDING' | 'BOT_REPLIED' | 'OFFICER_REPLIED' | 'OVERDUE'
  // OVERDUE set by SLA worker after 48 hours with no officer reply.

  overdueAt: String | null,
  // ISO 8601 datetime when query became overdue (askedAt + 48 hours).

  createdAt: String,
}
```

---

### 4.9 `ward_reports`

**Document ID:** `{ward_slug}_{year}_{month}` e.g. `ward_82_2026_06`
**Write:** Server (Ward Report Generator) only
**Read:** Officer, Admin

```javascript
{
  ward: String,
  // Ward name. Example: 'Ward 82'

  city: String,

  year: Number,
  month: Number,
  // 1–12

  period: String,
  // Human-readable. Example: 'June 2026'

  // ── STATS ─────────────────────────────────────────────────────────────
  totalReports: Number,
  totalResolved: Number,
  totalPending: Number,
  totalEscalated: Number,
  totalSlaBreaches: Number,
  totalGhostFlags: Number,
  totalOverrides: Number,
  resolutionRate: Number,            // Float 0–100
  avgResolutionDays: Number,

  // ── CATEGORY BREAKDOWN ────────────────────────────────────────────────
  categoryBreakdown: {
    Infrastructure:    Number,
    Water_Drainage:    Number,
    Sanitation:        Number,
    Electricity:       Number,
    Public_Safety:     Number,
    Environment:       Number,
    Public_Facilities: Number,
  },

  // ── TOP PROBLEM ZONES ─────────────────────────────────────────────────
  topProblemZones: Array<{
    location: String,
    issueCount: Number,
    topIssueType: String,
  }>,

  // ── OFFICER PERFORMANCE ───────────────────────────────────────────────
  topOfficers: Array<{
    officerId: String,
    officerName: String,
    resolved: Number,
    resolutionRate: Number,
    avgDays: Number,
  }>,

  // ── AI NARRATIVE ──────────────────────────────────────────────────────
  aiNarrative: String,
  // Gemini-generated paragraph summarizing the ward's performance.

  // ── PDF ───────────────────────────────────────────────────────────────
  pdfUrl: String | null,
  // Firebase Storage URL of the generated PDF report.

  generatedAt: String,
  generatedBy: String,
  // UID of admin who triggered the report, or 'system' for auto-generated.
}
```

---

### 4.10 `overrides`

**Document ID:** Auto-generated by Firestore
**Write:** Server only
**Read:** Admin, Senior Officer

```javascript
{
  ticketId: String,
  // Firestore document ID of the ticket.

  ticketPublicId: String,

  // ── REQUEST ───────────────────────────────────────────────────────────
  requestedBy: String,
  // Officer UID who requested the override.

  requestedByName: String,
  // Denormalized officer name.

  requestedAt: String,
  // ISO 8601 datetime.

  overrideType: String,
  // One of:
  // 'FALSE_REPORT'         — issue does not exist
  // 'RESOLVED_BY_OTHER'    — resolved by another department
  // 'NATURAL_RESOLUTION'   — resolved without intervention
  // 'EMERGENCY_FAST_CLOSE' — senior officer fast-close
  // 'CITIZEN_DISPUTE'      — citizen disputed resolution

  reason: String,
  // Officer's written explanation. Minimum 20 chars.

  referenceTicketId: String | null,
  // If overrideType = 'RESOLVED_BY_OTHER', the ID of the ticket that resolved it.

  // ── APPROVAL ──────────────────────────────────────────────────────────
  status: String,
  // One of: 'PENDING' | 'APPROVED' | 'REJECTED'

  reviewedBy: String | null,
  // UID of senior officer or admin who approved/rejected.

  reviewedByName: String | null,
  // Denormalized name.

  reviewedAt: String | null,
  // ISO 8601 datetime.

  reviewNote: String | null,
  // Optional note from reviewer.

  // ── IMPACT ────────────────────────────────────────────────────────────
  penaltyApplied: Number,
  // Accountability score deduction applied: -2 per override.

  createdAt: String,
}
```

---

### 4.11 `counters`

**Document ID:** City slug e.g. `kolkata`
**Write:** Server only (atomic transaction)
**Read:** Server only

```javascript
{
  city: String,
  // Example: 'kolkata'

  count: Number,
  // Current sequence counter. Incremented atomically for each new ticket.
  // Never reset.
  // Example: 142 (next ticket will be 00143)
}
```

---

### 4.12 `ward_stats`

**Document ID:** Ward slug e.g. `ward_82`
**Write:** Server (background worker, updated nightly)
**Read:** Public

```javascript
{
  ward: String,
  // Example: 'Ward 82'

  city: String,

  // ── CURRENT MONTH STATS ───────────────────────────────────────────────
  totalThisMonth: Number,
  resolvedThisMonth: Number,
  pendingThisMonth: Number,
  resolutionRateThisMonth: Number,   // Float 0–100

  // ── CIVIC HEALTH SCORE ────────────────────────────────────────────────
  civicScore: String,
  // Letter grade. One of: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  // Computed from resolutionRate + avgResolutionDays + slaBreachRate

  civicScoreNumeric: Number,
  // 0–100 numeric version of civicScore for trend comparison.

  previousMonthScore: String,
  // Previous month's grade for trend arrow (up/down/same).

  // ── TREND ─────────────────────────────────────────────────────────────
  trend: String,
  // One of: 'improving' | 'stable' | 'declining'

  // ── CATEGORY HOTSPOTS ─────────────────────────────────────────────────
  topIssueType: String,
  // Most common issue type this month.

  topIssueCount: Number,

  // ── TIMESTAMPS ────────────────────────────────────────────────────────
  lastUpdated: String,
  // ISO 8601 datetime of last worker update.

  month: Number,
  year: Number,
}
```

---

### 4.13 `verifications`

**Document ID:** Same as the ticket's Firestore document ID
**Write:** Server only
**Read:** Server only, Admin

```javascript
{
  ticketId: String,
  // Firestore document ID of the ticket.

  ticketPublicId: String,

  // ── VERIFIER ASSIGNMENTS ──────────────────────────────────────────────
  assignedVerifiers: Array<String>,
  // UIDs of 3 nearby active citizens sent the verification request.

  // ── VOTES ─────────────────────────────────────────────────────────────
  votes: Array<{
    verifierId: String,
    vote: String,           // 'real' | 'fake' | 'unsure'
    votedAt: String,
  }>,

  realCount: Number,         // votes for 'real'
  fakeCount: Number,         // votes for 'fake'

  // ── RESULT ────────────────────────────────────────────────────────────
  result: String | null,
  // 'VERIFIED' | 'REJECTED' | 'GEMINI_BACKUP' | null (still pending)

  geminiUsed: Boolean,
  // true if Gemini was used as backup verifier

  geminiResult: Object | null,
  // Raw Gemini response if geminiUsed is true

  // ── TIMEOUT ───────────────────────────────────────────────────────────
  createdAt: String,
  timeoutAt: String,
  // ISO 8601 datetime. createdAt + 2 hours. After this, Gemini takes over.
}
```

---

## 5. Seed Data — Departments

Create these 5 documents in the `departments` collection before anything else. These are required for officer assignment and ticket routing.

**`backend/seed/departments.js`**

```javascript
const departments = [
  {
    id: 'roads_infrastructure',
    name: 'Roads & Infrastructure',
    shortName: 'Roads',
    defaultSlaDays: 7,
    headOfficerId: null,       // set after creating officers
    headOfficerName: null,
    wardIds: ['ward_82', 'ward_83', 'ward_84', 'ward_85'],
    issueTypes: ['pothole', 'damaged_road', 'broken_footpath', 'broken_signal', 'fallen_tree'],
    officerCount: 0,
    color: '#EA4335',
    icon: '🛣️',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'water_supply',
    name: 'Water Supply & Drainage',
    shortName: 'Water',
    defaultSlaDays: 5,
    headOfficerId: null,
    headOfficerName: null,
    wardIds: ['ward_82', 'ward_83', 'ward_84', 'ward_85', 'ward_86'],
    issueTypes: ['water_leakage', 'waterlogging', 'sewage_overflow', 'open_manhole'],
    officerCount: 0,
    color: '#1A73E8',
    icon: '💧',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sanitation',
    name: 'Sanitation & Waste Management',
    shortName: 'Sanitation',
    defaultSlaDays: 5,
    headOfficerId: null,
    headOfficerName: null,
    wardIds: ['ward_82', 'ward_83', 'ward_84'],
    issueTypes: ['garbage', 'illegal_dumping'],
    officerCount: 0,
    color: '#34A853',
    icon: '🗑️',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'electricity',
    name: 'Electricity & Street Lighting',
    shortName: 'Electricity',
    defaultSlaDays: 3,
    headOfficerId: null,
    headOfficerName: null,
    wardIds: ['ward_82', 'ward_83'],
    issueTypes: ['broken_light', 'exposed_wire'],
    officerCount: 0,
    color: '#FBBC04',
    icon: '⚡',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'parks_recreation',
    name: 'Parks & Public Facilities',
    shortName: 'Parks',
    defaultSlaDays: 10,
    headOfficerId: null,
    headOfficerName: null,
    wardIds: ['ward_82', 'ward_84'],
    issueTypes: ['broken_park_equipment', 'other'],
    officerCount: 0,
    color: '#0F9D58',
    icon: '🌳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

module.exports = departments;
```

---

## 6. Seed Data — Officers

**Important:** Create the Firebase Auth users FIRST, then write the Firestore documents using the Auth UID as the document ID. Use the seed script in Section 13 to do both atomically.

**`backend/seed/officers.js`**

```javascript
// NOTE: passwords are for demo only — officers will reset via email link in production
const officers = [
  {
    // ── Roads & Infrastructure — Ward 82, 83 ──
    email: 'rajesh.kumar@kmc.gov.in',
    password: 'Demo@1234',              // temp password, reset on first login
    profile: {
      name: 'Rajesh Kumar',
      employeeId: 'KMC-ENG-0042',
      designation: 'Junior Engineer',
      departmentId: 'roads_infrastructure',
      wardIds: ['ward_82', 'ward_83'],
      phone: '+919831001001',
      status: 'active',
      role: 'officer',
      activeCaseCount: 0,
      totalAssigned: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      ghostClosureCount: 0,
      overrideCount: 0,
      slaBreachCount: 0,
      accountabilityScore: 80,
      citizenRatingAvg: 0,
      citizenRatingCount: 0,
      adminNotes: '',
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    },
    customClaims: { officer: true },
  },
  {
    // ── Sanitation — Ward 82 (Senior Officer) ──
    email: 'priya.sharma@kmc.gov.in',
    password: 'Demo@1234',
    profile: {
      name: 'Priya Sharma',
      employeeId: 'KMC-INS-0019',
      designation: 'Senior Inspector',
      departmentId: 'sanitation',
      wardIds: ['ward_82'],
      phone: '+919831002002',
      status: 'active',
      role: 'senior_officer',
      activeCaseCount: 0,
      totalAssigned: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      ghostClosureCount: 0,
      overrideCount: 0,
      slaBreachCount: 0,
      accountabilityScore: 80,
      citizenRatingAvg: 0,
      citizenRatingCount: 0,
      adminNotes: 'Head of Sanitation, Ward 82',
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    },
    customClaims: { senior_officer: true },
  },
  {
    // ── Roads & Infrastructure — Ward 84 ──
    email: 'amit.das@kmc.gov.in',
    password: 'Demo@1234',
    profile: {
      name: 'Amit Das',
      employeeId: 'KMC-ENG-0057',
      designation: 'Junior Engineer',
      departmentId: 'roads_infrastructure',
      wardIds: ['ward_84'],
      phone: '+919831003003',
      status: 'active',
      role: 'officer',
      activeCaseCount: 0,
      totalAssigned: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      ghostClosureCount: 0,
      overrideCount: 0,
      slaBreachCount: 0,
      accountabilityScore: 80,
      citizenRatingAvg: 0,
      citizenRatingCount: 0,
      adminNotes: '',
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    },
    customClaims: { officer: true },
  },
  {
    // ── Water Supply — Ward 83, 85 (Senior Officer) ──
    email: 'suresh.mehta@kmc.gov.in',
    password: 'Demo@1234',
    profile: {
      name: 'Suresh Mehta',
      employeeId: 'KMC-ENG-0031',
      designation: 'Senior Engineer',
      departmentId: 'water_supply',
      wardIds: ['ward_83', 'ward_85'],
      phone: '+919831004004',
      status: 'active',
      role: 'senior_officer',
      activeCaseCount: 0,
      totalAssigned: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      ghostClosureCount: 0,
      overrideCount: 0,
      slaBreachCount: 0,
      accountabilityScore: 80,
      citizenRatingAvg: 0,
      citizenRatingCount: 0,
      adminNotes: 'Senior Water Supply Engineer',
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    },
    customClaims: { senior_officer: true },
  },
  {
    // ── Electricity — Ward 82 (On Leave for demo) ──
    email: 'deepa.nair@kmc.gov.in',
    password: 'Demo@1234',
    profile: {
      name: 'Deepa Nair',
      employeeId: 'KMC-ELE-0008',
      designation: 'Junior Inspector',
      departmentId: 'electricity',
      wardIds: ['ward_82'],
      phone: '+919831005005',
      status: 'on_leave',             // demonstrates on_leave status in UI
      role: 'officer',
      activeCaseCount: 0,
      totalAssigned: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      ghostClosureCount: 0,
      overrideCount: 0,
      slaBreachCount: 0,
      accountabilityScore: 80,
      citizenRatingAvg: 0,
      citizenRatingCount: 0,
      adminNotes: 'On medical leave until 5 July 2026',
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    },
    customClaims: { officer: true },
  },
];

module.exports = officers;
```

---

## 7. Seed Data — Admin User

```javascript
// backend/seed/admin.js
const admin = {
  email: 'admin@communityHero.app',
  password: 'Admin@Demo2026',         // change before sharing publicly
  displayName: 'City Administrator',
  customClaims: { admin: true },
};

module.exports = admin;
```

---

## 8. Seed Data — Sample Tickets

These 8 demo tickets cover all major status states for judge demos.

**`backend/seed/tickets.js`**

```javascript
// Uses FAKE image URLs from Section 14
const { FAKE_IMAGES } = require('./fakeImages');

const sampleTickets = [

  // ─── TICKET 1: UNASSIGNED (Critical — Open Manhole) ──────────────────
  {
    docId:    'KOL-2026-00149-x7k2p1',
    publicId: 'KOL-2026-00149',
    status:   'UNASSIGNED',
    issueType: 'open_manhole',
    category:  'Public_Safety',
    severity:   9,
    dangerLevel: 'critical',
    departmentId: 'water_supply',
    description: 'Open manhole with no cover near Lake Market entrance. Extremely dangerous, especially at night.',
    citizenDescription: 'Open manhole with no cover near Lake Market entrance. Extremely dangerous, especially at night.',
    aiSuggested: {
      issueType: 'open_manhole', category: 'Public_Safety',
      severity: 9, dangerLevel: 'critical',
      departmentId: 'water_supply',
      description: 'Open manhole detected near market area',
      confidence: 92, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'open_manhole', category: 'Public_Safety',
      severity: 9, dangerLevel: 'critical', departmentId: 'water_supply',
    },
    location: {
      geohash: 'tuvz4df',
      lat: 22.5178, lng: 88.3590,
      ward: 'Ward 82', city: 'Kolkata',
      address: 'Near Lake Market, Ward 82, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.open_manhole,
      resolution: null,
      reopen: [],
    },
    citizenId: null,
    citizenPhone: '+919800000001',
    citizenEmail: null,
    assignedOfficerId: null,
    assignedOfficerName: null,
    slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    upvoteCount: 7,
    upvoterIds: ['demo_uid_1', 'demo_uid_2', 'demo_uid_3', 'demo_uid_4', 'demo_uid_5', 'demo_uid_6', 'demo_uid_7'],
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_1', 'demo_uid_2', 'demo_uid_3'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: '',
    reminderSent: false,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 2: IN_PROGRESS (Pothole — Rajesh Kumar) ──────────────────
  {
    docId:    'KOL-2026-00142-a3f9c2',
    publicId: 'KOL-2026-00142',
    status:   'IN_PROGRESS',
    issueType: 'pothole',
    category:  'Infrastructure',
    severity:   7,
    dangerLevel: 'moderate',
    departmentId: 'roads_infrastructure',
    description: 'Large pothole near Gariahat flyover entrance causing vehicle damage. Approx 2 feet wide.',
    citizenDescription: 'Large pothole near Gariahat flyover entrance causing vehicle damage. Approx 2 feet wide.',
    aiSuggested: {
      issueType: 'pothole', category: 'Infrastructure',
      severity: 7, dangerLevel: 'moderate',
      departmentId: 'roads_infrastructure',
      description: 'Deep pothole detected on road surface near flyover',
      confidence: 89, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'pothole', category: 'Infrastructure',
      severity: 7, dangerLevel: 'moderate', departmentId: 'roads_infrastructure',
    },
    location: {
      geohash: 'tuvz4dg',
      lat: 22.5204, lng: 88.3467,
      ward: 'Ward 82', city: 'Kolkata',
      address: 'Near Gariahat Flyover, Ward 82, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.pothole,
      resolution: null,
      reopen: [],
    },
    citizenId: 'demo_citizen_uid_arjun',
    citizenPhone: '+919800000002',
    citizenEmail: 'arjun.m@example.com',
    assignedOfficerId: null,           // set after officers are seeded
    assignedOfficerName: 'Rajesh Kumar',
    slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    upvoteCount: 3,
    upvoterIds: ['demo_uid_4', 'demo_uid_5', 'demo_uid_6'],
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_7', 'demo_uid_8', 'demo_uid_9'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: 'High traffic zone. Check for contract repair eligibility.',
    reminderSent: false,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 3: RESOLVED (Broken Streetlight — with ghost window open) ─
  {
    docId:    'KOL-2026-00138-b8m4n3',
    publicId: 'KOL-2026-00138',
    status:   'RESOLVED',
    issueType: 'broken_light',
    category:  'Electricity',
    severity:   5,
    dangerLevel: 'moderate',
    departmentId: 'electricity',
    description: 'Streetlight on main road near Ward 83 playground has been off for 3 days.',
    citizenDescription: 'Streetlight on main road near Ward 83 playground has been off for 3 days.',
    aiSuggested: {
      issueType: 'broken_light', category: 'Electricity',
      severity: 5, dangerLevel: 'moderate',
      departmentId: 'electricity',
      description: 'Non-functional streetlight detected',
      confidence: 95, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'broken_light', category: 'Electricity',
      severity: 5, dangerLevel: 'moderate', departmentId: 'electricity',
    },
    location: {
      geohash: 'tuvz4m2',
      lat: 22.5231, lng: 88.3512,
      ward: 'Ward 83', city: 'Kolkata',
      address: 'Near Ward 83 Playground, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.broken_light,
      resolution: FAKE_IMAGES.broken_light_resolved,
      reopen: [],
    },
    citizenId: 'demo_citizen_uid_arjun',
    citizenPhone: '+919800000002',
    citizenEmail: 'arjun.m@example.com',
    assignedOfficerName: 'Deepa Nair',
    slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    upvoteCount: 1,
    upvoterIds: ['demo_uid_3'],
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_1', 'demo_uid_2'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: true,
    ghostWindowExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: '',
    reminderSent: false,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    citizenRating: null,   // not yet rated — triggers rating prompt in UI
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 4: GHOST_FLAGGED (demonstrates ghost detection feature) ───
  {
    docId:    'KOL-2026-00133-c2p5q8',
    publicId: 'KOL-2026-00133',
    status:   'GHOST_FLAGGED',
    issueType: 'garbage',
    category:  'Sanitation',
    severity:   6,
    dangerLevel: 'moderate',
    departmentId: 'sanitation',
    description: 'Garbage dump near Rashbehari crossing not cleared for a week.',
    citizenDescription: 'Garbage dump near Rashbehari crossing not cleared for a week.',
    aiSuggested: {
      issueType: 'garbage', category: 'Sanitation',
      severity: 6, dangerLevel: 'moderate',
      departmentId: 'sanitation',
      description: 'Large garbage accumulation detected',
      confidence: 88, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'garbage', category: 'Sanitation',
      severity: 6, dangerLevel: 'moderate', departmentId: 'sanitation',
    },
    location: {
      geohash: 'tuvz3xr',
      lat: 22.5145, lng: 88.3421,
      ward: 'Ward 82', city: 'Kolkata',
      address: 'Near Rashbehari Crossing, Ward 82, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.garbage,
      resolution: FAKE_IMAGES.garbage_fake_resolved,    // the "fake" resolution photo
      reopen: [FAKE_IMAGES.garbage_reopen],             // citizen's re-report
    },
    citizenId: 'demo_citizen_uid_priya',
    citizenPhone: '+919800000003',
    citizenEmail: null,
    assignedOfficerName: 'Priya Sharma',
    slaDeadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: true,
    upvoteCount: 5,
    upvoterIds: ['demo_uid_1', 'demo_uid_2', 'demo_uid_3', 'demo_uid_4', 'demo_uid_5'],
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_6', 'demo_uid_7'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: true,
    ghostWindowExpiry: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    ghostCount: 1,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: 'Ghost detected — Gemini confidence 78%. Officer notified.',
    reminderSent: true,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 5: ESCALATED (demonstrates SLA escalation) ───────────────
  {
    docId:    'KOL-2026-00128-d9r1s6',
    publicId: 'KOL-2026-00128',
    status:   'ESCALATED',
    issueType: 'waterlogging',
    category:  'Water_Drainage',
    severity:   8,
    dangerLevel: 'critical',
    departmentId: 'water_supply',
    description: 'Severe waterlogging on main road blocking vehicle movement. 2 feet deep water.',
    citizenDescription: 'Severe waterlogging on main road blocking vehicle movement. 2 feet deep water.',
    aiSuggested: {
      issueType: 'waterlogging', category: 'Water_Drainage',
      severity: 8, dangerLevel: 'critical',
      departmentId: 'water_supply',
      description: 'Severe waterlogging detected on road',
      confidence: 91, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'waterlogging', category: 'Water_Drainage',
      severity: 8, dangerLevel: 'critical', departmentId: 'water_supply',
    },
    location: {
      geohash: 'tuvz5bc',
      lat: 22.5315, lng: 88.3598,
      ward: 'Ward 83', city: 'Kolkata',
      address: 'Lake Kalibagan Road, Ward 83, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.waterlogging,
      resolution: null,
      reopen: [],
    },
    citizenId: 'demo_citizen_uid_riya',
    citizenPhone: '+919800000004',
    citizenEmail: 'riya.d@example.com',
    assignedOfficerName: 'Suresh Mehta',
    slaDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: true,
    upvoteCount: 12,
    upvoterIds: Array.from({length:12}, (_,i) => `demo_uid_${i+1}`),
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_1', 'demo_uid_2', 'demo_uid_3'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: 'Escalated on Day 14. Assigned to Suresh Mehta (Senior). Drain blockage suspected.',
    reminderSent: true,
    escalatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 6: RTI_FILED (demonstrates 30-day RTI auto-draft) ─────────
  {
    docId:    'KOL-2026-00101-e4t7u2',
    publicId: 'KOL-2026-00101',
    status:   'RTI_FILED',
    issueType: 'sewage_overflow',
    category:  'Water_Drainage',
    severity:   8,
    dangerLevel: 'critical',
    departmentId: 'water_supply',
    description: 'Sewage overflowing onto the street near residential area for over a month.',
    citizenDescription: 'Sewage overflowing onto the street near residential area for over a month.',
    aiSuggested: {
      issueType: 'sewage_overflow', category: 'Water_Drainage',
      severity: 8, dangerLevel: 'critical',
      departmentId: 'water_supply',
      description: 'Sewage overflow on residential street',
      confidence: 87, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'sewage_overflow', category: 'Water_Drainage',
      severity: 8, dangerLevel: 'critical', departmentId: 'water_supply',
    },
    location: {
      geohash: 'tuvz2mk',
      lat: 22.5089, lng: 88.3344,
      ward: 'Ward 84', city: 'Kolkata',
      address: 'Near Tollygunge Metro, Ward 84, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.sewage,
      resolution: null,
      reopen: [],
    },
    citizenId: 'demo_citizen_uid_soumya',
    citizenPhone: '+919800000005',
    citizenEmail: 'soumya.b@example.com',
    assignedOfficerName: 'Suresh Mehta',
    slaDeadline: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: true,
    upvoteCount: 18,
    upvoterIds: Array.from({length:18}, (_,i) => `demo_uid_${i+1}`),
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_1', 'demo_uid_2', 'demo_uid_3'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: 'RTI generated on Day 32. Officer repeatedly unresponsive.',
    reminderSent: true,
    escalatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    rtiGenerated: true,
    rtiPdfUrl: 'https://storage.googleapis.com/community-hero-demo/reports/rti_KOL-2026-00101.pdf',
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 7: CLOSED_OVERRIDE (demonstrates override feature) ─────────
  {
    docId:    'KOL-2026-00115-f6v9w4',
    publicId: 'KOL-2026-00115',
    status:   'CLOSED_OVERRIDE',
    issueType: 'waterlogging',
    category:  'Water_Drainage',
    severity:   4,
    dangerLevel: 'safe',
    departmentId: 'water_supply',
    description: 'Waterlogging after rain near Jadavpur, cleared by next morning.',
    citizenDescription: 'Waterlogging after rain near Jadavpur, cleared by next morning.',
    aiSuggested: {
      issueType: 'waterlogging', category: 'Water_Drainage',
      severity: 4, dangerLevel: 'safe',
      departmentId: 'water_supply',
      description: 'Minor waterlogging after rainfall',
      confidence: 82, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'waterlogging', category: 'Water_Drainage',
      severity: 4, dangerLevel: 'safe', departmentId: 'water_supply',
    },
    location: {
      geohash: 'tuvz1np',
      lat: 22.4992, lng: 88.3702,
      ward: 'Ward 85', city: 'Kolkata',
      address: 'Near Jadavpur 8B Bus Stand, Ward 85, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.waterlogging_minor,
      resolution: null,
      reopen: [],
    },
    citizenId: null,
    citizenPhone: '+919800000006',
    citizenEmail: null,
    assignedOfficerName: 'Suresh Mehta',
    slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    upvoteCount: 0,
    upvoterIds: [],
    verificationStatus: 'GEMINI',
    verifierIds: [],
    verifiedBy: 'GEMINI_BACKUP',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 1,
    resolutionRetries: 0,
    internalNotes: 'Natural resolution — rain water drained overnight.',
    reminderSent: false,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ─── TICKET 8: ASSIGNED with VERIFIED (full pipeline demo) ────────────
  {
    docId:    'KOL-2026-00145-g3h8j5',
    publicId: 'KOL-2026-00145',
    status:   'ASSIGNED',
    issueType: 'water_leakage',
    category:  'Water_Drainage',
    severity:   6,
    dangerLevel: 'moderate',
    departmentId: 'water_supply',
    description: 'Water pipe leaking continuously near Bosepukur crossing, wasting water and causing slippery road.',
    citizenDescription: 'Water pipe leaking continuously near Bosepukur crossing, wasting water and causing slippery road.',
    aiSuggested: {
      issueType: 'water_leakage', category: 'Water_Drainage',
      severity: 6, dangerLevel: 'moderate',
      departmentId: 'water_supply',
      description: 'Active water pipe leak detected on road',
      confidence: 86, aiNotes: null,
    },
    citizenEdited: {
      issueType: 'water_leakage', category: 'Water_Drainage',
      severity: 6, dangerLevel: 'moderate', departmentId: 'water_supply',
    },
    location: {
      geohash: 'tuvz6cd',
      lat: 22.5390, lng: 88.3720,
      ward: 'Ward 83', city: 'Kolkata',
      address: 'Near Bosepukur Crossing, Ward 83, Kolkata',
    },
    photos: {
      report: FAKE_IMAGES.water_leakage,
      resolution: null,
      reopen: [],
    },
    citizenId: 'demo_citizen_uid_rahul',
    citizenPhone: '+919800000007',
    citizenEmail: 'rahul.k@example.com',
    assignedOfficerName: 'Suresh Mehta',
    slaDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    upvoteCount: 2,
    upvoterIds: ['demo_uid_10', 'demo_uid_11'],
    verificationStatus: 'VERIFIED',
    verifierIds: ['demo_uid_12', 'demo_uid_13', 'demo_uid_14'],
    verifiedBy: 'PEERS',
    ghostWindowOpen: false,
    ghostWindowExpiry: null,
    ghostCount: 0,
    overrideCount: 0,
    resolutionRetries: 0,
    internalNotes: 'Near school zone. Check for pipe age — may need full replacement.',
    reminderSent: false,
    rtiGenerated: false,
    rtiPdfUrl: null,
    appealGenerated: false,
    resolvedAt: null,
    citizenRating: null,
    citizenRatingNote: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },

];

module.exports = sampleTickets;
```

---

## 9. Seed Data — Gamification

One document per demo citizen. `demo_citizen_uid_arjun` is the primary demo citizen with rich data.

**`backend/seed/gamification.js`**

```javascript
const gamificationSeed = [
  {
    id: 'demo_citizen_uid_arjun',
    displayName: 'Arjun Mukherjee',
    ward: 'Ward 82',
    xp: 1240,
    level: 'Active Resident',
    badges: ['pothole_hunter', 'first_responder', 'monsoon_watch', 'verified_voice'],
    streakDays: 7,
    longestStreak: 7,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalReports: 12,
    resolvedReports: 9,
    ghostCatches: 1,
    rtiFiled: 0,
    verificationsDone: 14,
    upvotesDone: 8,
    wardsReportedIn: ['ward_82', 'ward_83'],
    criticalIssuesReported: 2,
    potholeCount: 5,
    streetlightCount: 2,
    waterlLoggingCount: 3,
    currentChallenge: {
      id: 'monsoon_waterlogging_june_w4',
      description: 'Report 2 waterlogging issues this week',
      target: 2,
      progress: 1,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    weeklyXP: 180,
    monthlyXP: 620,
    weeklyRankWard: 2,
    monthlyRankWard: 2,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_citizen_uid_priya',
    displayName: 'Priya Sen',
    ward: 'Ward 84',
    xp: 8200,
    level: 'Civic Hero',
    badges: ['pothole_hunter', 'ghost_buster', 'rti_warrior', 'ward_legend', 'streak_master', 'explorer', 'safety_sentinel', 'fact_checker', 'verified_voice', 'first_responder', 'monsoon_watch', 'light_keeper'],
    streakDays: 42,
    longestStreak: 42,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalReports: 47,
    resolvedReports: 39,
    ghostCatches: 7,
    rtiFiled: 2,
    verificationsDone: 68,
    upvotesDone: 31,
    wardsReportedIn: ['ward_82', 'ward_83', 'ward_84', 'ward_85', 'ward_86'],
    criticalIssuesReported: 8,
    potholeCount: 14,
    streetlightCount: 6,
    waterlLoggingCount: 9,
    currentChallenge: null,
    weeklyXP: 420,
    monthlyXP: 1800,
    weeklyRankWard: 1,
    monthlyRankWard: 1,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_citizen_uid_riya',
    displayName: 'Riya Das',
    ward: 'Ward 83',
    xp: 4800,
    level: 'Ward Champion',
    badges: ['pothole_hunter', 'monsoon_watch', 'verified_voice', 'first_responder', 'ghost_buster'],
    streakDays: 14,
    longestStreak: 21,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalReports: 28,
    resolvedReports: 22,
    ghostCatches: 2,
    rtiFiled: 0,
    verificationsDone: 31,
    upvotesDone: 19,
    wardsReportedIn: ['ward_83', 'ward_84'],
    criticalIssuesReported: 4,
    potholeCount: 7,
    streetlightCount: 4,
    waterlLoggingCount: 5,
    currentChallenge: null,
    weeklyXP: 280,
    monthlyXP: 1100,
    weeklyRankWard: 1,
    monthlyRankWard: 1,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

module.exports = gamificationSeed;
```

---

## 10. Seed Data — Predictions

Three AI-generated predictions for demo.

**`backend/seed/predictions.js`**

```javascript
const predictionsSeed = [
  {
    zoneGeohash: 'tuvz4d',
    ward: 'Ward 82',
    city: 'Kolkata',
    approximateLocation: 'Near Gariahat Flyover, Ward 82',
    lat: 22.5204,
    lng: 88.3467,
    issueType: 'pothole',
    category: 'Infrastructure',
    probability: 84,
    reason: 'Road last repaired in 2019. Monsoon season approaching. 12 pothole reports at this location in July 2025. Road surface shows wear patterns consistent with pre-monsoon deterioration.',
    recommendedAction: 'Pre-inspect road section and apply preventive patching before monsoon onset. Estimated cost: ₹15,000–20,000.',
    season: 'monsoon',
    generatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    convertedToTicket: false,
    convertedTicketId: null,
    cameTrue: null,
    actualTicketId: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    zoneGeohash: 'tuvz2m',
    ward: 'Ward 84',
    city: 'Kolkata',
    approximateLocation: 'Lake Drain near Tollygunge, Ward 84',
    lat: 22.5089,
    lng: 88.3390,
    issueType: 'waterlogging',
    category: 'Water_Drainage',
    probability: 79,
    reason: 'Drainage channel at this location has been partially blocked for 2 months (3 past reports). Historical data shows waterlogging at this point in every monsoon since 2022. IMD forecast: heavy rain expected next 7 days.',
    recommendedAction: 'Clear drainage channel and inspect for structural blockage. Desilting work recommended before June 28.',
    season: 'monsoon',
    generatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    convertedToTicket: false,
    convertedTicketId: null,
    cameTrue: null,
    actualTicketId: null,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    zoneGeohash: 'tuvz6c',
    ward: 'Ward 83',
    city: 'Kolkata',
    approximateLocation: 'School Zone, Bosepukur Road, Ward 83',
    lat: 22.5390,
    lng: 88.3720,
    issueType: 'broken_light',
    category: 'Electricity',
    probability: 65,
    reason: 'Three streetlights in this zone were reported as requiring replacement in April 2026 maintenance records. Average lifespan of current bulb type is 8 months — these are now 9 months old. Near school zone — safety risk at night.',
    recommendedAction: 'Proactive bulb replacement for 3 streetlights on Bosepukur Road before school reopening (1 July).',
    season: 'monsoon',
    generatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    convertedToTicket: false,
    convertedTicketId: null,
    cameTrue: null,
    actualTicketId: null,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
];

module.exports = predictionsSeed;
```

---

## 11. Seed Data — Ward Stats

```javascript
// backend/seed/wardStats.js
const wardStatsSeed = [
  {
    id: 'ward_82',
    ward: 'Ward 82',
    city: 'Kolkata',
    totalThisMonth: 52,
    resolvedThisMonth: 47,
    pendingThisMonth: 5,
    resolutionRateThisMonth: 90.4,
    civicScore: 'B+',
    civicScoreNumeric: 83,
    previousMonthScore: 'C',
    trend: 'improving',
    topIssueType: 'pothole',
    topIssueCount: 18,
    lastUpdated: new Date().toISOString(),
    month: 6,
    year: 2026,
  },
  {
    id: 'ward_83',
    ward: 'Ward 83',
    city: 'Kolkata',
    totalThisMonth: 67,
    resolvedThisMonth: 49,
    pendingThisMonth: 18,
    resolutionRateThisMonth: 73.1,
    civicScore: 'C+',
    civicScoreNumeric: 68,
    previousMonthScore: 'C+',
    trend: 'stable',
    topIssueType: 'waterlogging',
    topIssueCount: 22,
    lastUpdated: new Date().toISOString(),
    month: 6,
    year: 2026,
  },
  {
    id: 'ward_84',
    ward: 'Ward 84',
    city: 'Kolkata',
    totalThisMonth: 38,
    resolvedThisMonth: 35,
    pendingThisMonth: 3,
    resolutionRateThisMonth: 92.1,
    civicScore: 'A-',
    civicScoreNumeric: 88,
    previousMonthScore: 'B+',
    trend: 'improving',
    topIssueType: 'garbage',
    topIssueCount: 12,
    lastUpdated: new Date().toISOString(),
    month: 6,
    year: 2026,
  },
];

module.exports = wardStatsSeed;
```

---

## 12. Seed Data — Counters

```javascript
// backend/seed/counters.js
const countersSeed = [
  { id: 'kolkata',   city: 'kolkata',   count: 149 },
  { id: 'mumbai',    city: 'mumbai',    count: 0   },
  { id: 'delhi',     city: 'delhi',     count: 0   },
  { id: 'bangalore', city: 'bangalore', count: 0   },
];

module.exports = countersSeed;
```

---

## 13. Seed Script

**`backend/seed/index.js`** — Run this ONCE after Firebase project setup.

```javascript
require('dotenv').config({ path: '../.env' });
const { admin, db, auth } = require('../config/firebase');

const departments  = require('./departments');
const officers     = require('./officers');
const adminUser    = require('./admin');
const tickets      = require('./tickets');
const gamification = require('./gamification');
const predictions  = require('./predictions');
const wardStats    = require('./wardStats');
const counters     = require('./counters');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const seed = async () => {
  console.log('🌱 Starting Community Hero seed...\n');

  // ── 1. Create Admin Firebase Auth User ──────────────────────────────
  console.log('1️⃣  Creating admin Firebase Auth user...');
  let adminUid;
  try {
    const adminRecord = await auth.createUser({
      email:        adminUser.email,
      password:     adminUser.password,
      displayName:  adminUser.displayName,
    });
    adminUid = adminRecord.uid;
    await auth.setCustomUserClaims(adminUid, adminUser.customClaims);
    console.log(`   ✅ Admin created: ${adminUser.email} (uid: ${adminUid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(adminUser.email);
      adminUid = existing.uid;
      await auth.setCustomUserClaims(adminUid, adminUser.customClaims);
      console.log(`   ℹ️  Admin already exists. Claims updated. (uid: ${adminUid})`);
    } else throw err;
  }

  // ── 2. Seed Departments ──────────────────────────────────────────────
  console.log('\n2️⃣  Seeding departments...');
  const batch1 = db.batch();
  for (const dept of departments) {
    batch1.set(db.collection('departments').doc(dept.id), dept);
  }
  await batch1.commit();
  console.log(`   ✅ ${departments.length} departments seeded`);

  // ── 3. Create Officer Firebase Auth Users + Firestore Profiles ───────
  console.log('\n3️⃣  Creating officers...');
  const officerUids = {};
  for (const officer of officers) {
    let uid;
    try {
      const record = await auth.createUser({
        email:       officer.email,
        password:    officer.password,
        displayName: officer.profile.name,
      });
      uid = record.uid;
      console.log(`   ✅ Created: ${officer.profile.name} (${officer.email})`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(officer.email);
        uid = existing.uid;
        console.log(`   ℹ️  Exists: ${officer.profile.name}`);
      } else throw err;
    }

    await auth.setCustomUserClaims(uid, officer.customClaims);
    await db.collection('officers').doc(uid).set({
      ...officer.profile,
      id: uid,
      createdBy: adminUid,
    });

    officerUids[officer.profile.name] = uid;
    await sleep(200); // avoid Firebase rate limits
  }

  // ── 4. Update department headOfficerIds ──────────────────────────────
  console.log('\n4️⃣  Updating department heads...');
  await db.collection('departments').doc('sanitation').update({
    headOfficerId:   officerUids['Priya Sharma'],
    headOfficerName: 'Priya Sharma',
    officerCount: 1,
  });
  await db.collection('departments').doc('water_supply').update({
    headOfficerId:   officerUids['Suresh Mehta'],
    headOfficerName: 'Suresh Mehta',
    officerCount: 1,
  });
  await db.collection('departments').doc('roads_infrastructure').update({
    officerCount: 2,
  });
  console.log('   ✅ Department heads updated');

  // ── 5. Seed Sample Tickets ───────────────────────────────────────────
  console.log('\n5️⃣  Seeding sample tickets...');
  const { tickets: ticketData } = require('./tickets');
  const batch2 = db.batch();
  for (const ticket of ticketData) {
    const { docId, ...data } = ticket;
    // Assign real officer UIDs
    if (data.assignedOfficerName === 'Rajesh Kumar') {
      data.assignedOfficerId = officerUids['Rajesh Kumar'];
    } else if (data.assignedOfficerName === 'Priya Sharma') {
      data.assignedOfficerId = officerUids['Priya Sharma'];
    } else if (data.assignedOfficerName === 'Suresh Mehta') {
      data.assignedOfficerId = officerUids['Suresh Mehta'];
    } else if (data.assignedOfficerName === 'Deepa Nair') {
      data.assignedOfficerId = officerUids['Deepa Nair'];
    }
    batch2.set(db.collection('tickets').doc(docId), data);
  }
  await batch2.commit();
  console.log(`   ✅ ${ticketData.length} sample tickets seeded`);

  // Update officer active case counts from seeded tickets
  for (const name of ['Rajesh Kumar', 'Suresh Mehta']) {
    if (officerUids[name]) {
      await db.collection('officers').doc(officerUids[name]).update({
        activeCaseCount: name === 'Rajesh Kumar' ? 1 : 2,
        totalAssigned:   name === 'Rajesh Kumar' ? 1 : 3,
      });
    }
  }

  // ── 6. Seed Ticket Logs ──────────────────────────────────────────────
  console.log('\n6️⃣  Seeding ticket logs...');
  const sampleLogs = [
    { ticketId: 'KOL-2026-00142-a3f9c2', ticketPublicId: 'KOL-2026-00142',
      actorId: 'anonymous', actorRole: 'citizen', action: 'TICKET_CREATED',
      previousState: null, newState: 'UNASSIGNED', metadata: {},
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { ticketId: 'KOL-2026-00142-a3f9c2', ticketPublicId: 'KOL-2026-00142',
      actorId: 'system', actorRole: 'system', action: 'VERIFIED',
      previousState: 'UNASSIGNED', newState: 'VERIFIED',
      metadata: { verifiedBy: 'PEERS', verifierCount: 3 },
      timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString() },
    { ticketId: 'KOL-2026-00142-a3f9c2', ticketPublicId: 'KOL-2026-00142',
      actorId: adminUid, actorRole: 'admin', action: 'OFFICER_ASSIGNED',
      previousState: 'VERIFIED', newState: 'ASSIGNED',
      metadata: { officerName: 'Rajesh Kumar', note: 'High traffic zone.' },
      timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString() },
    { ticketId: 'KOL-2026-00142-a3f9c2', ticketPublicId: 'KOL-2026-00142',
      actorId: officerUids['Rajesh Kumar'], actorRole: 'officer', action: 'STATUS_CHANGE',
      previousState: 'ASSIGNED', newState: 'IN_PROGRESS', metadata: {},
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ];
  const batch3 = db.batch();
  for (const log of sampleLogs) {
    batch3.set(db.collection('ticket_logs').doc(), log);
  }
  await batch3.commit();
  console.log('   ✅ Ticket logs seeded');

  // ── 7. Seed Gamification ─────────────────────────────────────────────
  console.log('\n7️⃣  Seeding gamification...');
  const batch4 = db.batch();
  for (const g of gamification) {
    batch4.set(db.collection('gamification').doc(g.id), g);
  }
  await batch4.commit();
  console.log(`   ✅ ${gamification.length} gamification profiles seeded`);

  // ── 8. Seed Predictions ──────────────────────────────────────────────
  console.log('\n8️⃣  Seeding predictions...');
  const batch5 = db.batch();
  for (const pred of predictions) {
    batch5.set(db.collection('predictions').doc(), pred);
  }
  await batch5.commit();
  console.log(`   ✅ ${predictions.length} predictions seeded`);

  // ── 9. Seed Ward Stats ───────────────────────────────────────────────
  console.log('\n9️⃣  Seeding ward stats...');
  const batch6 = db.batch();
  for (const ws of wardStats) {
    const { id, ...data } = ws;
    batch6.set(db.collection('ward_stats').doc(id), data);
  }
  await batch6.commit();
  console.log(`   ✅ ${wardStats.length} ward stats seeded`);

  // ── 10. Seed Counters ────────────────────────────────────────────────
  console.log('\n🔟  Seeding counters...');
  const batch7 = db.batch();
  for (const counter of counters) {
    const { id, ...data } = counter;
    batch7.set(db.collection('counters').doc(id), data);
  }
  await batch7.commit();
  console.log(`   ✅ ${counters.length} counters seeded`);

  // ── Done ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('📋 Demo credentials:');
  console.log(`   Admin:          ${adminUser.email} / ${adminUser.password}`);
  officers.forEach(o => {
    console.log(`   ${o.profile.designation.padEnd(20)} ${o.email} / ${o.password} [${o.profile.wardIds.join(', ')}]`);
  });
  console.log('\n🎟️  Demo ticket IDs:');
  console.log('   KOL-2026-00149  (UNASSIGNED — Critical Open Manhole)');
  console.log('   KOL-2026-00142  (IN_PROGRESS — Pothole — Rajesh Kumar)');
  console.log('   KOL-2026-00138  (RESOLVED — Broken Light — ghost window open)');
  console.log('   KOL-2026-00133  (GHOST_FLAGGED — Garbage)');
  console.log('   KOL-2026-00128  (ESCALATED — Waterlogging)');
  console.log('   KOL-2026-00101  (RTI_FILED — Sewage Overflow — 33 days)');
  console.log('   KOL-2026-00115  (CLOSED_OVERRIDE — Natural Resolution)');
  console.log('   KOL-2026-00145  (ASSIGNED — Water Leakage)');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
```

**Run seed:**
```bash
cd backend
node seed/index.js
```

---

## 14. Fake Image URLs

Use these Picsum / placeholder images for demo photos. In production, replace with actual field photos.

**`backend/seed/fakeImages.js`**

```javascript
// All images from picsum.photos (free, no auth, stable URLs)
// Dimensions: 800x600 for consistency

const FAKE_IMAGES = {

  // Issue report photos
  pothole:
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
    // Dark, damaged road surface — close match for pothole

  open_manhole:
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    // Construction / infrastructure — close match

  broken_light:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    // Street at night with lights

  waterlogging:
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80',
    // Flooded street

  waterlogging_minor:
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    // Small road puddle

  garbage:
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
    // Garbage on street

  sewage:
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    // Water/drainage on road

  water_leakage:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    // Water on road

  // Resolution / "after" photos
  broken_light_resolved:
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    // Night street with working lights

  garbage_fake_resolved:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    // Same area — still has some garbage (demonstrates ghost detection)

  // Re-report photo (for ghost detection demo)
  garbage_reopen:
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
    // Same garbage — citizen re-reports

  // Profile avatars for demo citizens
  avatar_arjun:
    'https://i.pravatar.cc/150?img=12',

  avatar_priya:
    'https://i.pravatar.cc/150?img=47',

  avatar_riya:
    'https://i.pravatar.cc/150?img=23',
};

// If Unsplash images are blocked, use these Picsum fallbacks:
const PICSUM_FALLBACKS = {
  pothole:        'https://picsum.photos/seed/pothole/800/600',
  open_manhole:   'https://picsum.photos/seed/manhole/800/600',
  broken_light:   'https://picsum.photos/seed/light/800/600',
  waterlogging:   'https://picsum.photos/seed/flood/800/600',
  garbage:        'https://picsum.photos/seed/garbage/800/600',
  sewage:         'https://picsum.photos/seed/sewage/800/600',
  water_leakage:  'https://picsum.photos/seed/leak/800/600',
};

module.exports = { FAKE_IMAGES, PICSUM_FALLBACKS };
```

---

## 15. Firestore Index Requirements

Firestore requires composite indexes for multi-field queries. Add these to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "location.geohash", "order": "ASCENDING" },
        { "fieldPath": "issueType",         "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",    "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "citizenId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedOfficerId", "order": "ASCENDING" },
        { "fieldPath": "status",            "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ghostWindowOpen",   "order": "ASCENDING" },
        { "fieldPath": "ghostWindowExpiry", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",       "order": "ASCENDING" },
        { "fieldPath": "slaDeadline",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "officers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "departmentId",    "order": "ASCENDING" },
        { "fieldPath": "status",          "order": "ASCENDING" },
        { "fieldPath": "activeCaseCount", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "gamification",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ward",       "order": "ASCENDING" },
        { "fieldPath": "weeklyXP",   "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "gamification",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ward",       "order": "ASCENDING" },
        { "fieldPath": "monthlyXP",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "predictions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "zoneGeohash", "order": "ASCENDING" },
        { "fieldPath": "expiresAt",   "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "ticket_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ticketId",  "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "queries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedOfficerId", "order": "ASCENDING" },
        { "fieldPath": "status",            "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 16. Data Relationships Map

```
Firebase Auth (user accounts)
      |
      ├── uid ──────────────→ officers/{uid}
      │                            │
      │                            ├── departmentId ──→ departments/{id}
      │                            └── wardIds[]
      │
      ├── uid ──────────────→ users/{uid}
      │
      └── uid ──────────────→ gamification/{uid}

tickets/{docId}
      │
      ├── publicId ─────────────────────────────── (human-facing ID)
      ├── citizenId ────────→ users/{uid}
      ├── assignedOfficerId ─→ officers/{uid}
      ├── departmentId ─────→ departments/{id}
      │
      ├── photos.report ────→ Firebase Storage: tickets/{docId}/report/
      ├── photos.resolution ─→ Firebase Storage: tickets/{docId}/resolution/
      └── photos.reopen[] ──→ Firebase Storage: tickets/{docId}/reopen/

ticket_logs/{autoId}
      └── ticketId ─────────→ tickets/{docId}   (append-only)

queries/{autoId}
      ├── ticketId ─────────→ tickets/{docId}
      └── assignedOfficerId ─→ officers/{uid}

predictions/{autoId}
      └── convertedTicketId ─→ tickets/{publicId}  (if converted)

overrides/{autoId}
      ├── ticketId ─────────→ tickets/{docId}
      ├── requestedBy ──────→ officers/{uid}
      └── reviewedBy ───────→ officers/{uid} or admin uid

ward_reports/{ward_year_month}
      (no FK — ward name is the key)

ward_stats/{ward_slug}
      (no FK — ward name is the key)

counters/{city_slug}
      (no FK — standalone atomic counters)

verifications/{ticketDocId}
      └── (same docId as parent ticket)
```

---

*Community Hero — Database Schema & Seed Data Guide v1.0*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
