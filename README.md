# Community Hero — Hyperlocal Civic Issue Resolver

A full-stack civic issue reporting and resolution platform with AI-powered classification, ghost detection, RTI auto-generation, and real-time tracking.

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, Tailwind CSS, Firebase SDK, Leaflet, Recharts |
| Backend   | Node.js / Express |
| Database  | Firebase Firestore (real-time) |
| Auth      | Firebase Authentication (custom claims) |
| Storage   | Firebase Storage |
| AI        | Gemini 2.0 Flash (14 touchpoints) |
| Maps      | OpenStreetMap / Leaflet / Nominatim |
| Notify    | Twilio WhatsApp + Nodemailer + FCM |
| PDF       | pdf-lib (RTI Act 2005 documents) |

---

## Quick Start

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google + Email/Password providers
3. Enable **Firestore Database** (production mode)
4. Enable **Storage**
5. Generate a service account key: Project Settings → Service Accounts → Generate new private key
6. Deploy security rules:
   ```bash
   # Install Firebase CLI first
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage:rules
   ```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in .env with your Firebase and API credentials
npm install
npm run seed        # Seeds demo data into Firestore
npm run dev         # Starts on port 8080
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in .env with your Firebase web app config
npm install
npm start           # Starts on port 3000
```

---

## Environment Variables

### `backend/.env`

```
GEMINI_API_KEY=           # Google AI Studio key (server-side only)
FIREBASE_PROJECT_ID=      # Firebase project ID
FIREBASE_PRIVATE_KEY=     # Service account private key (keep \n escapes)
FIREBASE_CLIENT_EMAIL=    # Service account email

# Optional (notifications will be skipped if blank)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
EMAIL_USER=               # Gmail address
EMAIL_PASS=               # Gmail app password (not your login password)

FRONTEND_URL=http://localhost:3000
PORT=8080
NODE_ENV=development
```

### `frontend/.env`

```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

---

## Demo Credentials

After running `npm run seed`, these Firebase Auth accounts need to be created manually (the seed script creates Firestore documents but Firebase Auth requires manual setup for the demo):

| Role    | Email                       | Password      | Note |
|---------|-----------------------------|---------------|------|
| Admin   | admin@kmc.gov.in            | Admin@123     | Set custom claim: `{ admin: true }` |
| Officer | rajesh.kumar@kmc.gov.in     | Officer@123   | Set custom claim: `{ officer: true }` |
| Officer | priya.sharma@kmc.gov.in     | Officer@123   | Set custom claim: `{ officer: true }` |
| Citizen | (Google Sign-In)            | —             | Any Google account |

**Setting Admin Custom Claim** (run once in Firebase console or via backend):
```bash
# POST http://localhost:8080/api/auth/set-admin
# Body: { "uid": "your-firebase-uid", "secret": "ADMIN_SECRET_KEY" }
```

Or via Firebase Admin SDK:
```js
admin.auth().setCustomUserClaims(uid, { admin: true });
```

---

## Demo Script

1. **Landing page** — Live stats, community map with seeded tickets, ticket tracker form
2. **Report a civic issue**
   - Sign in with Google → `/citizen/report`
   - Upload photo → AI classifies issue, suggests type/severity/department
   - Pick location on map → GPS or click
   - Submit → ticket created with `KOL-2026-XXXXX` ID
3. **Public Tracker** — Visit `/track/KOL-2026-00149` — open manhole, severity 9
4. **Admin Dashboard** — `/admin/unassigned` — assign Rajesh Kumar to ticket
5. **Officer Queue** — `/officer/queue` — officer sees assignment, updates status to IN_PROGRESS
6. **Resolution Upload** — Officer submits resolution photo → Gemini validates before/after
7. **Ghost Detection** — Visit `/track/KOL-2026-00138` → trigger ghost report
8. **RTI Filed** — Visit `/track/KOL-2026-00101` — 33-day-old ticket, RTI auto-generated
9. **QueryBot** — Ask "When will this be fixed?" on any ticket page
10. **Leaderboard** — `/citizen/leaderboard` — gamification with XP and badges

---

## Architecture

```
community-hero/
├── backend/
│   ├── config/          # Firebase Admin, constants
│   ├── middleware/       # Auth, rate limiting, validation, upload
│   ├── routes/          # tickets, staff, auth, ai, analytics
│   ├── services/        # Gemini AI, storage, geocode, notify, PDF
│   ├── prompts/         # All 8 Gemini prompt templates
│   ├── workers/         # SLA, ghost, predict, verify timeout
│   └── seed/            # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── components/  # Shared + citizen + officer components
│   │   ├── pages/       # Landing, tracker, citizen, officer, admin
│   │   ├── hooks/       # useTicket, useAuth, useGamification, etc.
│   │   ├── utils/       # api, constants, formatters
│   │   └── context/     # AuthContext
├── firestore.rules
└── storage.rules
```

## AI Touchpoints (14 total, all via Gemini 2.0 Flash)

| # | Function | Trigger |
|---|----------|---------|
| 1 | `classifyIssue` | Photo upload during report |
| 2 | `detectDuplicate` | New ticket submission |
| 3 | `validateResolution` | Officer submits resolution photo |
| 4 | `detectGhost` | Ghost worker (6-hourly, proximity check) |
| 5 | `queryBot` | Citizen asks question on ticket page |
| 6 | `generateRTI` | SLA worker at day 30 |
| 7 | `generateWardReport` | Admin exports ward report |
| 8 | `predictIssues` | Predict worker (daily, per ward) |

**Function Calling**: QueryBot uses Gemini function calling with 4 tools:
- `get_ticket_details` — current ticket state
- `get_sla_status` — SLA and deadline info
- `get_officer_status` — assigned officer workload
- `get_resolution_estimate` — historical resolution time for this issue type

## Security

- Gemini API key is server-side only (never in frontend or API responses)
- EXIF/GPS stripped from all uploaded photos via sharp
- Private fields (`citizenPhone`, `citizenEmail`, `internalNotes`) never in public API
- CORS restricted to `FRONTEND_URL` only
- Rate limits: 5 reports/hr per IP, 10 AI calls/min per user, 5 auth/15min per IP
- Custom JWT claims for role-based access (admin / officer / citizen)
- Ticket IDs use salted doc IDs to prevent enumeration
