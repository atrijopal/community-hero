const { db, admin } = require('../config/firebase');

/**
 * Autonomous triage agent — runs after ticket creation.
 * Decisions: classify (logged) → find department officer → load-balance assign → set SLA context.
 * Each step is logged to agent_logs with full reasoning for demo narration.
 */
async function runTriageAgent(ticketId, ticket) {
  const now  = new Date();
  const log  = {
    type:      'TRIAGE',
    ticketId,
    publicId:  ticket.publicId,
    steps:     [],
    success:   false,
    timestamp: now.toISOString(),
  };

  try {
    // ── Step 1: Classification (done by AI at upload — log it) ──────────────
    log.steps.push({
      step:       'classify',
      decision:   ticket.issueType,
      confidence: ticket.aiSuggested?.confidence ?? null,
      reasoning:  ticket.aiSuggested?.reasoning  ?? 'AI-classified during photo upload',
      department: ticket.departmentId,
      severity:   ticket.severity,
    });

    // ── Step 2: Find least-loaded active officer in department ───────────────
    const officerSnap = await db.collection('officers')
      .where('status', '==', 'active')
      .limit(50)
      .get();

    const deptOfficers = officerSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(o => o.departmentId === ticket.departmentId)
      .sort((a, b) => (a.activeCaseCount ?? 0) - (b.activeCaseCount ?? 0));

    log.steps.push({
      step:       'find_officer',
      department: ticket.departmentId,
      candidates: deptOfficers.map(o => ({ name: o.name, load: o.activeCaseCount ?? 0 })),
      decision:   deptOfficers.length > 0 ? deptOfficers[0].name : 'no officer available',
      reasoning:  deptOfficers.length > 0
        ? `Selected ${deptOfficers[0].name} — lowest load (${deptOfficers[0].activeCaseCount ?? 0} active cases) in ${ticket.departmentId.replace(/_/g, ' ')}`
        : `No active officers found in ${ticket.departmentId}`,
    });

    if (deptOfficers.length === 0) {
      log.steps.push({ step: 'assign', decision: 'SKIPPED', reasoning: 'No officers available — ticket stays UNASSIGNED for manual assignment' });
      await db.collection('agent_logs').add(log);
      return { assigned: null, log };
    }

    const officer = deptOfficers[0];

    // ── Step 3: Auto-assign (atomic transaction) ─────────────────────────────
    await db.runTransaction(async (tx) => {
      const ticketRef  = db.collection('tickets').doc(ticketId);
      const officerRef = db.collection('officers').doc(officer.id);
      const logRef     = db.collection('ticket_logs').doc();

      // Verify ticket is still unassigned before committing
      const ticketDoc = await tx.get(ticketRef);
      if (!ticketDoc.exists) throw new Error('Ticket not found');
      if (ticketDoc.data().status !== 'UNASSIGNED') throw new Error('Ticket already assigned');

      tx.update(ticketRef, {
        status:              'ASSIGNED',
        assignedOfficerId:   officer.id,
        assignedOfficerName: officer.name,
        updatedAt:           now.toISOString(),
      });
      tx.update(officerRef, {
        activeCaseCount: admin.firestore.FieldValue.increment(1),
        totalAssigned:   admin.firestore.FieldValue.increment(1),
      });
      tx.set(logRef, {
        ticketId,
        action:      'OFFICER_ASSIGNED',
        newState:    'ASSIGNED',
        actorId:     'triage_agent',
        officerId:   officer.id,
        officerName: officer.name,
        timestamp:   now.toISOString(),
      });
    });

    log.steps.push({
      step:        'assign',
      decision:    `Assigned to ${officer.name}`,
      officerId:   officer.id,
      officerName: officer.name,
      reasoning:   `Load-balanced: ${officer.name} has ${officer.activeCaseCount ?? 0} active cases vs next candidate's ${deptOfficers[1]?.activeCaseCount ?? 'N/A'}`,
    });

    // ── Step 4: SLA context ──────────────────────────────────────────────────
    const slaDays = ticket.severity >= 9 ? 3 : ticket.severity >= 7 ? 5 : 7;
    log.steps.push({
      step:      'sla',
      decision:  ticket.slaDeadline,
      reasoning: `${slaDays}-day SLA assigned based on severity ${ticket.severity}/10 (${ticket.dangerLevel} risk)`,
    });

    log.assignedOfficerId   = officer.id;
    log.assignedOfficerName = officer.name;
    log.success = true;

  } catch (err) {
    log.error   = err.message;
    log.success = false;
    console.error('[Triage Agent] Error:', err.message);
  }

  await db.collection('agent_logs').add(log);
  return { assigned: log.assignedOfficerName || null, log };
}

/**
 * Re-triage a batch of UNASSIGNED tickets — called from admin panel.
 */
async function triageUnassigned() {
  const snap = await db.collection('tickets').where('status', '==', 'UNASSIGNED').limit(20).get();
  const results = [];
  for (const doc of snap.docs) {
    const r = await runTriageAgent(doc.id, doc.data());
    results.push({ ticketId: doc.id, publicId: doc.data().publicId, assigned: r.assigned });
  }
  return results;
}

module.exports = { runTriageAgent, triageUnassigned };
