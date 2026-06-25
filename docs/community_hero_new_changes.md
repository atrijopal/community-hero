# New Changes — Feature Additions
## Community Hero — Hyperlocal Problem Solver
**Version:** 2.1 (Delta from v2.0)
**Date:** June 2026
**Note:** This document describes ONLY what changes. Refer to existing docs for full context.
**Skipping:** Feature 6 (Evaluation & Benchmarking Module)

---

## Summary of Changes

| # | Feature | Effort | Priority |
|---|---|---|---|
| 1 | Gemini Structured Output (JSON enforcement) | Low | High |
| 2 | Gemini Function Calling (Query Bot) | Medium | Highest |
| 3 | Enhanced Ghost Detection Output | Low | High |
| 4 | Resolution Evidence Report Card | Low | Medium |
| 5 | AI Confidence & Reasoning Layer | Low | Medium |
| 7 | Admin Analytics Dashboard (wire up existing design) | Medium | Medium |

---

## Feature 1 — Gemini Structured Output

### What Changes

Add `responseMimeType: "application/json"` to every Gemini API call. This forces Gemini to return strictly valid JSON instead of free-form text with optional markdown fences. You are already parsing JSON — this just makes it guaranteed at the API level.

### Where to Change

**`backend/services/geminiService.js`** — `callGemini()` function:

```javascript
// BEFORE
body: JSON.stringify({
  contents: [{ parts }],
  generationConfig: {
    temperature: 0.1,
  },
}),

// AFTER
body: JSON.stringify({
  contents: [{ parts }],
  generationConfig: {
    responseMimeType: 'application/json',  // ← ADD THIS
    temperature: 0.1,
  },
}),
```

Also remove the JSON.parse safety wrapper — with structured output enabled you no longer need to strip markdown fences:

```javascript
// BEFORE
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
return JSON.parse(text);  // can fail if Gemini wraps in ```json

// AFTER
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
return JSON.parse(text);  // now guaranteed clean JSON — but keep try/catch for network errors
```

### Prompt Changes

Every prompt in `backend/prompts/` should add an explicit instruction at the top:

```javascript
// Add this line to every prompt function
`You must respond with valid JSON only. No explanation, no markdown, no backticks.\n\n`
```

### Schema Changes

None — Firestore schema is unchanged. Gemini output shape is identical, just guaranteed clean.

### What to Update in Existing Docs

- **Tech Implementation Guide** — Section 7.1 (Gemini Service): add `responseMimeType` to the config block
- **System Design** — Section 4.1 (AI Service Layer): note that structured output is enforced at API level
- **PRD v2.0** — Section 23 (AI Features): add "Gemini Structured Output enforced via responseMimeType" to the feature list

---

## Feature 2 — Gemini Function Calling (Query Bot Upgrade)

### What Changes

The NLP query bot currently sends ticket data as a JSON blob in the prompt and asks Gemini to answer. The upgrade: let Gemini decide what it needs via function calling. Gemini receives the question, declares which functions it wants to call, the backend executes them (Firestore reads you're already doing), and Gemini synthesizes the final answer from live data.

This makes the query bot genuinely agentic — it acts rather than just responding.

### New File: `backend/services/queryFunctions.js`

```javascript
const { db } = require('../config/firebase');

