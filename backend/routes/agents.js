const router  = require('express').Router();
const { db }  = require('../config/firebase');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { runSLACheck }   = require('../workers/slaWorker');
const { triageUnassigned } = require('../agents/triageAgent');

// All agent routes require admin auth
router.use(authMiddleware, adminOnly);

// GET /api/agents/logs — recent agent decisions (triage + SLA)
router.get('/logs', async (req, res, next) => {
  try {
    const snap = await db.collection('agent_logs').limit(100).get();
    const logs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    res.json({ logs });
  } catch (err) { next(err); }
});

// POST /api/agents/sla-check — run SLA/RTI/appeal agent now
router.post('/sla-check', async (req, res, next) => {
  try {
    await runSLACheck();
    res.json({ ok: true, message: 'SLA check complete — RTI and escalations processed' });
  } catch (err) { next(err); }
});

// POST /api/agents/triage — auto-assign all UNASSIGNED tickets
router.post('/triage', async (req, res, next) => {
  try {
    const results = await triageUnassigned();
    res.json({ ok: true, processed: results.length, results });
  } catch (err) { next(err); }
});

// GET /api/agents/duplicates — tickets flagged as probable duplicates
router.get('/duplicates', async (req, res, next) => {
  try {
    const snap = await db.collection('tickets')
      .where('probableDuplicateOf', '!=', '')
      .limit(50)
      .get();
    const dupes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch original tickets for each duplicate
    const pairs = await Promise.all(dupes.map(async (t) => {
      let original = null;
      if (t.probableDuplicateOf) {
        const origSnap = await db.collection('tickets')
          .where('publicId', '==', t.probableDuplicateOf)
          .limit(1)
          .get();
        if (!origSnap.empty) {
          original = { id: origSnap.docs[0].id, ...origSnap.docs[0].data() };
        }
      }
      return { duplicate: t, original };
    }));

    res.json({ pairs: pairs.filter(p => p.original) });
  } catch (err) { next(err); }
});

// DELETE /api/agents/duplicates/:id — soft-delete duplicate, notify citizen
router.delete('/duplicates/:id', async (req, res, next) => {
  try {
    const docRef = db.collection('tickets').doc(req.params.id);
    const snap   = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = snap.data();
    if (!ticket.probableDuplicateOf) {
      return res.status(400).json({ error: 'This ticket is not flagged as a duplicate' });
    }

    await docRef.update({
      status:          'REJECTED',
      rejectionReason: `Merged: duplicate of ${ticket.probableDuplicateOf}`,
      updatedAt:       new Date().toISOString(),
    });

    await db.collection('ticket_logs').add({
      ticketId:  req.params.id,
      action:    'DUPLICATE_MERGED',
      actorId:   req.user.uid,
      mergedInto:ticket.probableDuplicateOf,
      note:      req.body.note || '',
      timestamp: new Date().toISOString(),
    });

    // Notify citizen (non-fatal)
    try {
      const notify = require('../services/notifyService');
      await notify.duplicateMerged?.({ ticket, mergedInto: ticket.probableDuplicateOf });
    } catch (_) {}

    res.json({ ok: true, mergedInto: ticket.probableDuplicateOf });
  } catch (err) { next(err); }
});

module.exports = router;
