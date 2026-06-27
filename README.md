# Community Hero

**AI-powered civic issue reporting and resolution platform — built for Kolkata, designed for India.**

Live → [community-hero-fc07d.appspot.com](https://community-hero-fc07d.appspot.com)

---

## What it does

Community Hero lets citizens photograph a civic problem — a pothole, garbage dump, waterlogging, broken streetlight — and submit it in under 60 seconds. The platform then takes over: an AI agent classifies the issue, assigns it to the right officer, enforces a deadline, and sends the citizen WhatsApp updates at every stage. If the deadline is missed, an RTI application files itself.

No helpline queues. No ward office visits. Every complaint on the public record.

---

## Key Features

### For Citizens
- **Photo-first reporting** — upload a photo; Gemini AI verifies it matches the reported issue type and extracts GPS location
- **AI severity scoring** — issue scored 1–10, routed to the correct department automatically
- **Real-time public tracking** — anyone can follow a ticket by ID, no login required
- **WhatsApp notifications** — get updates at every stage (assigned, in progress, resolved) on your mobile number
- **Community verification** — neighbours can corroborate issues; 10+ corroborations trigger priority escalation
- **Duplicate detection** — AI prevents the same issue from being filed multiple times
- **Autonomous RTI** — after 30 days of inaction the platform generates and logs a Right to Information application
- **Multilingual** — full interface in English, Hindi, and Bengali via Google Cloud Translate

### For Officers
- **Assignment queue** — all assigned tickets with SLA countdown, severity colour-coding, and filter tabs
- **Field workflow** — "Start Work" → navigate to site → submit resolution photo → AI verifies before/after
- **Ghost detection** — Gemini compares before/after photos; fake "resolved" closures are automatically re-opened
- **Accountability score** — officers are scored on resolution rate and SLA compliance

### For Admins
- **Live dashboard** — ward-level metrics, SLA breach rates, department performance
- **Triage agent** — autonomous load-balanced officer assignment with full reasoning logs
- **Predictive insights** — Gemini forecasts recurring civic issues by ward
- **Staff management** — add/deactivate officers, re-run triage on unassigned queue
- **Agent transparency panel** — every AI decision logged with step-by-step reasoning

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Firebase SDK v10 |
| Backend | Node.js 22, Express, Firebase Admin SDK |
| Database | Cloud Firestore (real-time) |
| Auth | Firebase Authentication (email/password + custom claims) |
| Storage | Firebase Storage (photos) |
| AI | Google Gemini 2.5 Flash (classification, verification, prediction) |
| Maps | Google Maps JavaScript API (`@react-google-maps/api`) |
| Translation | Google Cloud Translate API |
| Notifications | Green API (WhatsApp), Nodemailer (Gmail) |
| Hosting | Google App Engine Standard (asia-south1) |

---

## Architecture

```
community-hero/
├── backend/               # Node.js + Express API
│   ├── agents/            # Autonomous AI agents (triage, RTI)
│   ├── config/            # Firebase Admin initialisation
│   ├── middleware/        # Auth, rate limiting
│   ├── routes/            # REST API routes
│   ├── schemas/           # Joi validation schemas
│   ├── seed/              # One-time demo data seeders
│   ├── services/          # Gemini AI, notifications, storage
│   ├── workers/           # Background workers (SLA, ghost, predict, verify)
│   └── server.js          # Express entry point
└── frontend/              # React 18 SPA
    └── src/
        ├── components/    # Shared + domain components
        ├── context/       # Auth + Language context
        ├── hooks/         # Firestore real-time hooks
        ├── pages/         # Citizen / Officer / Admin pages
        └── utils/         # API client, formatters, translations
```

**Single-service deployment:** the backend builds the React app into `backend/public/` and serves it from Express. One App Engine service, one domain, no CORS.

**Background workers** run on `setInterval` inside the App Engine instance (`min_instances: 1` keeps them alive):
- `slaWorker` — checks deadlines every 10 minutes, escalates breached tickets
- `ghostWorker` — re-opens tickets flagged as ghost closures
- `predictWorker` — runs Gemini predictions on ward-level patterns hourly
- `verifyTimeoutWorker` — auto-closes verification-pending tickets after 72h

---

## Local Development

### Prerequisites
- Node.js 20+
- A Firebase project with Firestore, Auth, and Storage enabled
- Google Maps API key
- Gemini API key
- Google Cloud Translate API key

### Setup

```bash
# Clone
git clone https://github.com/atrijopal/community-hero.git
cd community-hero

# Backend
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
node seed/createAuthUsers.js   # Create demo Firebase Auth accounts
node seed/seedOfficers.js      # Seed officer data
npm start                      # Runs on :8080

# Frontend (separate terminal)
cd frontend
cp .env.example .env
# Fill in Firebase config + Maps key
npm install
npm start                      # Runs on :3000, proxies /api → :8080
```

### Environment Variables

**`backend/.env`**
```
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:3000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

GEMINI_API_KEY=
TRANSLATE_API_KEY=

GREEN_API_INSTANCE=
GREEN_API_TOKEN=
GREEN_API_URL=

EMAIL_USER=
EMAIL_PASS=
```

**`frontend/.env`**
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_GOOGLE_MAPS_KEY=
```

---

## Demo

The live instance is pre-loaded with tickets, officers, and AI agent logs from Kolkata.

| Role | Email | Password |
|---|---|---|
| Citizen (demo) | `demo@communityhero.in` | `Demo@123` |
| Officer | `rajesh.kumar@kmc.gov.in` | `Officer@123` |
| Admin | `admin@kmc.gov.in` | `Admin@123` |

Click **Explore Demo** on the landing page to log in instantly as the demo citizen.

---

## Deployment

Deploys to Google App Engine Standard (asia-south1).

```bash
# One-time setup
gcloud auth login
gcloud app create --project=YOUR_PROJECT_ID --region=asia-south1

# Every deploy
.\deploy.ps1
```

`deploy.ps1` builds the React frontend, copies it to `backend/public/`, and runs `gcloud app deploy`. All secrets live in `backend/app.yaml` (gitignored).

---

## License

MIT © Atrijo Pal