// Function definitions — passed to Gemini in the tools parameter
const QUERY_TOOL_DEFINITIONS = [
  {
    name: 'get_ticket_details',
    description: 'Fetch full ticket information including status, issue type, location, and timeline',
    parameters: {
      type: 'object',
      properties: {
        ticket_public_id: {
          type: 'string',
          description: 'The public ticket ID e.g. KOL-2026-00142',
        },
      },
      required: ['ticket_public_id'],
    },
  },
  {
    name: 'get_officer_status',
    description: 'Fetch the assigned officer name, department, active case load, and last activity',
    parameters: {
      type: 'object',
      properties: {
        officer_id: {
          type: 'string',
          description: 'Firebase Auth UID of the assigned officer',
        },
      },
      required: ['officer_id'],
    },
  },
  {
    name: 'get_sla_status',
    description: 'Fetch SLA deadline, days remaining, breach status, and escalation history',
    parameters: {
      type: 'object',
      properties: {
        ticket_public_id: {
          type: 'string',
          description: 'The public ticket ID',
        },
      },
      required: ['ticket_public_id'],
    },
  },
  {
    name: 'get_resolution_estimate',
    description: 'Estimate likely resolution time based on department average and current workload',
    parameters: {
      type: 'object',
      properties: {
        department_id: {
          type: 'string',
          description: 'Department ID e.g. roads_infrastructure',
        },
        severity: {
          type: 'number',
          description: 'Ticket severity 1-10',
        },
      },
      required: ['department_id'],
    },
  },
];

// Function executors — these are the actual Firestore reads
const executeFunctionCall = async (functionName, args, ticketContext) => {
  switch (functionName) {

    case 'get_ticket_details': {
      // Use pre-loaded ticket context (already fetched before calling Gemini)
      return {
        publicId:            ticketContext.publicId,
        status:              ticketContext.status,
        issueType:           ticketContext.issueType,
        category:            ticketContext.category,
        severity:            ticketContext.severity,
        dangerLevel:         ticketContext.dangerLevel,
        location:            ticketContext.location?.address,
        ward:                ticketContext.location?.ward,
        assignedOfficerName: ticketContext.assignedOfficerName,
        verificationStatus:  ticketContext.verificationStatus,
        upvoteCount:         ticketContext.upvoteCount,
        createdAt:           ticketContext.createdAt,
        updatedAt:           ticketContext.updatedAt,
      };
    }

    case 'get_officer_status': {
      if (!args.officer_id) {
        return { error: 'No officer assigned to this ticket yet' };
      }
      const officerDoc = await db.collection('officers').doc(args.officer_id).get();
      if (!officerDoc.exists) return { error: 'Officer not found' };
      const officer = officerDoc.data();
      return {
        name:            officer.name,
        designation:     officer.designation,
        department:      officer.departmentId,
        activeCases:     officer.activeCaseCount,
        resolutionRate:  `${officer.resolutionRate}%`,
        avgResolutionDays: officer.avgResolutionDays,
        status:          officer.status,
        lastActiveAt:    officer.lastActiveAt,
      };
    }

    case 'get_sla_status': {
      const now         = new Date();
      const slaDeadline = new Date(ticketContext.slaDeadline);
      const daysLeft    = Math.ceil((slaDeadline - now) / (1000 * 60 * 60 * 24));
      const daysSince   = Math.floor(
        (now - new Date(ticketContext.createdAt)) / (1000 * 60 * 60 * 24)
      );
      return {
        slaDeadline:    ticketContext.slaDeadline,
        daysRemaining:  daysLeft > 0 ? daysLeft : 0,
        slaBreached:    ticketContext.slaBreached || daysLeft < 0,
        daysOverdue:    daysLeft < 0 ? Math.abs(daysLeft) : 0,
        daysSinceReport: daysSince,
        reminderSent:   ticketContext.reminderSent,
        escalated:      ticketContext.status === 'ESCALATED',
        escalatedAt:    ticketContext.escalatedAt || null,
        rtiGenerated:   ticketContext.rtiGenerated,
      };
    }

    case 'get_resolution_estimate': {
      const deptDoc = await db.collection('departments').doc(args.department_id).get();
      if (!deptDoc.exists) return { estimatedDays: 'Unknown', reason: 'Department not found' };

      const dept         = deptDoc.data();
      const baseDays     = dept.defaultSlaDays;
      const severity     = args.severity || 5;
      // Higher severity = faster resolution (prioritized)
      const adjustedDays = severity >= 9 ? 1
                         : severity >= 7 ? Math.ceil(baseDays * 0.7)
                         : baseDays;

      return {
        department:         dept.name,
        defaultSlaDays:     baseDays,
        estimatedDays:      adjustedDays,
        severityFactor:     severity >= 9 ? 'Critical — expedited' : severity >= 7 ? 'High — prioritized' : 'Normal',
        note:               'Estimate based on department average and severity. Actual time may vary.',
      };
    }

    default:
      return { error: `Unknown function: ${functionName}` };
  }
};

