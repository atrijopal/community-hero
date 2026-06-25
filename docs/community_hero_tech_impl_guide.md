# Technical Implementation Guide
## Community Hero — Hyperlocal Problem Solver
**Version:** 1.0 (Hackathon Build)
**Date:** June 2026
**Deadline:** 29 June 2026, 2:00 PM
**Platform:** Google AI Studio + Firebase + Cloud Run

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Firebase Setup](#4-firebase-setup)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Backend Implementation](#6-backend-implementation)
7. [Gemini Integration](#7-gemini-integration)
8. [Background Workers](#8-background-workers)
9. [Maps Integration](#9-maps-integration)
10. [Notification System](#10-notification-system)
11. [Security Implementation](#11-security-implementation)
12. [Deployment to Google AI Studio](#12-deployment-to-google-ai-studio)
13. [Build Day Checklist](#13-build-day-checklist)
14. [Hackathon Submission Checklist](#14-hackathon-submission-checklist)

---

## 1. Project Setup

### 1.1 Prerequisites

```bash
node --version    # v18+ required
npm --version     # v9+
git --version
```

Install Firebase CLI and Google Cloud SDK:
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### 1.2 Initialize Project

```bash
mkdir community-hero && cd community-hero
git init

# Frontend
npx create-react-app frontend --template cra-template
cd frontend
npm install \
  firebase \
  leaflet react-leaflet \
  react-router-dom \
  axios \
  tailwindcss \
  @headlessui/react \
  react-hot-toast \
  date-fns \
  react-dropzone \
  recharts

# Backend
cd ..
mkdir backend && cd backend
npm init -y
npm install \
  express \
  cors \
  helmet \
  express-rate-limit \
  firebase-admin \
  multer \
  sharp \
  joi \
  dotenv \
  node-fetch \
  pdf-lib \
  nodemailer \
  twilio \
  ngeohash

npm install -D nodemon
```

### 1.3 Tailwind Setup

```bash
cd frontend
npx tailwindcss init -p
```

`frontend/tailwind.config.js`:
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1A73E8',
        danger:  '#EA4335',
        success: '#34A853',
        warning: '#FBBC04',
      }
    }
  },
  plugins: [],
}
```

---

## 2. Folder Structure

```
community-hero/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── firebase-messaging-sw.js     ← FCM service worker
│   └── src/
│       ├── index.js
│       ├── App.jsx                      ← root router
│       ├── firebase.js                  ← Firebase client init
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── NotificationPanel.jsx
│       │   │   ├── PhotoViewer.jsx
│       │   │   ├── TicketCard.jsx
│       │   │   ├── StatusBadge.jsx
│       │   │   ├── LoadingSpinner.jsx
│       │   │   └── ConfirmModal.jsx
│       │   ├── citizen/
│       │   │   ├── ReportFlow/
│       │   │   │   ├── Step1Photo.jsx
│       │   │   │   ├── Step2AIReview.jsx
│       │   │   │   ├── Step3Location.jsx
│       │   │   │   ├── Step4Contact.jsx
│       │   │   │   └── Step5Submit.jsx
│       │   │   ├── TicketDetail/
│       │   │   │   ├── TimelineTab.jsx
│       │   │   │   ├── OfficerTab.jsx
│       │   │   │   ├── PhotosTab.jsx
│       │   │   │   ├── AskTab.jsx
│       │   │   │   └── ActionsTab.jsx
│       │   │   └── Gamification/
│       │   │       ├── XPBar.jsx
│       │   │       ├── BadgeGrid.jsx
│       │   │       └── ImpactCard.jsx
│       │   ├── officer/
│       │   │   ├── QueueCard.jsx
│       │   │   ├── ResolutionUpload.jsx
│       │   │   ├── OverrideRequest.jsx
│       │   │   └── QueryReply.jsx
│       │   └── admin/
│       │       ├── AssignmentDropdown.jsx
│       │       ├── OfficerForm.jsx
│       │       ├── DepartmentCard.jsx
│       │       └── PredictionCard.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── PublicTracker.jsx
│       │   ├── citizen/
│       │   │   ├── CitizenHome.jsx
│       │   │   ├── ReportPage.jsx
│       │   │   ├── MyTickets.jsx
│       │   │   ├── TicketDetailPage.jsx
│       │   │   ├── MapPage.jsx
│       │   │   ├── Leaderboard.jsx
│       │   │   └── Profile.jsx
│       │   ├── officer/
│       │   │   ├── OfficerDashboard.jsx
│       │   │   ├── MyQueue.jsx
│       │   │   ├── TicketDetailPage.jsx
│       │   │   ├── ResolvedCases.jsx
│       │   │   ├── QueriesInbox.jsx
│       │   │   └── Performance.jsx
│       │   └── admin/
│       │       ├── AdminOverview.jsx
│       │       ├── UnassignedQueue.jsx
│       │       ├── AllTickets.jsx
│       │       ├── StaffManagement.jsx
│       │       ├── WardMap.jsx
│       │       ├── Reports.jsx
│       │       ├── Predictions.jsx
│       │       └── SystemSettings.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useTicket.js
│       │   ├── useOfficers.js
│       │   ├── useNotifications.js
│       │   └── useGamification.js
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── NotificationContext.jsx
│       └── utils/
│           ├── api.js                   ← axios instance
│           ├── formatters.js
│           ├── constants.js
│           └── geohash.js
├── backend/
│   ├── server.js                        ← Express entry point
│   ├── routes/
│   │   ├── tickets.js
│   │   ├── auth.js
│   │   ├── staff.js
│   │   ├── ai.js
│   │   └── notify.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── validate.js
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── firebaseService.js
│   │   ├── notifyService.js
│   │   ├── storageService.js
│   │   └── pdfService.js
│   ├── workers/
│   │   ├── slaWorker.js
│   │   ├── ghostWorker.js
│   │   ├── predictWorker.js
│   │   └── verifyTimeoutWorker.js
│   ├── prompts/
│   │   ├── classify.js
│   │   ├── validateResolution.js
│   │   ├── detectGhost.js
│   │   ├── detectDuplicate.js
│   │   ├── queryBot.js
│   │   ├── generateRTI.js
│   │   ├── generateReport.js
│   │   └── predictIssues.js
│   ├── schemas/
│   │   ├── ticketSchema.js
│   │   ├── officerSchema.js
│   │   └── overrideSchema.js
│   └── config/
│       ├── firebase.js                  ← Admin SDK init
│       └── constants.js
├── firestore.rules
├── storage.rules
├── .env                                 ← never commit
├── .env.example                         ← commit this
├── .gitignore
└── README.md
```

---

## 3. Environment Configuration

### 3.1 `.env` (never commit)

```bash
# Backend — server-side only
GEMINI_API_KEY=AIza...
FIREBASE_PROJECT_ID=community-hero-xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@community-hero.iam.gserviceaccount.com
TRANSLATE_API_KEY=AIza...
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=https://community-hero-xxx.run.app
NODE_ENV=production
PORT=8080

# Frontend (.env in /frontend)
REACT_APP_API_URL=https://community-hero-xxx.run.app/api
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=community-hero-xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=community-hero-xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=community-hero-xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
```

### 3.2 `.env.example` (commit this)

```bash
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
TRANSLATE_API_KEY=your_translate_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=https://your-app.run.app
NODE_ENV=production
PORT=8080
```

### 3.3 `.gitignore`

```
node_modules/
.env
.env.local
build/
dist/
*.log
.firebase/
serviceAccountKey.json
```

---

## 4. Firebase Setup

### 4.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create project: `community-hero`
3. Enable: **Firestore**, **Authentication**, **Storage**, **Cloud Messaging**
4. Firestore: Start in **production mode** (rules added below)
5. Auth: Enable **Google Sign-In** + **Email/Password**
6. Storage: Start in **production mode**

### 4.2 Firebase Client Init (`frontend/src/firebase.js`)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app       = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const messaging = getMessaging(app);
export const googleProvider = new GoogleAuthProvider();
```

### 4.3 Firebase Admin SDK Init (`backend/config/firebase.js`)

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

const db      = admin.firestore();
const storage = admin.storage();
const auth    = admin.auth();

module.exports = { admin, db, storage, auth };
```

### 4.4 Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    function isOfficer() {
      return request.auth != null &&
        (request.auth.token.officer == true ||
         request.auth.token.senior_officer == true);
    }
    function isSeniorOfficer() {
      return request.auth != null &&
        request.auth.token.senior_officer == true;
    }
    function isAuthenticated() {
      return request.auth != null;
    }
    function isAssignedOfficer(ticketId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/tickets/$(ticketId))
          .data.assignedOfficerId == request.auth.uid;
    }
    function isTicketOwner(ticketId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/tickets/$(ticketId))
          .data.citizenId == request.auth.uid;
    }

    match /tickets/{ticketId} {
      allow read: if true;
      allow create: if request.resource.data.keys()
        .hasNone(['internalNotes', 'assignedOfficerId', 'overrideCount',
                  'ghostCount', 'accountabilityScore']);
      allow update: if isAssignedOfficer(ticketId) || isAdmin() || isSeniorOfficer();
      allow delete: if false;
    }

    match /ticket_logs/{logId} {
      allow read: if true;
      allow write: if false;
    }

    match /officers/{officerId} {
      allow read: if isAdmin() || isOfficer();
      allow write: if isAdmin();
    }

    match /departments/{deptId} {
      allow read: if isOfficer() || isAdmin();
      allow write: if isAdmin();
    }

    match /gamification/{citizenId} {
      allow read: if true;
      allow write: if (isAuthenticated() &&
        request.auth.uid == citizenId) || isAdmin();
    }

    match /predictions/{predId} {
      allow read: if true;
      allow write: if false;
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /queries/{queryId} {
      allow read: if isAssignedOfficer(resource.data.ticketId) || isAdmin();
      allow create: if true;
      allow update: if isAssignedOfficer(resource.data.ticketId) || isAdmin();
    }

    match /ward_reports/{reportId} {
      allow read: if isOfficer() || isAdmin();
      allow write: if false;
    }
  }
}
```

### 4.5 Firebase Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tickets/{ticketId}/report/{file} {
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow read: if true;
    }
    match /tickets/{ticketId}/resolution/{file} {
      allow write: if request.auth != null
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
      allow read: if request.auth.token.admin == true
        || request.auth.token.officer == true;
      allow write: if false;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 5. Frontend Implementation

### 5.1 App Router (`frontend/src/App.jsx`)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Pages
import Landing        from './pages/Landing';
import PublicTracker  from './pages/PublicTracker';

// Citizen
import CitizenHome    from './pages/citizen/CitizenHome';
import ReportPage     from './pages/citizen/ReportPage';
import MyTickets      from './pages/citizen/MyTickets';
import MapPage        from './pages/citizen/MapPage';
import Leaderboard    from './pages/citizen/Leaderboard';
import Profile        from './pages/citizen/Profile';

// Officer
import OfficerDashboard from './pages/officer/OfficerDashboard';
import MyQueue          from './pages/officer/MyQueue';
import QueriesInbox     from './pages/officer/QueriesInbox';
import Performance      from './pages/officer/Performance';

// Admin
import AdminOverview    from './pages/admin/AdminOverview';
import UnassignedQueue  from './pages/admin/UnassignedQueue';
import AllTickets       from './pages/admin/AllTickets';
import StaffManagement  from './pages/admin/StaffManagement';
import WardMap          from './pages/admin/WardMap';
import Reports          from './pages/admin/Reports';
import Predictions      from './pages/admin/Predictions';
import SystemSettings   from './pages/admin/SystemSettings';

const RoleGuard = ({ children, role }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (role && userRole !== role) return <Navigate to="/unauthorized" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<Landing />} />
          <Route path="/track/:id"  element={<PublicTracker />} />

          {/* Citizen */}
          <Route path="/citizen"            element={<RoleGuard><CitizenHome /></RoleGuard>} />
          <Route path="/citizen/report"     element={<RoleGuard><ReportPage /></RoleGuard>} />
          <Route path="/citizen/tickets"    element={<RoleGuard><MyTickets /></RoleGuard>} />
          <Route path="/citizen/tickets/:id" element={<RoleGuard><TicketDetailPage role="citizen" /></RoleGuard>} />
          <Route path="/citizen/map"        element={<RoleGuard><MapPage /></RoleGuard>} />
          <Route path="/citizen/leaderboard" element={<RoleGuard><Leaderboard /></RoleGuard>} />
          <Route path="/citizen/profile"    element={<RoleGuard><Profile /></RoleGuard>} />

          {/* Officer */}
          <Route path="/officer"            element={<RoleGuard role="officer"><OfficerDashboard /></RoleGuard>} />
          <Route path="/officer/queue"      element={<RoleGuard role="officer"><MyQueue /></RoleGuard>} />
          <Route path="/officer/queue/:id"  element={<RoleGuard role="officer"><TicketDetailPage role="officer" /></RoleGuard>} />
          <Route path="/officer/queries"    element={<RoleGuard role="officer"><QueriesInbox /></RoleGuard>} />
          <Route path="/officer/performance" element={<RoleGuard role="officer"><Performance /></RoleGuard>} />

          {/* Admin */}
          <Route path="/admin"              element={<RoleGuard role="admin"><AdminOverview /></RoleGuard>} />
          <Route path="/admin/unassigned"   element={<RoleGuard role="admin"><UnassignedQueue /></RoleGuard>} />
          <Route path="/admin/tickets"      element={<RoleGuard role="admin"><AllTickets /></RoleGuard>} />
          <Route path="/admin/staff"        element={<RoleGuard role="admin"><StaffManagement /></RoleGuard>} />
          <Route path="/admin/map"          element={<RoleGuard role="admin"><WardMap /></RoleGuard>} />
          <Route path="/admin/reports"      element={<RoleGuard role="admin"><Reports /></RoleGuard>} />
          <Route path="/admin/predictions"  element={<RoleGuard role="admin"><Predictions /></RoleGuard>} />
          <Route path="/admin/settings"     element={<RoleGuard role="admin"><SystemSettings /></RoleGuard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 5.2 Auth Context (`frontend/src/context/AuthContext.jsx`)

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        const role = token.claims.admin   ? 'admin'
                   : token.claims.officer ? 'officer'
                   : 'citizen';
        setUser(firebaseUser);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 5.3 API Utility (`frontend/src/utils/api.js`)

```javascript
import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach Firebase JWT to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 5.4 Report Flow — Step 2 AI Review (`frontend/src/components/citizen/ReportFlow/Step2AIReview.jsx`)

```jsx
import { useState } from 'react';

const AI_BADGE = () => (
  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
    ✦ AI suggested
  </span>
);

export default function Step2AIReview({ aiData, onConfirm }) {
  const [form, setForm] = useState({
    issueType:   aiData.issueType   || '',
    category:    aiData.category    || '',
    severity:    aiData.severity    || 5,
    dangerLevel: aiData.dangerLevel || 'moderate',
    departmentId: aiData.departmentId || '',
    description: aiData.description || '',
  });

  const [edited, setEdited] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setEdited(prev => ({ ...prev, [field]: true }));
  };

  const lowConfidence = aiData.confidence < 50;

  return (
    <div className="space-y-6">
      {lowConfidence && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ AI confidence is low ({aiData.confidence}%). Please review all fields carefully.
        </div>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type {!edited.issueType && <AI_BADGE />}
        </label>
        <select
          value={form.issueType}
          onChange={e => handleChange('issueType', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          {ISSUE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          AI suggested this based on your photo. Change it if needed.
        </p>
      </div>

      {/* Severity Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Severity: {form.severity}/10 {!edited.severity && <AI_BADGE />}
        </label>
        <input
          type="range" min="1" max="10"
          value={form.severity}
          onChange={e => handleChange('severity', parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Minor</span><span>Moderate</span><span>Critical</span>
        </div>
        {form.severity >= 9 && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
            ⚠️ Critical issue — will be fast-tracked to senior officer queue.
          </div>
        )}
      </div>

      {/* Danger Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Danger Level {!edited.dangerLevel && <AI_BADGE />}
        </label>
        <div className="flex gap-4">
          {['safe', 'moderate', 'critical'].map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={level}
                checked={form.dangerLevel === level}
                onChange={() => handleChange('dangerLevel', level)}
                className="accent-blue-600"
              />
              <span className="capitalize text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description {!edited.description && <AI_BADGE />}
        </label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {form.description.length}/500
        </p>
      </div>

      <button
        onClick={() => onConfirm(form)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Confirm & Continue →
      </button>
    </div>
  );
}

const ISSUE_TYPES = [
  { value: 'pothole',          label: '🕳️ Pothole' },
  { value: 'damaged_road',     label: '🛣️ Damaged Road' },
  { value: 'open_manhole',     label: '⚠️ Open Manhole' },
  { value: 'waterlogging',     label: '🌊 Waterlogging' },
  { value: 'garbage',          label: '🗑️ Garbage Dump' },
  { value: 'broken_light',     label: '💡 Broken Streetlight' },
  { value: 'sewage_overflow',  label: '💧 Sewage Overflow' },
  { value: 'exposed_wire',     label: '⚡ Exposed Wire' },
  { value: 'fallen_tree',      label: '🌳 Fallen Tree' },
  { value: 'water_leakage',    label: '🚿 Water Leakage' },
  { value: 'broken_signal',    label: '🚦 Broken Signal' },
  { value: 'other',            label: '📋 Other' },
];
```

### 5.5 Real-Time Ticket Listener Hook (`frontend/src/hooks/useTicket.js`)

```javascript
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

export const useTicket = (ticketPublicId) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketPublicId) return;

    const q = query(
      collection(db, 'tickets'),
      where('publicId', '==', ticketPublicId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        // Never expose internalNotes to client
        const { internalNotes, ...publicData } = data;
        setTicket({ id: doc.id, ...publicData });
      }
      setLoading(false);
    });

    return unsub;
  }, [ticketPublicId]);

  return { ticket, loading };
};

export const useMyTickets = (citizenId) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citizenId) return;

    const q = query(
      collection(db, 'tickets'),
      where('citizenId', '==', citizenId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [citizenId]);

  return { tickets, loading };
};
```

---

## 6. Backend Implementation

### 6.1 Express Server (`backend/server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const ticketRoutes = require('./routes/tickets');
const authRoutes   = require('./routes/auth');
const staffRoutes  = require('./routes/staff');
const aiRoutes     = require('./routes/ai');

const { authMiddleware } = require('./middleware/authMiddleware');
const { rateLimiters }   = require('./middleware/rateLimiter');

// Start background workers
require('./workers/slaWorker').start();
require('./workers/ghostWorker').start();
require('./workers/predictWorker').start();
require('./workers/verifyTimeoutWorker').start();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check (Cloud Run requirement)
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/tickets', rateLimiters.general, ticketRoutes);
app.use('/api/auth',    rateLimiters.auth,    authMiddleware, authRoutes);
app.use('/api/staff',   rateLimiters.general, authMiddleware, staffRoutes);
app.use('/api/ai',      rateLimiters.ai,      aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 6.2 Ticket Routes (`backend/routes/tickets.js`)

```javascript
const router  = require('express').Router();
const multer  = require('multer');
const { db, storage } = require('../config/firebase');
const gemini  = require('../services/geminiService');
const notify  = require('../services/notifyService');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const { ticketSchema } = require('../schemas/ticketSchema');
const { processPhoto } = require('../services/storageService');
const { rateLimiters } = require('../middleware/rateLimiter');
const ngeohash = require('ngeohash');
const crypto = require('crypto');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/tickets — create ticket
router.post('/', rateLimiters.report, optionalAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data);
    const { error } = ticketSchema.validate(body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (!req.file) return res.status(400).json({ error: 'Photo required' });

    // Process photo (strip EXIF, resize, validate)
    const processedPhoto = await processPhoto(req.file.buffer);

    // Duplicate check
    const geohash = ngeohash.encode(body.location.lat, body.location.lng, 7);
    const dupCheck = await db.collection('tickets')
      .where('location.geohash', '>=', geohash.substring(0, 6))
      .where('location.geohash', '<=', geohash.substring(0, 6) + '\uf8ff')
      .where('issueType', '==', body.issueType)
      .where('status', 'not-in', ['RESOLVED', 'REJECTED', 'CLOSED_OVERRIDE'])
      .limit(3)
      .get();

    if (!dupCheck.empty) {
      const dupResult = await gemini.detectDuplicate(
        processedPhoto,
        dupCheck.docs[0].data().photos.report
      );
      if (dupResult.is_duplicate && dupResult.confidence >= 60) {
        return res.status(409).json({
          duplicate: true,
          existingTicket: {
            publicId: dupCheck.docs[0].data().publicId,
            issueType: dupCheck.docs[0].data().issueType,
            status: dupCheck.docs[0].data().status,
            address: dupCheck.docs[0].data().location.address,
          }
        });
      }
    }

    // Generate ticket ID
    const counter = await getNextSequence(body.location.city);
    const cityCode = CITY_CODES[body.location.city] || 'GEN';
    const year = new Date().getFullYear();
    const seq = String(counter).padStart(5, '0');
    const salt = crypto.randomBytes(3).toString('hex');
    const docId = `${cityCode}-${year}-${seq}-${salt}`;
    const publicId = `${cityCode}-${year}-${seq}`;

    // Upload photo to Firebase Storage
    const photoUrl = await uploadPhoto(processedPhoto, docId, 'report');

    // Compute SLA deadline (default 7 days)
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + 7);

    // Hardcoded severity override for life-safety issues
    let severity = body.severity;
    if (['open_manhole', 'exposed_wire'].includes(body.issueType)) {
      severity = Math.max(severity, 9);
    }

    const ticket = {
      publicId,
      status: 'UNASSIGNED',
      issueType: body.issueType,
      category: body.category,
      severity,
      dangerLevel: body.dangerLevel,
      departmentId: body.departmentId,
      description: body.description,
      citizenDescription: body.description, // stored separately, never goes to AI
      location: {
        geohash,
        lat: body.location.lat,
        lng: body.location.lng,
        ward: body.location.ward,
        city: body.location.city,
        address: body.location.address,
      },
      photos: { report: photoUrl, resolution: null, reopen: [] },
      citizenId: req.user?.uid || null,
      citizenPhone: body.phone || null,
      citizenEmail: body.email || null,
      assignedOfficerId: null,
      assignedOfficerName: null,
      slaDeadline: slaDeadline.toISOString(),
      upvoteCount: 0,
      upvoterIds: [],
      verificationStatus: 'PENDING',
      verifierIds: [],
      ghostWindowOpen: false,
      ghostCount: 0,
      overrideCount: 0,
      reminderSent: false,
      rtiGenerated: false,
      appealGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('tickets').doc(docId).set(ticket);

    // Log creation
    await logAction(docId, req.user?.uid || 'anonymous', 'TICKET_CREATED', null, 'UNASSIGNED');

    // Send confirmation notification
    if (body.phone || body.email) {
      await notify.ticketCreated({ publicId, phone: body.phone, email: body.email });
    }

    // Trigger peer verification (find 3 nearby active citizens)
    triggerPeerVerification(docId, body.location.geohash).catch(console.error);

    res.status(201).json({
      ticketId: publicId,
      status: 'UNASSIGNED',
      slaDeadline: slaDeadline.toISOString(),
      trackUrl: `${process.env.FRONTEND_URL}/track/${publicId}`,
    });
  } catch (err) { next(err); }
});

// GET /api/tickets/:publicId — public ticket view
router.get('/:publicId', async (req, res, next) => {
  try {
    const snap = await db.collection('tickets')
      .where('publicId', '==', req.params.publicId)
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: 'Ticket not found' });

    const data = snap.docs[0].data();
    // Never return internal notes
    const { internalNotes, citizenPhone, citizenEmail, ...publicData } = data;
    res.json(publicData);
  } catch (err) { next(err); }
});

// PATCH /api/tickets/:id/assign — admin assigns officer
router.patch('/:id/assign', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { officerId, internalNote } = req.body;
    if (!officerId) return res.status(400).json({ error: 'officerId required' });

    // Validate officer exists and is active
    const officerDoc = await db.collection('officers').doc(officerId).get();
    if (!officerDoc.exists || officerDoc.data().status !== 'active') {
      return res.status(400).json({ error: 'Officer not found or inactive' });
    }
    const officer = officerDoc.data();

    const ticketRef = db.collection('tickets').doc(req.params.id);
    await ticketRef.update({
      status: 'ASSIGNED',
      assignedOfficerId: officerId,
      assignedOfficerName: officer.name,
      departmentId: officer.departmentId,
      internalNotes: internalNote || '',
      updatedAt: new Date().toISOString(),
    });

    // Increment officer active case count
    await db.collection('officers').doc(officerId).update({
      activeCaseCount: admin.firestore.FieldValue.increment(1),
      totalAssigned: admin.firestore.FieldValue.increment(1),
    });

    await logAction(req.params.id, req.user.uid, 'OFFICER_ASSIGNED', 'UNASSIGNED', 'ASSIGNED', { officerId });

    // Notify officer and citizen
    const ticket = (await ticketRef.get()).data();
    await notify.officerAssigned({ ticket, officer });

    res.json({ status: 'ASSIGNED', assignedOfficer: { name: officer.name, department: officer.departmentId } });
  } catch (err) { next(err); }
});

// POST /api/tickets/:id/resolution — officer uploads proof
router.post('/:id/resolution', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    const ticketRef  = db.collection('tickets').doc(req.params.id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = ticketSnap.data();
    if (ticket.assignedOfficerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not assigned to this ticket' });
    }

    const processedPhoto = await processPhoto(req.file.buffer);
    const resolutionUrl  = await uploadPhoto(processedPhoto, req.params.id, 'resolution');

    // Gemini validates before vs after
    const validation = await gemini.validateResolution(ticket.photos.report, resolutionUrl);

    if (validation.confidence >= 70 && validation.issue_resolved && validation.same_location) {
      // Resolution approved
      const ghostExpiry = new Date();
      ghostExpiry.setDate(ghostExpiry.getDate() + 14);

      await ticketRef.update({
        status: 'RESOLVED',
        'photos.resolution': resolutionUrl,
        resolvedAt: new Date().toISOString(),
        ghostWindowOpen: true,
        ghostWindowExpiry: ghostExpiry.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update officer stats
      await db.collection('officers').doc(req.user.uid).update({
        activeCaseCount: admin.firestore.FieldValue.increment(-1),
        resolvedCount: admin.firestore.FieldValue.increment(1),
      });

      await logAction(req.params.id, req.user.uid, 'RESOLVED', 'IN_PROGRESS', 'RESOLVED');
      await notify.ticketResolved({ ticket, resolutionUrl, beforeUrl: ticket.photos.report });

      return res.json({ status: 'RESOLVED', geminiValidation: validation });
    } else {
      // Resolution rejected
      const retries = (ticket.resolutionRetries || 0) + 1;
      await ticketRef.update({ resolutionRetries: retries, updatedAt: new Date().toISOString() });

      if (retries >= 3) {
        // Auto-escalate to senior officer
        await ticketRef.update({ status: 'ESCALATED' });
        await notify.escalatedAfterFailedResolution({ ticket });
      }

      return res.status(422).json({
        status: 'RESOLUTION_REJECTED',
        geminiValidation: validation,
        retriesRemaining: Math.max(0, 3 - retries),
      });
    }
  } catch (err) { next(err); }
});

// POST /api/tickets/:id/query — NLP bot
router.post('/:id/query', rateLimiters.queryBot, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.length > 300) {
      return res.status(400).json({ error: 'Question required (max 300 chars)' });
    }

    const snap = await db.collection('tickets')
      .where('publicId', '==', req.params.id).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Ticket not found' });

    const { internalNotes, citizenPhone, citizenEmail, ...ticketData } = snap.docs[0].data();
    const answer = await gemini.queryBot(question, ticketData);

    res.json({ answer });
  } catch (err) { next(err); }
});

// POST /api/tickets/:id/upvote
router.post('/:id/upvote', optionalAuth, async (req, res, next) => {
  try {
    const ticketRef = db.collection('tickets').doc(req.params.id);
    const userId = req.user?.uid || req.body.phone || req.body.email;
    if (!userId) return res.status(400).json({ error: 'Login or provide contact to upvote' });

    const ticket = (await ticketRef.get()).data();
    if (ticket.upvoterIds.includes(userId)) {
      return res.status(409).json({ error: 'Already upvoted' });
    }

    await ticketRef.update({
      upvoteCount: admin.firestore.FieldValue.increment(1),
      upvoterIds: admin.firestore.FieldValue.arrayUnion(userId),
    });

    res.json({ upvoteCount: ticket.upvoteCount + 1 });
  } catch (err) { next(err); }
});

// Helper functions
async function getNextSequence(city) {
  const counterRef = db.collection('counters').doc(city);
  const result = await db.runTransaction(async (t) => {
    const doc = await t.get(counterRef);
    const next = (doc.data()?.count || 0) + 1;
    t.set(counterRef, { count: next }, { merge: true });
    return next;
  });
  return result;
}

async function uploadPhoto(buffer, ticketId, type) {
  const bucket = storage.bucket();
  const path   = `tickets/${ticketId}/${type}/${Date.now()}.jpg`;
  const file   = bucket.file(path);
  await file.save(buffer, { contentType: 'image/jpeg' });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

async function logAction(ticketId, actorId, action, prevState, newState, metadata = {}) {
  await db.collection('ticket_logs').add({
    ticketId, actorId, action, previousState: prevState,
    newState, metadata, timestamp: new Date().toISOString(),
  });
}

const CITY_CODES = { Kolkata: 'KOL', Mumbai: 'MUM', Delhi: 'DEL', Bangalore: 'BLR' };

module.exports = router;
```

### 6.3 Rate Limiter (`backend/middleware/rateLimiter.js`)

```javascript
const rateLimit = require('express-rate-limit');

const rateLimiters = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  report: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many reports. Try again in an hour.' },
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  }),
  ai: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
    message: { error: 'AI rate limit reached. Try again shortly.' },
  }),
  queryBot: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
  }),
};

module.exports = { rateLimiters };
```

### 6.4 Auth Middleware (`backend/middleware/authMiddleware.js`)

```javascript
const { auth } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token   = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid:  decoded.uid,
      role: decoded.admin           ? 'admin'
          : decoded.senior_officer  ? 'senior_officer'
          : decoded.officer         ? 'officer'
          : 'citizen',
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token   = header.split('Bearer ')[1];
      const decoded = await auth.verifyIdToken(token);
      req.user = { uid: decoded.uid };
    } catch (_) {}
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
```

### 6.5 Photo Processing (`backend/services/storageService.js`)

```javascript
const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const processPhoto = async (buffer) => {
  // Validate MIME type (not just extension)
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
    throw Object.assign(new Error('Invalid file type. Only JPEG, PNG, WEBP allowed.'), { status: 400 });
  }

  // Resize + strip EXIF (removes GPS metadata)
  const processed = await sharp(buffer)
    .withMetadata(false)              // strips ALL EXIF including GPS
    .resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  return processed;
};

module.exports = { processPhoto };
```

---

## 7. Gemini Integration

### 7.1 Gemini Service (`backend/services/geminiService.js`)

```javascript
const fetch = require('node-fetch');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Quota tracker
const quota = { daily: 0, minute: 0, lastMinuteReset: Date.now() };
const DAILY_LIMIT  = 1400;
const MINUTE_LIMIT = 12;

const checkQuota = () => {
  const now = Date.now();
  if (now - quota.lastMinuteReset > 60000) {
    quota.minute = 0;
    quota.lastMinuteReset = now;
  }
  if (quota.daily   >= DAILY_LIMIT)  throw Object.assign(new Error('Daily AI quota reached'), { status: 429 });
  if (quota.minute  >= MINUTE_LIMIT) throw Object.assign(new Error('AI rate limit'), { status: 429 });
};

const imageToBase64 = async (urlOrBuffer) => {
  if (Buffer.isBuffer(urlOrBuffer)) {
    return { inlineData: { data: urlOrBuffer.toString('base64'), mimeType: 'image/jpeg' } };
  }
  const res    = await fetch(urlOrBuffer);
  const buffer = await res.buffer();
  return { inlineData: { data: buffer.toString('base64'), mimeType: 'image/jpeg' } };
};

const callGemini = async (parts) => {
  checkQuota();
  quota.daily++;
  quota.minute++;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API error: ${err.error?.message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  return JSON.parse(text);
};

// 1. Classify issue from photo
const classifyIssue = async (photoBuffer, context) => {
  const img = await imageToBase64(photoBuffer);
  try {
    return await callGemini([
      { text: require('../prompts/classify')(context) },
      img,
    ]);
  } catch (err) {
    console.error('Gemini classify failed:', err.message);
    return { issueType: '', category: '', severity: 5, dangerLevel: 'moderate',
             departmentId: '', description: '', confidence: 0 };
  }
};

// 2. Validate resolution (before vs after)
const validateResolution = async (beforeUrl, afterUrl) => {
  const [before, after] = await Promise.all([
    imageToBase64(beforeUrl),
    imageToBase64(afterUrl),
  ]);
  return await callGemini([
    { text: require('../prompts/validateResolution')() },
    before, after,
  ]);
};

// 3. Ghost detection (3 images)
const detectGhost = async (newPhotoUrl, originalPhotoUrl, resolutionPhotoUrl) => {
  const [newImg, origImg, resImg] = await Promise.all([
    imageToBase64(newPhotoUrl),
    imageToBase64(originalPhotoUrl),
    imageToBase64(resolutionPhotoUrl),
  ]);
  return await callGemini([
    { text: require('../prompts/detectGhost')() },
    newImg, origImg, resImg,
  ]);
};

// 4. Detect duplicate
const detectDuplicate = async (newPhotoBuffer, existingPhotoUrl) => {
  const [newImg, existImg] = await Promise.all([
    imageToBase64(newPhotoBuffer),
    imageToBase64(existingPhotoUrl),
  ]);
  return await callGemini([
    { text: require('../prompts/detectDuplicate')() },
    newImg, existImg,
  ]);
};

// 5. NLP query bot
const queryBot = async (question, ticketData) => {
  const result = await callGemini([{
    text: require('../prompts/queryBot')(question, ticketData)
  }]);
  return result.answer;
};

// 6. Generate RTI document
const generateRTI = async (ticketData) => {
  const result = await callGemini([{
    text: require('../prompts/generateRTI')(ticketData)
  }]);
  return result.rtiText;
};

// 7. Generate ward report
const generateWardReport = async (wardData) => {
  const result = await callGemini([{
    text: require('../prompts/generateReport')(wardData)
  }]);
  return result.reportText;
};

// 8. Predict issues for a zone
const predictIssues = async (zoneHistory, context) => {
  const result = await callGemini([{
    text: require('../prompts/predictIssues')(zoneHistory, context)
  }]);
  return result.predictions;
};

module.exports = {
  classifyIssue, validateResolution, detectGhost,
  detectDuplicate, queryBot, generateRTI,
  generateWardReport, predictIssues,
};
```

### 7.2 Gemini Prompts

**`backend/prompts/classify.js`**
```javascript
module.exports = (context) => `
Analyze this image of a civic infrastructure issue.
Return ONLY valid JSON with no explanation or markdown:
{
  "issueType": "one of: pothole/damaged_road/broken_footpath/open_manhole/waterlogging/garbage/sewage_overflow/water_leakage/broken_light/broken_signal/exposed_wire/fallen_tree/illegal_dumping/broken_park_equipment/other",
  "category": "one of: Infrastructure/Water_Drainage/Sanitation/Electricity/Public_Safety/Environment/Public_Facilities",
  "severity": integer 1-10,
  "dangerLevel": "one of: safe/moderate/critical",
  "departmentId": "one of: roads_infrastructure/water_supply/sanitation/electricity/parks_recreation/environment",
  "description": "one clear sentence describing the issue",
  "confidence": integer 0-100,
  "aiNotes": "any caveats about the classification or null"
}
Context (do not include in output):
Ward: ${context.ward}, City: ${context.city}
Season: ${context.season}, Time: ${context.timeOfDay}
Nearby: ${context.nearby}
`;
```

**`backend/prompts/validateResolution.js`**
```javascript
module.exports = () => `
You will receive two images:
Image 1: Original reported civic issue
Image 2: Officer's claimed resolution photo

Compare them carefully. Return ONLY valid JSON:
{
  "same_location": boolean,
  "issue_visible_in_image1": boolean,
  "issue_resolved_in_image2": boolean,
  "timestamp_appears_recent": boolean,
  "confidence_score": integer 0-100,
  "rejection_reason": "string if any check failed, null if all passed"
}
`;
```

**`backend/prompts/detectGhost.js`**
```javascript
module.exports = () => `
You will receive three images:
Image 1: New re-report photo (citizen claims issue is back)
Image 2: Original report photo
Image 3: Officer's resolution photo

Determine if Image 1 shows the same unresolved issue as Image 2,
suggesting that Image 3 was a false resolution.
Return ONLY valid JSON:
{
  "is_ghost": boolean,
  "confidence": integer 0-100,
  "reasoning": "one sentence explanation"
}
`;
```

**`backend/prompts/queryBot.js`**
```javascript
module.exports = (question, ticketData) => `
You are a helpful civic issue tracking assistant.
Answer the citizen's question about their ticket using only the data provided.
Be concise, friendly, and in plain language. Do not make up information.

TICKET DATA:
${JSON.stringify({
  publicId:            ticketData.publicId,
  status:              ticketData.status,
  issueType:           ticketData.issueType,
  assignedOfficerName: ticketData.assignedOfficerName,
  departmentId:        ticketData.departmentId,
  slaDeadline:         ticketData.slaDeadline,
  createdAt:           ticketData.createdAt,
  location:            ticketData.location?.address,
})}

CITIZEN'S QUESTION: ${question}

Return ONLY valid JSON:
{ "answer": "your response in plain language" }
`;
```

**`backend/prompts/generateRTI.js`**
```javascript
module.exports = (ticket) => `
Generate a formal RTI (Right to Information) application under the RTI Act 2005.
Use the ticket data below to fill in all details accurately.

TICKET DATA: ${JSON.stringify(ticket)}

Return ONLY valid JSON:
{
  "rtiText": "complete formatted RTI application as a multi-line string"
}

The RTI must include:
1. Header: To The Public Information Officer, [Department], [City]
2. Subject: Request for Information under RTI Act 2005
3. Body: Ticket ID, date reported, location, issue description, days unresolved,
         officers assigned, question seeking resolution timeline and actions taken
4. Evidence: List of attached photos (count)
5. Declaration: Standard RTI declaration
6. Applicant section: [To be filled by citizen]
`;
```

---

## 8. Background Workers

### 8.1 SLA Worker (`backend/workers/slaWorker.js`)

```javascript
const { db } = require('../config/firebase');
const gemini  = require('../services/geminiService');
const notify  = require('../services/notifyService');
const pdfSvc  = require('../services/pdfService');

const INTERVALS = {
  REMINDER:  7,
  ESCALATE: 14,
  RTI:      30,
  APPEAL:   60,
};

const runSLACheck = async () => {
  console.log('[SLA Worker] Running check...');
  const now = new Date();

  const snap = await db.collection('tickets')
    .where('status', 'not-in', ['RESOLVED', 'REJECTED', 'CLOSED_OVERRIDE'])
    .get();

  for (const doc of snap.docs) {
    const ticket    = doc.data();
    const created   = new Date(ticket.createdAt);
    const daysSince = (now - created) / (1000 * 60 * 60 * 24);

    try {
      if (daysSince >= INTERVALS.APPEAL && !ticket.appealGenerated) {
        const appealText = await gemini.generateRTI({ ...ticket, isAppeal: true });
        await db.collection('ticket_logs').add({
          ticketId: doc.id, action: 'FIRST_APPEAL_GENERATED',
          timestamp: now.toISOString(),
        });
        await db.collection('tickets').doc(doc.id).update({ appealGenerated: true });
        await notify.appealReady({ ticket, appealText });

      } else if (daysSince >= INTERVALS.RTI && !ticket.rtiGenerated) {
        const rtiText = await gemini.generateRTI(ticket);
        const pdfUrl  = await pdfSvc.generateRTIPdf(rtiText, ticket.publicId);
        await db.collection('tickets').doc(doc.id).update({
          rtiGenerated: true, rtiPdfUrl: pdfUrl, status: 'RTI_FILED',
        });
        await notify.rtiReady({ ticket, pdfUrl });

      } else if (daysSince >= INTERVALS.ESCALATE && ticket.status !== 'ESCALATED') {
        const note = await gemini.queryBot(
          'Generate an escalation note for senior officer', ticket
        );
        await db.collection('tickets').doc(doc.id).update({ status: 'ESCALATED' });
        await notify.escalated({ ticket, note });

      } else if (daysSince >= INTERVALS.REMINDER && !ticket.reminderSent) {
        await db.collection('tickets').doc(doc.id).update({ reminderSent: true });
        await notify.officerReminder({ ticket });
      }

      // SLA breach flag
      if (new Date(ticket.slaDeadline) < now && !ticket.slaBreached) {
        await db.collection('tickets').doc(doc.id).update({ slaBreached: true });
      }
    } catch (err) {
      console.error(`[SLA Worker] Error on ticket ${doc.id}:`, err.message);
    }
  }
};

const start = () => {
  runSLACheck();
  setInterval(runSLACheck, 60 * 60 * 1000); // every hour
};

module.exports = { start };
```

### 8.2 Ghost Detection Worker (`backend/workers/ghostWorker.js`)

```javascript
const { db }  = require('../config/firebase');
const gemini  = require('../services/geminiService');
const notify  = require('../services/notifyService');
const admin   = require('firebase-admin');

const runGhostCheck = async () => {
  console.log('[Ghost Worker] Running check...');
  const now = new Date();

  const resolvedSnap = await db.collection('tickets')
    .where('status', '==', 'RESOLVED')
    .where('ghostWindowOpen', '==', true)
    .get();

  for (const doc of resolvedSnap.docs) {
    const ticket = doc.data();

    // Check if ghost window expired
    if (new Date(ticket.ghostWindowExpiry) < now) {
      await doc.ref.update({ ghostWindowOpen: false });
      continue;
    }

    // Find new reports at same location
    const prefix  = ticket.location.geohash.substring(0, 6);
    const newSnap = await db.collection('tickets')
      .where('location.geohash', '>=', prefix)
      .where('location.geohash', '<=', prefix + '\uf8ff')
      .where('issueType', '==', ticket.issueType)
      .where('createdAt', '>', ticket.resolvedAt || ticket.updatedAt)
      .get();

    for (const newDoc of newSnap.docs) {
      if (newDoc.id === doc.id) continue;
      const newTicket = newDoc.data();

      try {
        const result = await gemini.detectGhost(
          newTicket.photos.report,
          ticket.photos.report,
          ticket.photos.resolution,
        );

        if (result.is_ghost && result.confidence >= 65) {
          // Ghost confirmed — reopen original ticket
          await doc.ref.update({
            status: 'GHOST_FLAGGED',
            ghostCount: admin.firestore.FieldValue.increment(1),
            updatedAt: now.toISOString(),
          });

          // Penalize officer accountability
          if (ticket.assignedOfficerId) {
            const penalty = ticket.overrideCount > 0 ? -20 : -10;
            await db.collection('officers').doc(ticket.assignedOfficerId).update({
              ghostClosureCount: admin.firestore.FieldValue.increment(1),
              accountabilityScore: admin.firestore.FieldValue.increment(penalty),
            });

            // 3 ghosts → escalate to admin
            const officerDoc = await db.collection('officers').doc(ticket.assignedOfficerId).get();
            if (officerDoc.data().ghostClosureCount >= 3) {
              await notify.adminGhostEscalation({ ticket, officer: officerDoc.data() });
            }
          }

          await notify.ghostDetected({ originalTicket: ticket, newTicket });

        } else if (result.confidence >= 40) {
          // Ambiguous — flag for admin review
          await db.collection('ticket_logs').add({
            ticketId: doc.id, action: 'GHOST_REVIEW_NEEDED',
            confidence: result.confidence,
            newTicketId: newDoc.id,
            timestamp: now.toISOString(),
          });
        }
      } catch (err) {
        console.error(`[Ghost Worker] Error:`, err.message);
      }
    }
  }
};

const start = () => {
  runGhostCheck();
  setInterval(runGhostCheck, 6 * 60 * 60 * 1000); // every 6 hours
};

module.exports = { start };
```

---

## 9. Maps Integration

### 9.1 Community Map Component (`frontend/src/components/shared/CommunityMap.jsx`)

```jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const PIN_COLORS = {
  CRITICAL:   '#EA4335',
  HIGH:       '#FF6D00',
  MEDIUM:     '#FBBC04',
  RESOLVED:   '#34A853',
  PREDICTED:  '#1A73E8',
};

const getSeverityClass = (severity, status) => {
  if (status === 'RESOLVED')     return 'RESOLVED';
  if (severity >= 9)             return 'CRITICAL';
  if (severity >= 7)             return 'HIGH';
  if (severity >= 4)             return 'MEDIUM';
  return 'MEDIUM';
};

const createIcon = (color, isDashed = false) => L.divIcon({
  html: `<div style="
    width:24px;height:24px;border-radius:50% 50% 50% 0;
    background:${color};transform:rotate(-45deg);
    border:2px solid white;
    ${isDashed ? 'border-style:dashed;' : ''}
    box-shadow:0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

export default function CommunityMap({ tickets = [], predictions = [], center = [22.5726, 88.3639], zoom = 13, onTicketClick }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />

      {tickets.map(ticket => {
        const cls   = getSeverityClass(ticket.severity, ticket.status);
        const color = PIN_COLORS[cls];
        return (
          <Marker
            key={ticket.publicId}
            position={[ticket.location.lat, ticket.location.lng]}
            icon={createIcon(color)}
          >
            <Popup>
              <div className="text-sm min-w-48">
                <p className="font-semibold">{ticket.publicId}</p>
                <p className="text-gray-600">{ticket.issueType} — {ticket.status}</p>
                <p className="text-gray-500 text-xs">{ticket.location.address}</p>
                <p className="text-gray-500 text-xs">Severity: {ticket.severity}/10 | {ticket.upvoteCount} upvotes</p>
                <button
                  onClick={() => onTicketClick?.(ticket)}
                  className="mt-2 text-blue-600 text-xs underline"
                >
                  View ticket →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {predictions.map((pred, i) => (
        <Marker
          key={`pred-${i}`}
          position={[pred.lat, pred.lng]}
          icon={createIcon(PIN_COLORS.PREDICTED, true)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-blue-700">🔵 AI Predicted</p>
              <p>{pred.issueType} — {pred.probability}% probability</p>
              <p className="text-gray-500 text-xs">{pred.reason}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### 9.2 Reverse Geocoding (Nominatim)

```javascript
// backend/services/geocodeService.js
const fetch = require('node-fetch');

const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'CommunityHero/1.0 (hackathon@example.com)' }
    });
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
};

module.exports = { reverseGeocode };
```

---

## 10. Notification System

### 10.1 Notify Service (`backend/services/notifyService.js`)

```javascript
const twilio    = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const nodemailer = require('nodemailer');
const { admin } = require('../config/firebase');

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendWhatsApp = async (to, message) => {
  if (!to) return;
  try {
    await twilio.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message,
    });
  } catch (err) {
    console.error('[WhatsApp] Failed:', err.message);
  }
};

const sendEmail = async (to, subject, text) => {
  if (!to) return;
  try {
    await mailer.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (err) {
    console.error('[Email] Failed:', err.message);
  }
};

const sendPush = async (userId, title, body, data = {}) => {
  if (!userId) return;
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const token   = userDoc.data()?.fcmToken;
    if (!token) return;
    await admin.messaging().send({ token, notification: { title, body }, data });
  } catch (err) {
    console.error('[FCM] Failed:', err.message);
  }
};

const ticketCreated = async ({ publicId, phone, email }) => {
  const msg = `✅ Report submitted! Ticket ID: ${publicId}\nTrack: https://community-hero.app/track/${publicId}`;
  await Promise.all([
    sendWhatsApp(phone, msg),
    sendEmail(email, `Ticket ${publicId} created`, msg),
  ]);
};

const officerAssigned = async ({ ticket, officer }) => {
  const msg = `Your issue ${ticket.publicId} has been assigned to ${officer.name} (${officer.departmentId}).\nSLA Deadline: ${new Date(ticket.slaDeadline).toDateString()}`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `Officer assigned — ${ticket.publicId}`, msg),
    sendPush(ticket.citizenId, 'Officer assigned', msg, { ticketId: ticket.publicId }),
  ]);
};

const ticketResolved = async ({ ticket, resolutionUrl, beforeUrl }) => {
  const msg = `✅ Your issue ${ticket.publicId} has been RESOLVED.\nPlease rate the resolution in the app.`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `Resolved — ${ticket.publicId}`, msg),
    sendPush(ticket.citizenId, 'Issue resolved!', msg, { ticketId: ticket.publicId }),
  ]);
};

const ghostDetected = async ({ originalTicket, newTicket }) => {
  const msg = `⚠️ GHOST DETECTED: Ticket ${originalTicket.publicId} was marked resolved but re-reported. Ticket reopened.`;
  await sendPush(originalTicket.citizenId, 'Ghost issue detected', msg);
};

const rtiReady = async ({ ticket, pdfUrl }) => {
  const msg = `📋 RTI draft ready for ticket ${ticket.publicId} (${new Date(ticket.createdAt).toDateString()}).\nDownload: ${pdfUrl}`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `RTI Draft Ready — ${ticket.publicId}`, msg),
  ]);
};

const escalated = async ({ ticket, note }) => {
  const msg = `⬆️ Ticket ${ticket.publicId} has been escalated to a senior officer (unresolved ${Math.floor((Date.now() - new Date(ticket.createdAt)) / 86400000)} days).`;
  await sendPush(ticket.citizenId, 'Issue escalated', msg);
};

module.exports = {
  ticketCreated, officerAssigned, ticketResolved,
  ghostDetected, rtiReady, escalated,
  officerReminder: async ({ ticket }) => {},   // implement similarly
  appealReady: async ({ ticket }) => {},        // implement similarly
  adminGhostEscalation: async ({ ticket }) => {},
  escalatedAfterFailedResolution: async ({ ticket }) => {},
};
```

### 10.2 FCM Service Worker (`frontend/public/firebase-messaging-sw.js`)

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'REACT_APP_FIREBASE_API_KEY',
  authDomain:        'REACT_APP_FIREBASE_AUTH_DOMAIN',
  projectId:         'REACT_APP_FIREBASE_PROJECT_ID',
  storageBucket:     'REACT_APP_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  appId:             'REACT_APP_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo192.png',
    data: payload.data,
  });
});
```

---

## 11. Security Implementation

### 11.1 Input Validation Schema (`backend/schemas/ticketSchema.js`)

```javascript
const Joi = require('joi');

const VALID_ISSUE_TYPES = [
  'pothole','damaged_road','broken_footpath','open_manhole','waterlogging',
  'garbage','sewage_overflow','water_leakage','broken_light','broken_signal',
  'exposed_wire','fallen_tree','illegal_dumping','broken_park_equipment','other'
];

const VALID_CATEGORIES = [
  'Infrastructure','Water_Drainage','Sanitation',
  'Electricity','Public_Safety','Environment','Public_Facilities'
];

const VALID_DEPARTMENTS = [
  'roads_infrastructure','water_supply','sanitation',
  'electricity','parks_recreation','environment'
];

const ticketSchema = Joi.object({
  issueType:    Joi.string().valid(...VALID_ISSUE_TYPES).required(),
  category:     Joi.string().valid(...VALID_CATEGORIES).required(),
  severity:     Joi.number().integer().min(1).max(10).required(),
  dangerLevel:  Joi.string().valid('safe','moderate','critical').required(),
  departmentId: Joi.string().valid(...VALID_DEPARTMENTS).required(),
  description:  Joi.string().max(500).pattern(/^[^<>{}]*$/).required(),
  location: Joi.object({
    lat:     Joi.number().min(-90).max(90).required(),
    lng:     Joi.number().min(-180).max(180).required(),
    ward:    Joi.string().max(100).required(),
    city:    Joi.string().max(100).required(),
    address: Joi.string().max(300).required(),
  }).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
});

module.exports = { ticketSchema };
```

---

## 12. Deployment to Google AI Studio

### 12.1 Prepare for Deployment

**Build frontend:**
```bash
cd frontend
npm run build
```

**Copy build into backend for serving:**
```bash
cp -r frontend/build backend/public
```

**Update `backend/server.js` to serve React:**
```javascript
const path = require('path');

// Serve React app
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});
```

**Add `package.json` start script:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 12.2 Deploy via Google AI Studio

1. Go to https://aistudio.google.com
2. Open **Build Mode**
3. Connect your GitHub repository (or upload project files)
4. Click **Publish** → **Get Started** → **Publish App**
5. Set environment variables in AI Studio settings panel:
   - `GEMINI_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `FRONTEND_URL` (set after first deploy)
   - `NODE_ENV=production`
6. Cloud Run URL generated → copy this as your submission URL

### 12.3 Post-Deploy Steps

```bash
# Deploy Firestore and Storage rules
firebase deploy --only firestore:rules,storage

# Set admin custom claim for your admin account
# Run this once in Firebase Admin SDK (or in a one-time script)
admin.auth().setCustomUserClaims('YOUR_ADMIN_UID', { admin: true });

# Create initial departments in Firestore
# (can be done via Admin dashboard UI once deployed)
```

### 12.4 Test Checklist (Pre-Submission)

```
□ Public landing page loads
□ Report issue flow (5 steps) works end-to-end
□ Gemini classifies photo and returns JSON
□ Ticket created, ID shown, WhatsApp/email sent (Twilio sandbox)
□ Public ticket tracker works with ticket ID
□ Citizen login (Google Sign-In) works
□ Officer login (email/password) works
□ Admin login (email/password) works
□ Admin can assign officer from dropdown
□ Officer can acknowledge and upload resolution
□ Gemini validates resolution photo
□ Ghost re-open button appears after resolve
□ Community map shows pins
□ Leaderboard loads
□ Gamification XP awarded on report
□ Notifications show in panel
□ All three dashboards accessible from correct role
□ Firestore Security Rules block unauthorized access
```

---

## 13. Build Day Checklist

### Day 1 (22 Jun) — Foundation
```
□ Project scaffolded (frontend + backend)
□ Firebase project created, config copied
□ Firestore + Storage rules deployed
□ Express server running locally
□ Firebase Auth working (Google Sign-In + email/password)
□ Role-based routing working (citizen/officer/admin)
□ Basic ticket creation API working
□ Photo upload to Firebase Storage working
□ Gemini classify API call working (test with sample image)
```

### Day 2 (23 Jun) — Core Flow
```
□ Full 5-step report flow in UI
□ AI suggestions shown with editable fields
□ Duplicate detection working
□ Ticket ID generated and displayed
□ Public ticket tracker page
□ OpenStreetMap community map with pins
□ Officer queue page
□ Admin unassigned queue with assignment dropdown
□ Officer assignment API working
□ Notifications (FCM push) working
```

### Day 3 (24 Jun) — AI Features (Mentor session day)
```
□ Resolution upload flow (officer side)
□ Gemini before/after validation working
□ Ghost detection worker running
□ NLP query bot on ticket page
□ SLA worker running (test with shortened intervals)
□ Peer verification flow
□ RTI generation (Gemini)
```

### Day 4 (25 Jun) — Dashboards
```
□ Citizen dashboard (home, my tickets, profile)
□ Gamification XP and badges
□ Officer dashboard (stats, queue, performance)
□ Admin dashboard (overview, staff management)
□ Admin add/edit officer form
□ Ward reports (Gemini-generated)
□ Predictions dashboard
```

### Day 5 (26 Jun) — Polish
```
□ All notifications (WhatsApp, email, FCM)
□ Language selector (Google Translate API)
□ Error states and loading states
□ Mobile responsive layout
□ Leaderboard
□ System settings page (admin)
□ Predictive worker running
```

### Day 6 (27 Jun) — Testing & Hardening
```
□ End-to-end flow tested (all 3 roles)
□ Rate limiting verified
□ Firestore rules tested (unauthorized access blocked)
□ Input validation tested (bad data rejected)
□ Gemini quota tracker working
□ All background workers tested
□ Deploy to Google AI Studio
□ Live URL tested end-to-end
```

### Day 7 (28–29 Jun) — Submission
```
□ Live URL stable and accessible
□ GitHub repo public, README complete
□ Google Doc prepared (see Section 14)
□ All three submission items ready
□ Submit on BlockseBlock platform before 2:00 PM 29 Jun
```

---

## 14. Hackathon Submission Checklist

### 14.1 Required Submission Items

**Item 1 — Deployed Application Link**
- Cloud Run URL from Google AI Studio
- Must be publicly accessible
- Must remain active through evaluation period
- Test: open in incognito window, all three roles should work

**Item 2 — GitHub Repository**

```markdown
# Community Hero — Hyperlocal Problem Solver

## Problem Statement
PS2 — Community Hero: Hyperlocal Problem Solver

## Live Demo
https://your-app.run.app

## Tech Stack
- Frontend: React 18, Leaflet.js, Tailwind CSS
- Backend: Node.js/Express on Google Cloud Run
- Database: Firebase Firestore
- Storage: Firebase Storage
- Auth: Firebase Authentication
- AI: Gemini 2.0 Flash (14 touchpoints)
- Maps: OpenStreetMap + Leaflet.js
- Notifications: FCM, WhatsApp (Twilio), Email
- Translation: Google Translate API
- Deployment: Google AI Studio → Cloud Run

## Setup Instructions
1. Clone repo
2. Copy .env.example to .env and fill in values
3. cd frontend && npm install && npm run build
4. cd backend && npm install && node server.js

## Three Login Roles
- Citizen: Google Sign-In or anonymous
- Officer: admin@example.com / officer@example.com
- Admin: admin@example.com (credentials in submission doc)

## Key Features
[list all major features]
```

**Item 3 — Google Doc**

Create at: https://docs.google.com/document/create

Set sharing: **Anyone with the link can view**

Document must contain:

```
COMMUNITY HERO — HYPERLOCAL PROBLEM SOLVER

Problem Statement Selected:
PS2 — Community Hero: Hyperlocal Problem Solver

Solution Overview:
[2-3 paragraph description of the platform]

Key Features:
1. AI-powered issue classification (Gemini Vision)
2. Three-interface design (Citizen, Officer, Admin)
3. Ghost issue detection via two-image Gemini comparison
4. Manual officer assignment from admin-managed staff database
5. AI-validated resolution proof (before/after photo comparison)
6. RTI auto-draft with legal escalation ladder
7. Predictive issue flagging (agentic, no citizen trigger)
8. Community peer verification + gamification
9. Real-time ticket tracking (no login required)
10. NLP ticket query bot
[continue for all features]

Technologies Used:
- React 18 (frontend)
- Node.js / Express (backend)
- Firebase Firestore, Storage, Auth, FCM
- OpenStreetMap + Leaflet.js
- Google Translate API

Google Technologies Utilized:
1. Gemini 2.0 Flash (Google AI Studio) — 14 AI touchpoints
2. Google AI Studio — Build and deployment platform
3. Google Cloud Run — Backend hosting (via AI Studio Starter Tier)
4. Firebase Firestore — Real-time database
5. Firebase Authentication — Role-based auth
6. Firebase Storage — Photo storage
7. Firebase Cloud Messaging — Push notifications
8. Google Translate API — Hindi, Bengali multilingual support

Demo Credentials:
Admin:   [email] / [password]
Officer: [email] / [password]
Citizen: Use Google Sign-In or anonymous report
```

### 14.2 Final Submission on BlockseBlock

1. Log in to BlockseBlock platform
2. Navigate to submission section
3. Paste:
   - Deployed application URL
   - GitHub repository URL
   - Google Doc URL
4. Submit before **29 June 2026, 2:00 PM**
5. Screenshot the confirmation page

---

*Community Hero — Technical Implementation Guide v1.0*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
