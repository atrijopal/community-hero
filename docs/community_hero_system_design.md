# System Design Document
## Community Hero — Hyperlocal Problem Solver
**Version:** 1.0 (Final)
**Date:** June 2026
**Hackathon:** BlockseBlock × Google AI Studio Challenge

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Client Layer](#2-client-layer)
3. [API Gateway & Backend Services](#3-api-gateway--backend-services)
4. [AI Service Layer](#4-ai-service-layer)
5. [Data Layer](#5-data-layer)
6. [Background Workers & Job Queue](#6-background-workers--job-queue)
7. [Notification System](#7-notification-system)
8. [Security Design](#8-security-design)
9. [Rate Limiting](#9-rate-limiting)
10. [Database Schema](#10-database-schema)
11. [API Contract](#11-api-contract)
12. [Scalability Plan](#12-scalability-plan)
13. [Cost Analysis](#13-cost-analysis)
14. [Hackathon vs Production Comparison](#14-hackathon-vs-production-comparison)

---

## 1. Architecture Overview

### Design Philosophy
- **Stateless backend**: Every Cloud Run instance is stateless. State lives in Firestore and Firebase Storage only.
- **AI suggests, humans confirm**: Gemini output is always returned to the client as editable suggestions, never committed directly.
- **Append-only audit trail**: No record is ever updated or deleted. Every change is a new log entry.
- **Progressive scalability**: The entire stack runs free on hackathon day. Each component has a direct upgrade path to production scale with zero code changes.
- **Security by default**: Gemini API key server-side only. Firestore Security Rules are the primary access gate. Client input never trusted.

### Tier Summary

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                      │
│  Public Page | Citizen App | Officer App | Admin App│
│              React SPA (role-based routing)         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS only
┌──────────────────────▼──────────────────────────────┐
│              API GATEWAY (Cloud Run)                │
│   Auth middleware | Rate limiter | CORS | Routing   │
└──┬──────────┬──────────┬──────────┬──────────┬──────┘
   │          │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌────▼──┐ ┌────▼──┐  ┌───▼───┐
│Ticket│  │Auth  │  │Notify │ │Staff  │  │ AI    │
│ svc  │  │ svc  │  │  svc  │ │  svc  │  │  svc  │
└──┬───┘  └───┬──┘  └────┬──┘ └────┬──┘  └───┬───┘
   │          │           │         │          │
┌──▼──────────▼───────────▼─────────▼──────────▼────┐
│                   JOB QUEUE                        │
│    SLA worker | Ghost worker | Predict worker      │
└──────────────────────┬─────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────┐
│                  DATA / AI LAYER                   │
│  Firestore | Firebase Storage | Firebase Auth      │
│  Firebase FCM | Gemini Vision | Google Translate   │
│  OpenStreetMap + Nominatim                         │
└────────────────────────────────────────────────────┘
```

---

## 2. Client Layer

### 2.1 Technology
- **Framework**: React 18 (single SPA with role-based route guards)
- **Maps**: Leaflet.js + OpenStreetMap tiles (free, no billing required)
- **Auth**: Firebase Auth SDK (Google Sign-In)
- **Real-time**: Firestore `onSnapshot` listeners for live ticket status
- **Push**: Firebase Cloud Messaging (FCM) service worker
- **Styling**: Tailwind CSS
- **Build**: Vite

### 2.2 Four Interfaces

| Interface | Auth Required | Entry Point | Role Guard |
|---|---|---|---|
| Public Landing | No | `/` | None |
| Citizen Dashboard | Optional (Google Sign-In) | `/citizen` | `citizen` role or anonymous |
| Officer Dashboard | Mandatory | `/officer` | `officer` or `senior_officer` role |
| Admin Dashboard | Mandatory | `/admin` | `admin` role only |

**Role-based routing:**
```javascript
// Firebase custom claims set by Admin on officer/admin account creation
// Checked on every protected route load
const roleGuard = async (requiredRole) => {
  const token = await auth.currentUser.getIdTokenResult();
  if (!token.claims[requiredRole]) redirect('/unauthorized');
};
```

### 2.3 Public Landing Page Features (No Login)
- Ticket ID tracker (no login)
- Report issue form (anonymous submission allowed)
- Community map (read-only, OpenStreetMap + Leaflet)
- Civic Health Score per ward (public)
- Role login selector: Citizen / Officer / Admin

### 2.4 Key Client-Side Rules
- Gemini API key is **never** in the client bundle
- All AI calls go through the backend AI service
- GPS coordinates shown to citizen as approximate ward-level address (Nominatim reverse geocoding) — raw lat/lng never displayed
- Firestore listeners use field masks — internal officer notes never fetched by citizen client
- Photo uploads go directly to Firebase Storage via signed upload URL (citizen never gets storage admin credentials)

---

## 3. API Gateway & Backend Services

### 3.1 API Gateway (Cloud Run)

Single Cloud Run service acting as API gateway + microservice router.

**Middleware stack (in order):**
```
Request
  → HTTPS enforcement
  → CORS (allowlist: deployed frontend domain only)
  → Rate limiter (express-rate-limit + in-memory store)
  → Firebase JWT verification (all protected routes)
  → Role extractor (sets req.user.role from custom claims)
  → Request logger (structured JSON, no PII)
  → Route dispatcher
  → Error handler
  → Response
```

**CORS config:**
```javascript
cors({
  origin: process.env.FRONTEND_URL, // e.g. https://community-hero.run.app
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
})
```

### 3.2 Microservices

All five services are Express routers mounted on the same Cloud Run instance for the hackathon. On scaling, each becomes its own Cloud Run service.

---

#### Ticket Service (`/api/tickets`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | None (anonymous allowed) | Create ticket |
| GET | `/:id` | None | Public ticket view |
| GET | `/` | Officer / Admin | List tickets (paginated, filtered) |
| PATCH | `/:id/status` | Officer / Admin | Update status |
| PATCH | `/:id/assign` | Admin | Assign officer |
| POST | `/:id/resolution` | Officer | Upload resolution photo |
| POST | `/:id/reopen` | Citizen | Ghost re-open (with photo) |
| POST | `/:id/upvote` | Citizen | Me Too / upvote |
| POST | `/:id/query` | None | NLP query bot |

**Ticket ID generation:**
```javascript
const generateTicketId = (city, sequence) => {
  const cityCode = CITY_CODES[city]; // e.g. KOL, MUM, DEL
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(5, '0');
  const salt = crypto.randomBytes(3).toString('hex'); // prevents enumeration
  return `${cityCode}-${year}-${seq}-${salt}`;
  // e.g. KOL-2026-00142-a3f9c2
};
```

**State machine (enforced server-side, never client-side):**
```
UNASSIGNED → VERIFIED → ASSIGNED → IN_PROGRESS → RESOLVED
     ↓                                    ↓            ↓
  REJECTED                          ESCALATED    GHOST_FLAGGED
                                        ↓
                                   RTI_FILED
                                        ↓
                                  CLOSED_OVERRIDE
```
Invalid state transitions are rejected with 400. Client cannot skip states.

---

#### Auth Service (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/officer` | Admin | Create officer account |
| POST | `/officer/:id/deactivate` | Admin | Deactivate officer |
| POST | `/officer/:id/role` | Admin | Set role (officer / senior_officer) |
| GET | `/me` | Any | Get own profile + role |

**Officer account creation flow:**
```javascript
// Admin creates officer account
const createOfficer = async (officerData) => {
  // 1. Create Firebase Auth user
  const user = await admin.auth().createUser({
    email: officerData.email,
    password: crypto.randomBytes(8).toString('hex'), // temp password
    displayName: officerData.name,
  });
  // 2. Set custom claims (role)
  await admin.auth().setCustomUserClaims(user.uid, {
    officer: true,
    wardId: officerData.wardId,
    departmentId: officerData.departmentId,
  });
  // 3. Write officer profile to Firestore
  await db.collection('officers').doc(user.uid).set(officerData);
  // 4. Send password reset email so officer sets own password
  await admin.auth().generatePasswordResetLink(officerData.email);
};
```

---

#### Notify Service (`/api/notify`)

Internal service — not called by client directly. Called by Ticket Service on every state change.

**Notification triggers:**
```javascript
const NOTIFY_ON = {
  VERIFIED:         ['citizen'],
  ASSIGNED:         ['citizen', 'officer'],
  IN_PROGRESS:      ['citizen'],
  RESOLVED:         ['citizen'],
  GHOST_FLAGGED:    ['citizen', 'officer', 'admin'],
  ESCALATED:        ['officer', 'senior_officer', 'admin'],
  RTI_FILED:        ['citizen'],
  CLOSED_OVERRIDE:  ['citizen'],
};
```

**Channels:**
- FCM push (Firebase Cloud Messaging) — instant, free, unlimited
- Email (nodemailer via Gmail SMTP or SendGrid free tier)
- WhatsApp (Twilio sandbox in dev, Twilio Business API in production)

**Message template example:**
```
WhatsApp: "Your issue KOL-2026-00142 (Pothole, Gariahat Market)
has been assigned to Rajesh Kumar, Roads & Infrastructure Dept.
Expected resolution by: 1 Jul 2026.
Track: https://community-hero.app/track/KOL-2026-00142"
```

---

#### Staff Service (`/api/staff`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/officers` | Admin | List all officers (paginated) |
| GET | `/officers/:id` | Admin | Officer profile + metrics |
| POST | `/officers` | Admin | Create officer |
| PATCH | `/officers/:id` | Admin | Edit officer |
| DELETE | `/officers/:id` | Admin | Deactivate (soft delete) |
| GET | `/officers/assignable` | Admin | Workload-balanced dropdown list |
| GET | `/departments` | Admin | List departments |
| POST | `/departments` | Admin | Create department |

**Assignable officers query (workload-balanced):**
```javascript
const getAssignableOfficers = async (departmentId, wardId) => {
  const officers = await db.collection('officers')
    .where('departmentId', '==', departmentId)
    .where('wardIds', 'array-contains', wardId)
    .where('status', '==', 'active')
    .get();

  return officers.docs
    .map(doc => ({
      ...doc.data(),
      // active case count from denormalized counter field
      activeCases: doc.data().activeCaseCount,
      resolutionRate: doc.data().resolvedCount / doc.data().totalAssigned * 100,
    }))
    .sort((a, b) => a.activeCases - b.activeCases); // fewest cases first
};
```

---

#### AI Service (`/api/ai`)

**All Gemini calls are internal only.** Client never calls this directly.

Called by other services internally. Gemini API key is an environment variable, never logged, never returned in responses.

| Internal Call | Triggered By | Gemini Task |
|---|---|---|
| `classifyIssue(photo, context)` | Ticket Service on create | Issue type, severity, dept, description |
| `validateResolution(before, after)` | Ticket Service on resolve | Before/after comparison |
| `detectGhost(new, original, resolved)` | Ghost Worker | Two-image ghost check |
| `detectDuplicate(newPhoto, existingPhoto)` | Ticket Service on create | Same issue check |
| `predictIssues(zoneHistory)` | Predict Worker nightly | Zone-level future issues |
| `queryBot(question, ticketData)` | Ticket Service on query | Plain English answer |
| `verifyIssue(photo)` | Verify Worker (backup) | Genuine issue check |
| `generateRTI(ticketData)` | SLA Worker at Day 30 | Structured RTI document |
| `generateAppeal(ticketData, rtiData)` | SLA Worker at Day 60 | First Appeal document |
| `generateDescription(photo, context)` | Ticket Service on create | One-line description |
| `routeDepartment(issueType, zone, load)` | Ticket Service on create | Optimal department |
| `generateEscalationNote(ticketData)` | SLA Worker at Day 14 | Escalation summary |
| `generateWardReport(wardData)` | Admin request | Monthly narrative report |
| `scoreWeightedSeverity(photo, context)` | Ticket Service on create | Context-aware 1-10 score |

**Gemini prompt pattern (all calls follow this structure):**
```javascript
const callGemini = async (promptType, inputs) => {
  const prompt = PROMPTS[promptType](inputs); // all prompts in /prompts/ folder
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY, // server-side only
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...(inputs.images || [])] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
};
```

**Prompt injection protection:**
```javascript
// Citizen free text is NEVER injected into prompts
// Only structured data (GPS, time, season) goes into prompts
// Citizen description is stored and shown to officer — never fed to AI

const classifyIssue = (photo, context) => `
Analyze this civic issue image. Return ONLY valid JSON, no explanation:
{
  "issue_type": "...",
  "category": "...",
  "severity": 1-10,
  "danger_level": "safe|moderate|critical",
  "department": "...",
  "description": "...",
  "confidence": 0-100
}
Context: ward=${context.ward}, season=${context.season},
nearby=${context.nearby}, time=${context.timeOfDay}
`;
// Note: no citizen input in this prompt
```

**Gemini quota protection:**
```javascript
// Token bucket — enforced before every Gemini call
const geminiQuota = {
  dailyLimit: 1400,       // 100 buffer below free tier limit of 1500
  minuteLimit: 12,        // 3 buffer below free tier limit of 15
  dailyUsed: 0,
  minuteUsed: 0,
};

const checkQuota = () => {
  if (geminiQuota.dailyUsed >= geminiQuota.dailyLimit)
    throw new Error('GEMINI_DAILY_QUOTA_EXCEEDED');
  if (geminiQuota.minuteUsed >= geminiQuota.minuteLimit)
    throw new Error('GEMINI_RATE_LIMIT');
};
```

---

## 4. AI Service Layer

### 4.1 Gemini Vision Integration

**Model:** `gemini-2.0-flash` (free tier, best speed/quality for hackathon)

**14 touchpoints summary:**

| # | Feature | Input | Output |
|---|---|---|---|
| 1 | Issue classification | Photo + context | JSON: type, category, severity, dept, description |
| 2 | Weighted severity | Photo + GPS context | Integer 1–10 with danger level |
| 3 | Resolution validation | Before + after photos | JSON: pass/fail flags + confidence |
| 4 | Ghost detection | 3 photos (new, original, resolved) | JSON: is_ghost boolean + confidence |
| 5 | Duplicate detection | 2 photos | JSON: is_duplicate boolean + confidence |
| 6 | Predictive flagging | Zone history JSON | JSON: predictions array |
| 7 | NLP query bot | Question + ticket JSON | Plain English string |
| 8 | Community verify assist | Photo | JSON: is_genuine boolean |
| 9 | RTI generation | Ticket data JSON | Structured RTI text |
| 10 | First Appeal generation | Ticket + RTI data | Structured appeal text |
| 11 | Ticket description | Photo + context | One-line string |
| 12 | Department routing | Issue type + zone + load | Department string |
| 13 | Escalation note | Ticket history JSON | Structured note string |
| 14 | Ward report | Ward stats JSON | Narrative report string |

### 4.2 Fallback Strategy

| Scenario | Fallback |
|---|---|
| Gemini confidence < 50% | Return empty fields, citizen fills manually |
| Gemini API down | Return empty fields, log error, alert admin |
| Daily quota exceeded | Queue request for next day, notify admin |
| Rate limit hit (15/min) | Queue with 5s delay, retry up to 3 times |
| Photo too large | Resize to 800px max server-side before sending |

### 4.3 EXIF Stripping
All photos have EXIF metadata stripped before storage and before sending to Gemini:
```javascript
const sharp = require('sharp');
const stripped = await sharp(photoBuffer)
  .withMetadata(false) // strips all EXIF including GPS
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();
```

---

## 5. Data Layer

### 5.1 Firestore Collections

#### `tickets`
```javascript
{
  id: "KOL-2026-00142-a3f9c2",          // document ID
  publicId: "KOL-2026-00142",           // shown to users
  status: "ASSIGNED",                    // state machine
  category: "Infrastructure",
  issueType: "pothole",
  aiSuggested: {                         // original Gemini output
    issueType: "pothole",
    severity: 7,
    department: "Roads_Infrastructure",
    confidence: 89,
  },
  citizenEdited: {                       // what citizen confirmed/changed
    issueType: "pothole",                // may differ from AI suggestion
    severity: 7,
    department: "Roads_Infrastructure",
    description: "Large pothole near Gariahat flyover",
  },
  location: {
    geohash: "tuvz4d",                  // for geo queries
    lat: 22.5204,                       // stored but not returned in public reads
    lng: 88.3467,
    ward: "Ward 82",
    city: "Kolkata",
    address: "Near Gariahat Market, Ward 82, Kolkata",
  },
  photos: {
    report: "gs://bucket/tickets/KOL-2026-00142/report.jpg",
    resolution: null,
    reports: [],                         // re-report photos for ghost detection
  },
  citizenId: "uid_or_null",             // null for anonymous
  assignedOfficerId: "officer_uid",
  assignedOfficerName: "Rajesh Kumar",  // denormalized for fast reads
  departmentId: "roads_infrastructure",
  severity: 7,
  dangerLevel: "moderate",
  slaDeadline: "2026-07-01T14:00:00Z",
  upvoteCount: 3,
  upvoterIds: ["uid1", "uid2", "uid3"], // for deduplication
  verificationStatus: "VERIFIED",
  verifierIds: ["uid1", "uid2"],
  ghostWindowOpen: true,
  ghostWindowExpiry: "2026-07-12T00:00:00Z",
  ghostCount: 0,
  overrideCount: 0,
  citizenRating: null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // NEVER returned in public reads:
  internalNotes: "Officer flagged access issue",  // field-masked
}
```

#### `ticket_logs` (append-only audit trail)
```javascript
{
  id: auto,
  ticketId: "KOL-2026-00142-a3f9c2",
  actorId: "uid",
  actorRole: "admin",
  action: "STATUS_CHANGE",
  previousState: "VERIFIED",
  newState: "ASSIGNED",
  metadata: { officerId: "...", note: "..." },
  timestamp: Timestamp,
}
```

#### `officers`
```javascript
{
  id: "firebase_auth_uid",
  name: "Rajesh Kumar",
  employeeId: "KMC-ENG-0042",
  designation: "Junior Engineer",
  departmentId: "roads_infrastructure",
  wardIds: ["ward_82", "ward_83"],
  email: "rajesh@kmc.gov.in",
  phone: "+91XXXXXXXXXX",
  status: "active",                     // active | on_leave | deactivated
  activeCaseCount: 4,                   // denormalized counter
  totalAssigned: 47,
  resolvedCount: 41,
  resolutionRate: 87.2,
  avgResolutionDays: 4.3,
  ghostClosureCount: 1,
  overrideCount: 2,
  accountabilityScore: 84,
  citizenRatingAvg: 4.1,
  createdAt: Timestamp,
  createdBy: "admin_uid",
}
```

#### `departments`
```javascript
{
  id: "roads_infrastructure",
  name: "Roads & Infrastructure",
  defaultSlaDays: 7,
  headOfficerId: "officer_uid",
  wardIds: ["ward_82", "ward_83", "ward_84"],
  issueTypes: ["pothole", "damaged_road", "broken_footpath"],
}
```

#### `predictions`
```javascript
{
  id: auto,
  zoneGeohash: "tuvz4d",
  ward: "Ward 82",
  issueType: "pothole",
  probability: 84,
  reason: "Heavy monsoon forecast, road last repaired 2019, 12 reports same zone Jul 2025",
  recommendedAction: "Inspect and pre-patch road section near Gariahat flyover",
  generatedAt: Timestamp,
  expiresAt: Timestamp,
  cameTrue: null,                       // set by ghost worker if prediction verified
}
```

#### `gamification`
```javascript
{
  id: "citizen_uid",
  xp: 1240,
  level: "Active Resident",
  badges: ["pothole_hunter", "first_responder"],
  streakDays: 7,
  lastActiveDate: "2026-06-24",
  totalReports: 12,
  resolvedReports: 9,
  ghostCatches: 1,
  rtiFiled: 0,
  verificationsDone: 14,
}
```

### 5.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        request.auth.token.admin == true;
    }
    function isOfficer() {
      return request.auth != null &&
        (request.auth.token.officer == true ||
         request.auth.token.senior_officer == true);
    }
    function isAuthenticated() {
      return request.auth != null;
    }
    function isTicketOwner(ticketId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/tickets/$(ticketId))
          .data.citizenId == request.auth.uid;
    }
    function isAssignedOfficer(ticketId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/tickets/$(ticketId))
          .data.assignedOfficerId == request.auth.uid;
    }

    match /tickets/{ticketId} {
      // Public fields readable by anyone (no internalNotes)
      allow read: if true;
      // Create: anyone (anonymous reports allowed)
      allow create: if request.resource.data.keys()
        .hasNone(['internalNotes', 'assignedOfficerId', 'overrideCount']);
      // Status updates: officer assigned to this ticket or admin
      allow update: if isAssignedOfficer(ticketId) || isAdmin();
      // Never delete
      allow delete: if false;
    }

    match /ticket_logs/{logId} {
      // Anyone can read audit trail (transparency)
      allow read: if true;
      // Only server (admin SDK) can write — enforced by no client write permission
      allow write: if false;
    }

    match /officers/{officerId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /departments/{deptId} {
      allow read: if isOfficer() || isAdmin();
      allow write: if isAdmin();
    }

    match /gamification/{citizenId} {
      allow read: if true;
      allow write: if request.auth.uid == citizenId || isAdmin();
    }

    match /predictions/{predId} {
      allow read: if true;
      allow write: if false; // server only
    }
  }
}
```

### 5.3 Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    match /tickets/{ticketId}/report/{file} {
      // Anyone can upload report photo (anonymous reporting)
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      // Anyone can read (public tickets)
      allow read: if true;
    }

    match /tickets/{ticketId}/resolution/{file} {
      // Only the assigned officer can upload resolution photo
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/tickets/$(ticketId))
             .data.assignedOfficerId == request.auth.uid
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow read: if true;
    }

    match /tickets/{ticketId}/reopen/{file} {
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow read: if true;
    }

    match /reports/{file} {
      // Admin-generated PDF reports
      allow read: if request.auth.token.admin == true ||
                     request.auth.token.officer == true;
      allow write: if false; // server only
    }
  }
}
```

---

## 6. Background Workers & Job Queue

All workers run as Cloud Run scheduled jobs (or Cloud Scheduler triggers in production).

### 6.1 SLA Worker (runs every hour)

```javascript
const slaWorker = async () => {
  const now = new Date();
  const tickets = await db.collection('tickets')
    .where('status', 'not-in', ['RESOLVED', 'REJECTED', 'CLOSED_OVERRIDE'])
    .get();

  for (const ticket of tickets.docs) {
    const created = ticket.data().createdAt.toDate();
    const daysSince = (now - created) / (1000 * 60 * 60 * 24);

    if (daysSince >= 60 && !ticket.data().appealGenerated)
      await generateFirstAppeal(ticket);

    else if (daysSince >= 30 && !ticket.data().rtiGenerated)
      await generateRTI(ticket);

    else if (daysSince >= 14 && ticket.data().status !== 'ESCALATED')
      await escalateToSenior(ticket);

    else if (daysSince >= 7 && !ticket.data().reminderSent)
      await sendOfficerReminder(ticket);

    // SLA breach flag
    if (now > ticket.data().slaDeadline.toDate())
      await db.collection('tickets').doc(ticket.id)
        .update({ slaBreached: true });
  }
};
```

### 6.2 Ghost Detection Worker (runs every 6 hours)

```javascript
const ghostWorker = async () => {
  // Find recently resolved tickets still in ghost window
  const now = new Date();
  const resolved = await db.collection('tickets')
    .where('status', '==', 'RESOLVED')
    .where('ghostWindowOpen', '==', true)
    .where('ghostWindowExpiry', '>', now)
    .get();

  for (const ticket of resolved.docs) {
    const { geohash, lat, lng } = ticket.data().location;

    // Find new reports at same geohash prefix (±30m)
    const nearby = await db.collection('tickets')
      .where('location.geohash', '>=', geohash.substring(0, 6))
      .where('location.geohash', '<=', geohash.substring(0, 6) + '\uf8ff')
      .where('issueType', '==', ticket.data().issueType)
      .where('createdAt', '>', ticket.data().resolvedAt)
      .get();

    for (const candidate of nearby.docs) {
      const result = await aiService.detectGhost({
        newPhoto: candidate.data().photos.report,
        originalPhoto: ticket.data().photos.report,
        resolutionPhoto: ticket.data().photos.resolution,
      });

      if (result.is_ghost && result.confidence >= 65) {
        await flagGhost(ticket, candidate, result);
      } else if (result.confidence >= 40) {
        await flagForAdminReview(ticket, candidate, result);
      }
    }
  }
};
```

### 6.3 Predictive Issue Worker (runs nightly at 2am)

```javascript
const predictWorker = async () => {
  const wards = await db.collection('departments')
    .get().then(d => getAllWards(d));

  for (const ward of wards) {
    const history = await getZoneHistory(ward.geohash, 730); // 2 years
    const predictions = await aiService.predictIssues({
      history,
      currentDate: new Date().toISOString(),
      season: getCurrentSeason(),
      ward: ward.name,
    });

    // Write predictions to Firestore
    for (const pred of predictions) {
      await db.collection('predictions').add({
        ...pred,
        zoneGeohash: ward.geohash,
        ward: ward.name,
        generatedAt: Timestamp.now(),
        expiresAt: addDays(new Date(), 30),
      });
    }
  }
};
```

### 6.4 Peer Verification Timeout Worker (runs every 2 hours)

```javascript
const verifyTimeoutWorker = async () => {
  const pending = await db.collection('tickets')
    .where('verificationStatus', '==', 'PENDING')
    .where('createdAt', '<', subtractHours(new Date(), 2))
    .get();

  for (const ticket of pending.docs) {
    // Fall back to Gemini if no human verifiers responded
    const result = await aiService.verifyIssue(ticket.data().photos.report);
    await db.collection('tickets').doc(ticket.id).update({
      verificationStatus: result.is_genuine ? 'VERIFIED' : 'REJECTED',
      verifiedBy: 'GEMINI_BACKUP',
    });
  }
};
```

---

## 7. Notification System

### 7.1 Architecture

```
State change in Ticket Service
        |
  Notify Service called internally
        |
   ┌────┴──────┐
   │           │
  FCM        Email + WhatsApp
(instant)   (queued, async)
```

### 7.2 WhatsApp (Twilio)

- **Hackathon**: Twilio sandbox (free, limited to approved numbers)
- **Production**: Twilio Business API or WhatsApp Business API directly

```javascript
const sendWhatsApp = async (phone, message) => {
  await twilioClient.messages.create({
    from: 'whatsapp:+14155238886', // Twilio sandbox
    to: `whatsapp:${phone}`,
    body: message,
  });
};
```

### 7.3 FCM Push

```javascript
const sendPush = async (userId, notification) => {
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) return;

  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: { ticketId: notification.ticketId },
  });
};
```

### 7.4 Firestore Real-Time (Client)

```javascript
// Citizen's ticket page — live status updates without polling
const unsubscribe = db.collection('tickets')
  .doc(ticketId)
  .onSnapshot((doc) => {
    setTicketStatus(doc.data().status);
    setAssignedOfficer(doc.data().assignedOfficerName);
  });
```

---

## 8. Security Design

### 8.1 Input Validation

All inputs validated server-side before processing:

```javascript
const ticketSchema = Joi.object({
  issueType: Joi.string().valid(...VALID_ISSUE_TYPES).required(),
  category: Joi.string().valid(...VALID_CATEGORIES).required(),
  severity: Joi.number().integer().min(1).max(10).required(),
  dangerLevel: Joi.string().valid('safe','moderate','critical').required(),
  departmentId: Joi.string().valid(...VALID_DEPARTMENTS).required(),
  description: Joi.string().max(500).pattern(/^[^<>{}]*$/).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    ward: Joi.string().max(100).required(),
    city: Joi.string().max(100).required(),
  }).required(),
});
```

### 8.2 Photo Security

```javascript
const validateAndProcessPhoto = async (buffer, mimetype) => {
  // 1. MIME type check (not just extension)
  const { fileTypeFromBuffer } = await import('file-type');
  const type = await fileTypeFromBuffer(buffer);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type?.mime))
    throw new Error('INVALID_FILE_TYPE');

  // 2. Size check
  if (buffer.length > 10 * 1024 * 1024)
    throw new Error('FILE_TOO_LARGE');

  // 3. Strip EXIF (privacy — removes GPS from photo metadata)
  const processed = await sharp(buffer)
    .withMetadata(false)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  return processed;
};
```

### 8.3 Rate Limiting

```javascript
const rateLimits = {
  // Report submission — prevent spam
  report: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many reports. Try again in an hour.' },
  }),

  // Login — prevent brute force
  login: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyGenerator: (req) => req.ip,
  }),

  // AI classify — protect Gemini quota
  aiClassify: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
  }),

  // Ghost re-open — prevent gaming
  reopen: rateLimit({
    windowMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    max: 1,
    keyGenerator: (req) => `${req.user?.uid}-${req.params.ticketId}`,
  }),

  // Ticket tracker — prevent enumeration
  track: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.ip,
  }),

  // Query bot — protect Gemini quota
  queryBot: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
  }),
};
```

### 8.4 Prompt Injection Protection

```javascript
// Citizen text NEVER goes into Gemini prompts
// Only structured/trusted data is interpolated

// WRONG (vulnerable):
const badPrompt = `Classify this issue. User said: "${citizenDescription}"`;

// RIGHT (safe):
const safePrompt = `
  Analyze this image and return JSON.
  Context: ward=${ward}, season=${season}, nearby=${nearby}
  Return ONLY: {issue_type, category, severity, danger_level, department, description, confidence}
`;
// citizenDescription stored separately, shown to officer, never sent to Gemini
```

### 8.5 Ticket ID Enumeration Prevention

```javascript
// Sequential IDs are guessable: KOL-2026-00142, KOL-2026-00143...
// Add cryptographic salt to Firestore document ID

const docId = `KOL-2026-00142-${crypto.randomBytes(3).toString('hex')}`;
// e.g. KOL-2026-00142-a3f9c2

// Public-facing ID (KOL-2026-00142) stored as a field
// Lookup requires matching the publicId field, not guessing the doc ID
await db.collection('tickets')
  .where('publicId', '==', 'KOL-2026-00142')
  .limit(1)
  .get();
```

### 8.6 Environment Variables

```bash
# Cloud Run environment variables (never in code, never in logs)
GEMINI_API_KEY=              # AI service only
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=        # Admin SDK — backend only
FIREBASE_CLIENT_EMAIL=       # Admin SDK — backend only
TRANSLATE_API_KEY=           # AI service only
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
FRONTEND_URL=                # CORS allowlist
NODE_ENV=production
```

---

## 9. Rate Limiting

Full rate limit table across all endpoints:

| Endpoint | Window | Max | Key | Reason |
|---|---|---|---|---|
| POST /tickets | 1 hour | 5 | IP | Spam prevention |
| GET /tickets/:id | 1 min | 30 | IP | Enumeration prevention |
| POST /ai/classify | 1 min | 10 | User/IP | Gemini quota |
| POST /tickets/:id/reopen | 7 days | 1 | User+TicketId | Ghost spam |
| POST /tickets/:id/upvote | 24 hours | 1 | User+TicketId | Vote manipulation |
| POST /tickets/:id/query | 1 hour | 10 | User/IP | Gemini quota |
| POST /verify | 24 hours | 3 | User | XP farming |
| POST /auth/login | 15 min | 5 | IP | Brute force |
| POST /staff/officers | 1 hour | 20 | Admin UID | Batch abuse |
| GET /predictions | 1 min | 20 | IP | Scraping |

---

## 10. Database Schema

### 10.1 Firestore Collections Summary

| Collection | Purpose | Write Permission | Read Permission |
|---|---|---|---|
| `tickets` | All civic issue tickets | Anyone (create), Officer/Admin (update) | Public (masked fields) |
| `ticket_logs` | Append-only audit trail | Server only | Public |
| `officers` | Officer profiles + metrics | Admin only | Admin only |
| `departments` | Department config | Admin only | Officer + Admin |
| `gamification` | XP, badges, streaks | Citizen (own) + Server | Public |
| `predictions` | AI-predicted issues | Server only | Public |
| `users` | Citizen profiles | Citizen (own) | Citizen (own) + Admin |
| `queries` | Ticket query inbox | Citizen (create) | Officer (own) + Admin |
| `ward_reports` | Monthly reports | Server only | Officer + Admin |
| `overrides` | Override log | Server only | Admin |

### 10.2 Denormalization Strategy

To avoid expensive joins in Firestore:
- `assignedOfficerName` and `departmentName` stored on ticket document
- `activeCaseCount` maintained as counter on officer document (incremented on assign, decremented on resolve)
- `resolutionRate` recalculated and written to officer doc on each resolution
- Ward-level stats cached in a `ward_stats` collection, updated by background worker

---

## 11. API Contract

### 11.1 Create Ticket
```
POST /api/tickets
Content-Type: multipart/form-data
Authorization: (optional — anonymous allowed)

Body:
  photo: File
  issueType: string
  category: string
  severity: number (1-10)
  dangerLevel: "safe"|"moderate"|"critical"
  departmentId: string
  description: string (max 500 chars)
  lat: number
  lng: number
  ward: string
  city: string

Response 201:
{
  "ticketId": "KOL-2026-00142",
  "status": "UNASSIGNED",
  "slaDeadline": "2026-07-01T14:00:00Z",
  "trackUrl": "https://community-hero.app/track/KOL-2026-00142"
}

Errors:
  400 — validation failed
  429 — rate limit exceeded
  500 — server error
```

### 11.2 Get AI Classification
```
POST /api/ai/classify
Content-Type: multipart/form-data
Authorization: (optional)

Body:
  photo: File
  lat: number
  lng: number
  ward: string
  timeOfDay: "morning"|"afternoon"|"evening"|"night"
  season: "monsoon"|"summer"|"winter"
  nearby: "school"|"hospital"|"highway"|"residential"|"none"

Response 200:
{
  "issueType": "pothole",
  "category": "Infrastructure",
  "severity": 7,
  "dangerLevel": "moderate",
  "departmentId": "roads_infrastructure",
  "description": "Large pothole on main road near market area",
  "confidence": 89,
  "aiNotes": "Moderate confidence — image partially obscured"
}

Note: All fields are suggestions. Client must allow editing before submitting.
```

### 11.3 Assign Officer
```
PATCH /api/tickets/:id/assign
Authorization: Bearer [admin JWT]

Body:
{
  "officerId": "officer_firebase_uid",
  "internalNote": "Urgent — near school zone"
}

Response 200:
{
  "ticketId": "KOL-2026-00142",
  "status": "ASSIGNED",
  "assignedOfficer": {
    "name": "Rajesh Kumar",
    "department": "Roads & Infrastructure",
    "designation": "Junior Engineer"
  },
  "slaDeadline": "2026-07-01T14:00:00Z"
}
```

### 11.4 Submit Resolution
```
POST /api/tickets/:id/resolution
Content-Type: multipart/form-data
Authorization: Bearer [officer JWT]

Body:
  photo: File
  note: string (optional)

Response 200 (approved):
{
  "status": "RESOLVED",
  "geminiValidation": {
    "sameLocation": true,
    "issueResolved": true,
    "confidence": 91
  },
  "beforePhotoUrl": "...",
  "afterPhotoUrl": "..."
}

Response 422 (rejected):
{
  "status": "RESOLUTION_REJECTED",
  "geminiValidation": {
    "sameLocation": true,
    "issueResolved": false,
    "confidence": 44,
    "rejectionReason": "Issue still visible in resolution photo"
  },
  "retriesRemaining": 2
}
```

---

## 12. Scalability Plan

This is the core of the architecture. Every component has a zero-code-change upgrade path.

### 12.1 Hackathon Setup (Day 1 → Free Tier)

```
Cloud Run (Starter Tier)    → Single instance, 2 app limit, free
Firebase Spark Plan         → 50k reads/day, 20k writes/day, 1GB, free
Gemini 2.0 Flash            → 1,500 req/day, 15 req/min, free
OpenStreetMap               → Free, unlimited
Google Translate            → $300 free trial credit
FCM                         → Free, unlimited
Twilio WhatsApp sandbox     → Free, limited to approved numbers
```

### 12.2 Stage 1: City Scale (10k–100k users/month)

**What breaks first:** Gemini free tier (1,500 req/day), Firestore write limits

**Fixes:**
- Upgrade Gemini to paid tier (~$0.075/1M tokens, Gemini 2.0 Flash)
- Add Gemini response caching: same image hash → return cached classification (Redis on Cloud Run)
- Upgrade Firebase to Blaze (pay-as-you-go) — Firestore scales automatically
- Cloud Run: enable min-instances=1 to eliminate cold starts
- Add Cloud CDN for static React bundle

```
Estimated monthly cost at 10k users: ~$20–40
```

### 12.3 Stage 2: Multi-City Scale (100k–1M users/month)

**What breaks:** Single Cloud Run instance, in-memory rate limiting, sequential ticket IDs

**Fixes:**
- Split monorepo into separate Cloud Run services per microservice
- Replace in-memory rate limiter with Cloud Memorystore (Redis)
- Replace sequential ID counter with Firebase atomic increment or Cloud Firestore distributed counter
- Background workers → Cloud Tasks (proper job queue with retries, backoff, dead letter)
- WhatsApp → WhatsApp Business API (direct, not Twilio sandbox)
- Add Cloud Monitoring + alerting on Gemini error rate and Firestore latency

```
Architecture change:
Cloud Run (API GW) → Cloud Run (Ticket Svc) + Cloud Run (AI Svc) + Cloud Run (Notify Svc)
In-memory rate limiter → Cloud Memorystore (Redis)
setInterval workers → Cloud Tasks + Cloud Scheduler
```

### 12.4 Stage 3: National Scale (1M+ users/month)

**What breaks:** Firestore at high write throughput (hotspot on high-traffic wards)

**Fixes:**
- Firestore → geohash-sharded writes to avoid hotspot documents
- Add Cloud Bigtable for time-series analytics (prediction model training data)
- CDN for map tiles (cache OpenStreetMap tiles on Cloud CDN)
- Gemini: use Vertex AI (Google's enterprise Gemini) for SLA guarantees and higher quotas
- Multi-region Cloud Run deployment (asia-south1 for India, with global load balancer)
- Firebase Auth → Cloud Identity Platform (enterprise SSO for government officers)
- Add Cloud Armor (DDoS protection, WAF)

```
Estimated monthly cost at 1M users: ~$800–2000
```

### 12.5 Scalability Summary Table

| Component | Hackathon | City Scale | Multi-City | National |
|---|---|---|---|---|
| Compute | Cloud Run Starter | Cloud Run Paid | Cloud Run (per svc) | Cloud Run Multi-region |
| Database | Firestore Spark | Firestore Blaze | Firestore Blaze | Firestore + Bigtable |
| AI | Gemini Free | Gemini Paid | Gemini Paid | Vertex AI |
| Queue | setInterval | setInterval | Cloud Tasks | Cloud Tasks |
| Cache | None | Redis (Memorystore) | Redis | Redis Cluster |
| Rate limit | express-rate-limit | Redis-backed | Redis-backed | Cloud Armor |
| Maps | OpenStreetMap | OpenStreetMap | OpenStreetMap | OSM + CDN tiles |
| Auth | Firebase Auth | Firebase Auth | Firebase Auth | Cloud Identity |
| Monitoring | None | Cloud Monitoring | Cloud Monitoring | Cloud Monitoring + Trace |

### 12.6 Why This Stack Scales

- **Firestore** scales horizontally with no sharding config needed at City Scale
- **Cloud Run** scales to zero (free when idle) and to 1000 instances automatically
- **Firebase Auth** handles millions of auth tokens with zero config
- **Gemini API** has no hard cap on paid tier — just cost
- **No self-managed infrastructure** — zero servers to patch, update, or maintain
- **All Google Cloud** — deep integration, single billing account, shared IAM

---

## 13. Cost Analysis

### 13.1 Hackathon (Free)

| Service | Usage | Cost |
|---|---|---|
| Google AI Studio / Cloud Run | 2 apps, Starter Tier | $0 |
| Gemini 2.0 Flash | <1,500 req/day | $0 |
| Firebase Spark | <50k reads, <20k writes/day | $0 |
| Firebase Storage | <5GB | $0 |
| FCM | Unlimited | $0 |
| OpenStreetMap | Unlimited | $0 |
| Google Translate | <$300 credit | $0 |
| Twilio WhatsApp sandbox | Dev testing | $0 |
| **Total** | | **$0** |

### 13.2 Production Estimates

| Scale | Users/Month | Est. Monthly Cost |
|---|---|---|
| City pilot | 10,000 | $20–40 |
| Medium city | 100,000 | $150–300 |
| Large city | 500,000 | $500–900 |
| National | 1,000,000+ | $800–2,000 |

---

## 14. Hackathon vs Production Comparison

| Concern | Hackathon Approach | Production Upgrade |
|---|---|---|
| Rate limiting store | In-memory (resets on restart) | Redis (Cloud Memorystore) |
| Job queue | `setInterval` in Cloud Run | Cloud Tasks + Cloud Scheduler |
| WhatsApp | Twilio sandbox (approved numbers only) | Twilio Business API |
| Gemini quota | Free tier (1,500/day) | Paid tier, response caching |
| Multi-region | Single region (asia-south1) | Multi-region + Cloud Load Balancer |
| Monitoring | Console logs | Cloud Monitoring + Uptime checks |
| Maps | OpenStreetMap (stays same) | OpenStreetMap + CDN tile cache |
| DDoS protection | Cloud Run basic | Cloud Armor WAF |
| Officer auth | Firebase custom claims | Cloud Identity Platform |
| Analytics | Firestore queries | BigQuery export + Looker Studio |
| Secrets | Cloud Run env vars | Secret Manager |

---

*Community Hero — System Design Document v1.0*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