module.exports = { QUERY_TOOL_DEFINITIONS, executeFunctionCall };
```

### Updated: `backend/services/geminiService.js` — `queryBot()` function

Replace the existing simple queryBot with the function-calling version:

```javascript
// NEW queryBot with function calling
const queryBot = async (question, ticketData) => {
  const { QUERY_TOOL_DEFINITIONS, executeFunctionCall } = require('./queryFunctions');

  const GEMINI_FC_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // System prompt — sets context without injecting citizen's sensitive data
  const systemPrompt = `You are a helpful civic issue tracking assistant for Community Hero platform.
Answer the citizen's question about their issue ticket.
Use the available functions to fetch the data you need.
Be concise, friendly, and in plain language.
Always mention the ticket ID in your response.
If the issue is delayed, acknowledge it and explain what stage it is at.
Do not make up information — only use data from function calls.`;

  const messages = [
    { role: 'user', content: `Ticket: ${ticketData.publicId}\n\nQuestion: ${question}` },
  ];

  let response = await fetch(GEMINI_FC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
      tools: [{ function_declarations: QUERY_TOOL_DEFINITIONS }],
      tool_config: { function_calling_config: { mode: 'AUTO' } },
    }),
  });

  let data = await response.json();

  // Function calling loop — Gemini may call multiple functions
  let iterations = 0;
  const MAX_ITERATIONS = 5; // prevent infinite loops

  while (iterations < MAX_ITERATIONS) {
    const candidate = data.candidates?.[0];
    const parts      = candidate?.content?.parts || [];

    // Check if Gemini wants to call a function
    const functionCallPart = parts.find(p => p.functionCall);
    if (!functionCallPart) break; // Gemini is done calling functions

    const { name, args } = functionCallPart.functionCall;
    console.log(`[QueryBot] Gemini calling function: ${name}`, args);

    // Execute the function
    const functionResult = await executeFunctionCall(name, args, ticketData);

    // Send function result back to Gemini
    messages.push(
      { role: 'model', content: JSON.stringify({ functionCall: { name, args } }) },
      { role: 'user',  content: JSON.stringify({ functionResponse: { name, response: functionResult } }) },
    );

    response = await fetch(GEMINI_FC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        tools: [{ function_declarations: QUERY_TOOL_DEFINITIONS }],
      }),
    });

    data = await response.json();
    iterations++;
  }

  // Extract final text response
  const finalParts = data.candidates?.[0]?.content?.parts || [];
  const textPart   = finalParts.find(p => p.text);
  return textPart?.text || 'Sorry, I could not find information about your ticket right now.';
};
```

### New Firestore Reads This Introduces

The function calling system makes these Firestore reads on demand:
- `officers/{officerId}` — for `get_officer_status`
- `departments/{departmentId}` — for `get_resolution_estimate`
- Ticket context (already loaded before calling Gemini) — for `get_ticket_details` and `get_sla_status`

No new collections needed.

### What to Update in Existing Docs

- **Tech Implementation Guide** — Section 7.1: replace `queryBot` function with function-calling version, add `queryFunctions.js` to folder structure under `backend/services/`
- **Tech Implementation Guide** — Section 2 (Folder Structure): add `backend/services/queryFunctions.js`
- **System Design** — Section 4.1 (AI Features table): update row 7 from "NLP ticket query bot" to "Agentic query bot with function calling"
- **PRD v2.0** — Section 23, Feature 7: update description to include function calling detail
- **Schema Guide** — No collection changes needed. Add note in Section 4.3 (officers) and 4.4 (departments): "Read by query bot function calling system"
- **User Flows** — Section 3.4, Tab 4 (Ask a Question): update example to show multi-step reasoning e.g. "Gemini is checking officer status..." loading state

---

## Feature 3 — Enhanced Ghost Detection Output

### What Changes

The ghost detection Gemini call currently returns a simple `{is_ghost, confidence, reasoning}`. Upgrade to a structured verification report that includes a clear `decision` field and `reason` — making the output displayable directly in the admin UI without any interpretation.

### Change: `backend/prompts/detectGhost.js`

```javascript
// BEFORE
module.exports = () => `
You will receive three images...
Return ONLY valid JSON:
{
  "is_ghost": boolean,
  "confidence": integer 0-100,
  "reasoning": "one sentence explanation"
}
`;

// AFTER
module.exports = () => `
You will receive three images:
Image 1: New citizen re-report photo (citizen claims issue is back)
Image 2: Original report photo (the issue as first reported)
Image 3: Officer resolution photo (what officer submitted as proof of fix)

Compare Image 1 against Image 2 and Image 3.
Determine: Is the issue in Image 1 the same unresolved issue from Image 2,
suggesting that Image 3 was a false or incomplete resolution?

Return ONLY valid JSON:
{
  "issue_still_present": boolean,
  "confidence": integer 0-100,
  "decision": "reject_resolution" | "accept_resolution" | "needs_review",
  "reason": "one clear sentence explaining the decision",
  "comparison": {
    "image1_vs_image2": "same_issue | different_issue | unclear",
    "image3_quality": "valid_resolution | partial_resolution | fake_resolution | unclear"
  }
}
`;
```

### Change: `backend/workers/ghostWorker.js` — decision parsing

```javascript
// BEFORE
if (result.is_ghost && result.confidence >= 65) {
  await flagGhost(ticket, candidate, result);
} else if (result.confidence >= 40) {
  await flagForAdminReview(ticket, candidate, result);
}

// AFTER
if (result.decision === 'reject_resolution' && result.confidence >= 65) {
  await flagGhost(ticket, candidate, result);
} else if (result.decision === 'needs_review' || result.confidence >= 40) {
  await flagForAdminReview(ticket, candidate, result);
}
// accept_resolution with high confidence = legitimate closure, no action needed
```

### Change: Firestore — `ticket_logs` metadata for ghost events

When a ghost is detected, store the full structured result in the log entry metadata:

```javascript
// In ghostWorker.js flagGhost() function — add to metadata:
metadata: {
  ghostReport: {
    issueStillPresent: result.issue_still_present,
    confidence:        result.confidence,
    decision:          result.decision,
    reason:            result.reason,
    comparison:        result.comparison,
  },
  newTicketId: newDoc.id,
}
```

### New UI Component: Ghost Report Card

Add to the admin ticket detail view when `status === 'GHOST_FLAGGED'`:

```
GHOST DETECTION REPORT
────────────────────────────────────────────────
Issue Still Present:   ✅ Yes
Confidence:            91%
Decision:              ❌ Resolution Rejected
Reason:                Original pothole remains visible in the resolution photo.
Image Analysis:
  New vs Original:     Same Issue
  Resolution Photo:    Fake Resolution
────────────────────────────────────────────────
```

### What to Update in Existing Docs

- **Tech Implementation Guide** — Section 7.2, `detectGhost.js` prompt: replace with new version above
- **Tech Implementation Guide** — Section 11 (Ghost Worker): update decision parsing logic
- **Schema Guide** — Section 4.2 (`ticket_logs`): update metadata example for `GHOST_FLAGGED` action to include `ghostReport` object
- **PRD v2.0** — Section 15 (Ghost Issue Detection): update output JSON example and decision field explanation
- **User Flows** — Admin dashboard ghost alert card: show structured report fields instead of just "ghost flagged"

---

## Feature 4 — Resolution Evidence Report Card

### What Changes

When Gemini validates a resolution photo (before/after comparison), generate and store a human-readable evidence report. This report is shown to both the citizen (on their ticket page) and the admin. No additional Gemini call — just rendering the existing `validateResolution` output as a formatted card.

### Change: `backend/routes/tickets.js` — resolution endpoint

After Gemini validates, store the evidence report on the ticket:

```javascript
// In the resolution route, after gemini.validateResolution() returns:

const evidenceReport = {
  generatedAt:       new Date().toISOString(),
  officerId:         req.user.uid,
  officerName:       ticket.assignedOfficerName,
  beforePhotoUrl:    ticket.photos.report,
  afterPhotoUrl:     resolutionUrl,
  geminiAnalysis: {
    sameLocation:         validation.same_location,
    issueResolved:        validation.issue_resolved_in_image2,
    timestampValid:       validation.timestamp_appears_recent,
    confidenceScore:      validation.confidence_score,
    decision:             validation.confidence_score >= 70 && validation.issue_resolved_in_image2
                          ? 'Resolution Approved' : 'Resolution Rejected',
    rejectionReason:      validation.rejection_reason || null,
  },
};

// Store on ticket document
await ticketRef.update({
  // ... existing update fields ...
  evidenceReport,  // ← ADD THIS
});
```

### New Firestore Field on `tickets`

Add to the tickets schema:

```javascript
evidenceReport: {
  generatedAt:    String,     // ISO 8601
  officerId:      String,
  officerName:    String,
  beforePhotoUrl: String,
  afterPhotoUrl:  String,
  geminiAnalysis: {
    sameLocation:      Boolean,
    issueResolved:     Boolean,
    timestampValid:    Boolean,
    confidenceScore:   Number,   // 0-100
    decision:          String,   // 'Resolution Approved' | 'Resolution Rejected'
    rejectionReason:   String | null,
  },
} | null,  // null until officer submits resolution
```

### New UI: Evidence Report Card

Shown on citizen ticket page (Tab 3: Photos) and officer ticket detail after resolution:

```
RESOLUTION EVIDENCE REPORT
────────────────────────────────────────────────────────
BEFORE                          AFTER
[original photo]          →     [resolution photo]
Reported: 22 Jun 2026           Submitted: 28 Jun 2026

AI ANALYSIS
Same Location:          ✅ Confirmed
Issue Resolved:         ✅ Confirmed
Timestamp Valid:        ✅ Confirmed
AI Confidence:          91%

DECISION:               ✅ Resolution Approved
────────────────────────────────────────────────────────
Verified by Gemini AI
```

For rejected resolutions (shown to officer only):

```
RESOLUTION EVIDENCE REPORT
────────────────────────────────────────────────────────
AI Confidence:          44%
Issue Resolved:         ❌ Not Confirmed
DECISION:               ❌ Resolution Rejected
Reason:                 Issue still visible in resolution photo.
Retries Remaining:      2 of 3
────────────────────────────────────────────────────────
```

### What to Update in Existing Docs

- **Schema Guide** — Section 4.1 (`tickets`): add `evidenceReport` field definition
- **Tech Implementation Guide** — Section 6.2 (resolution route): add `evidenceReport` construction and storage
- **User Flows** — Section 4.4 (Officer Ticket Detail, Tab 3 Photos): add evidence report card
- **User Flows** — Section 3.4 (Citizen Ticket Detail, Tab 3 Photos): add evidence report card (approved only, no rejection details)
- **PRD v2.0** — Section 13 (Resolution Proof System): add evidence report generation step

---

## Feature 5 — AI Confidence & Reasoning Layer

### What Changes

Surface confidence scores and reasoning summaries in the UI at the two places that matter most: issue classification (on the report form) and ghost detection (on the admin dashboard). Not everywhere — just where decisions have accountability implications.

### Where to Show Confidence

**Place 1 — Report form (Step 2: AI Review)**

Below the AI-suggested fields, add a small confidence indicator:

```
AI Classification Confidence: 89%  ████████░░
Reason: Detected road surface damage with clear boundary
        edges and depth indicators consistent with a pothole.
```

If confidence < 50%: show in yellow with "Please review carefully"
If confidence >= 80%: show in green
Between 50–80%: show in blue

This data already comes back from `classifyIssue()` in `aiNotes` and `confidence` fields. Just render them.

**Place 2 — Admin dashboard: Ghost detection alert**

Already covered by Feature 3 — the ghost report card shows confidence and reasoning.

**Place 3 — Admin ticket detail: Classification section**

In the AI Classification tab on the officer/admin ticket view, show:

```
AI CLASSIFICATION
Issue Type:     Pothole          ← citizen confirmed
Confidence:     89%  ████████░░
AI Reasoning:   Road surface damage with clear boundary edges.
Citizen edited: No edits made    (or: "Citizen changed: issueType")
```

### Change: `backend/prompts/classify.js`

The prompt already requests `aiNotes`. Rename to `reasoning` for clarity and ensure it's always populated:

```javascript
// In classify.js prompt — update the JSON schema:
{
  "issueType": "...",
  "category": "...",
  "severity": 0,
  "dangerLevel": "...",
  "departmentId": "...",
  "description": "...",
  "confidence": 0,
  "reasoning": "one sentence explaining what visual features led to this classification"
  // renamed from aiNotes, now always required
}
```

### Change: `backend/routes/tickets.js` — store reasoning on ticket

```javascript
// In POST /api/tickets, after classifyIssue():
aiSuggested: {
  issueType:    aiResult.issueType,
  category:     aiResult.category,
  severity:     aiResult.severity,
  dangerLevel:  aiResult.dangerLevel,
  departmentId: aiResult.departmentId,
  description:  aiResult.description,
  confidence:   aiResult.confidence,
  reasoning:    aiResult.reasoning,   // ← ADD THIS (renamed from aiNotes)
},
```

### Change: Firestore `tickets.aiSuggested`

Rename `aiNotes` → `reasoning` in the schema. One field rename.

```javascript
// Schema Guide Section 4.1 — update aiSuggested object:
aiSuggested: {
  // ... existing fields ...
  confidence: Number,
  reasoning:  String,   // was: aiNotes: String
}
```

### What to Update in Existing Docs

- **Schema Guide** — Section 4.1 (`tickets.aiSuggested`): rename `aiNotes` to `reasoning`
- **Tech Implementation Guide** — Section 7.2, `classify.js`: rename `aiNotes` to `reasoning` in prompt JSON schema
- **Tech Implementation Guide** — Section 6.2 (ticket creation route): add `reasoning` to `aiSuggested` object stored on ticket
- **User Flows** — Section 3.3 (Step 2 AI Review): add confidence bar and reasoning text below the AI fields
- **User Flows** — Section 4.4 (Officer Ticket Detail): add confidence + reasoning to AI Classification tab
- **User Flows** — Section 5.4 (Admin Unassigned Queue): add confidence indicator on each ticket card
- **PRD v2.0** — Section 8 (Gemini Classification): add reasoning field to output JSON example

---

## Feature 7 — Admin Analytics Dashboard (Wire Up)

### What Changes

The admin analytics dashboard is already designed in the User Flows doc (Section 5.8 — Reports & Analytics). This section specifies exactly what data to fetch from Firestore to populate each widget. No new collections needed.

### New File: `backend/routes/analytics.js`

```javascript
const router = require('express').Router();
const { db } = require('../config/firebase');
const { authMiddleware } = require('../middleware/authMiddleware');

// All analytics routes require admin role
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
});

// GET /api/analytics/overview — city-wide stats
router.get('/overview', async (req, res, next) => {
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); // 1st of month

    // Parallel Firestore reads
    const [allTickets, wardStats] = await Promise.all([
      db.collection('tickets').get(),
      db.collection('ward_stats').get(),
    ]);

    const tickets = allTickets.docs.map(d => d.data());

    const overview = {
      totalToday:      tickets.filter(t => t.createdAt >= new Date(Date.now() - 86400000).toISOString()).length,
      totalOpen:       tickets.filter(t => !['RESOLVED','REJECTED','CLOSED_OVERRIDE'].includes(t.status)).length,
      resolvedThisMonth: tickets.filter(t => t.status === 'RESOLVED' && t.resolvedAt >= start).length,
      slaBreaches:     tickets.filter(t => t.slaBreached && t.status !== 'RESOLVED').length,
      ghostFlags:      tickets.filter(t => t.status === 'GHOST_FLAGGED').length,
      predictedIssues: await db.collection('predictions')
        .where('cameTrue', '==', null)
        .where('convertedToTicket', '==', false)
        .get().then(s => s.size),
    };

    res.json(overview);
  } catch (err) { next(err); }
});

// GET /api/analytics/departments — department performance
router.get('/departments', async (req, res, next) => {
  try {
    const tickets = await db.collection('tickets').get();
    const all     = tickets.docs.map(d => d.data());

    const DEPT_IDS = ['roads_infrastructure','water_supply','sanitation','electricity','parks_recreation'];

    const deptStats = DEPT_IDS.map(deptId => {
      const deptTickets    = all.filter(t => t.departmentId === deptId);
      const resolved       = deptTickets.filter(t => t.status === 'RESOLVED');
      const resolutionRate = deptTickets.length > 0
        ? Math.round((resolved.length / deptTickets.length) * 100) : 0;
      const avgDays = resolved.length > 0
        ? resolved.reduce((sum, t) => {
            const days = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000;
            return sum + days;
          }, 0) / resolved.length : 0;

      return {
        departmentId:    deptId,
        total:           deptTickets.length,
        resolved:        resolved.length,
        resolutionRate,
        avgResolutionDays: Math.round(avgDays * 10) / 10,
        slaBreaches:     deptTickets.filter(t => t.slaBreached).length,
        ghostFlags:      deptTickets.filter(t => t.status === 'GHOST_FLAGGED').length,
      };
    });

    res.json(deptStats);
  } catch (err) { next(err); }
});

// GET /api/analytics/wards — ward-wise statistics
router.get('/wards', async (req, res, next) => {
  try {
    const wardStats = await db.collection('ward_stats').get();
    res.json(wardStats.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) { next(err); }
});

// GET /api/analytics/trends?ward=ward_82&months=6 — issue trends
router.get('/trends', async (req, res, next) => {
  try {
    const { ward, months = 3 } = req.query;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - parseInt(months));

    let query = db.collection('tickets').where('createdAt', '>=', cutoff.toISOString());
    if (ward) query = query.where('location.ward', '==', ward);

    const tickets = await query.get();
    const all     = tickets.docs.map(d => d.data());

    // Group by month
    const byMonth = {};
    all.forEach(t => {
      const month = t.createdAt.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { total: 0, resolved: 0, categories: {} };
      byMonth[month].total++;
      if (t.status === 'RESOLVED') byMonth[month].resolved++;
      byMonth[month].categories[t.category] = (byMonth[month].categories[t.category] || 0) + 1;
    });

    res.json({ ward: ward || 'all', months: parseInt(months), data: byMonth });
  } catch (err) { next(err); }
});

module.exports = router;
```

### Wire Up in `backend/server.js`

```javascript
// ADD this line with the other route imports
app.use('/api/analytics', require('./routes/analytics'));
```

### Frontend: Analytics Hook `frontend/src/hooks/useAnalytics.js`

```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useAnalyticsOverview = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

export const useDepartmentStats = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/departments')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

export const useWardStats = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/wards')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
```

### What to Update in Existing Docs

- **Tech Implementation Guide** — Section 6.1 (server.js): add analytics route mount
- **Tech Implementation Guide** — Section 2 (Folder Structure): add `backend/routes/analytics.js` and `frontend/src/hooks/useAnalytics.js`
- **System Design** — Section 3.2 (API Routes table): add `/api/analytics/*` endpoints
- **Schema Guide** — No collection changes. Add note in Section 4.12 (`ward_stats`): "Primary source for analytics dashboard"
- **PRD v2.0** — Section 21 (Admin Dashboard, Sub-section 5.2 Overview): note that data comes from `/api/analytics/overview`

---

## Summary — All File Changes

### New Files to Create

| File | Purpose |
|---|---|
| `backend/services/queryFunctions.js` | Gemini function calling definitions + executors |
| `backend/routes/analytics.js` | Admin analytics API endpoints |
| `frontend/src/hooks/useAnalytics.js` | Analytics data hooks for admin dashboard |

### Existing Files to Modify

| File | Change |
|---|---|
| `backend/services/geminiService.js` | Add `responseMimeType`, replace `queryBot` with function-calling version |
| `backend/prompts/classify.js` | Rename `aiNotes` → `reasoning`, make always required |
| `backend/prompts/detectGhost.js` | Replace with structured verification report output |
| `backend/routes/tickets.js` | Store `evidenceReport` and `reasoning` on ticket document |
| `backend/workers/ghostWorker.js` | Update decision parsing to use `decision` field |
| `backend/server.js` | Add analytics route |

### Firestore Schema Changes (additions only, no breaking changes)

| Collection | Change |
|---|---|
| `tickets` | Add `evidenceReport` object (Feature 4) |
| `tickets.aiSuggested` | Rename `aiNotes` → `reasoning` (Feature 5) |
| `ticket_logs` | Add `ghostReport` object to metadata on ghost events (Feature 3) |

### Seed Data Changes

None — existing seed data covers all new fields with null/default values.

### Test Changes

Add test cases to existing test files (do not create new test files):

| Test File | New Tests to Add |
|---|---|
| `__tests__/services/geminiService.test.js` | Test queryBot with function calling loop, test structured output parsing |
| `__tests__/routes/tickets.test.js` | Test `evidenceReport` stored on resolution, test `reasoning` stored on creation |
| `__tests__/workers/ghostWorker.test.js` | Test new decision field parsing (`reject_resolution`, `needs_review`, `accept_resolution`) |
| `__tests__/routes/analytics.test.js` | New test file for analytics endpoints (overview, departments, wards, trends) |

---

## Build Order for Remaining Days

Given these are additions to a working system, implement in this order to minimize risk:

**Day 1 additions (low risk, high impact):**
1. Add `responseMimeType` to `callGemini()` — 15 minutes
2. Rename `aiNotes` → `reasoning` in classify prompt and schema — 30 minutes
3. Update ghost detection prompt to structured output — 30 minutes
4. Store `evidenceReport` on ticket resolution — 1 hour
5. Show confidence + reasoning in Step 2 UI — 2 hours

**Day 2 additions (medium risk, highest impact):**
6. Build `queryFunctions.js` — 2 hours
7. Replace `queryBot` with function-calling version — 2 hours
8. Test function calling end-to-end — 2 hours

**Day 3 additions (wire up existing designs):**
9. Build `analytics.js` routes — 2 hours
10. Build `useAnalytics.js` hooks — 1 hour
11. Wire analytics data into admin overview dashboard — 2 hours

---

*Community Hero — New Changes v2.1*
*BlockseBlock × Google AI Studio Hackathon | June 2026*
