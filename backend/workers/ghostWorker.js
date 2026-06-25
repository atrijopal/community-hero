const { db, admin } = require('../config/firebase');
const gemini        = require('../services/geminiService');
const notify        = require('../services/notifyService');

const runGhostCheck = async () => {
  console.log('[Ghost Worker] Running check...');
  const now = new Date();

  try {
    const resolvedSnap = await db.collection('tickets')
      .where('status', '==', 'RESOLVED')
      .where('ghostWindowOpen', '==', true)
      .get();

    for (const doc of resolvedSnap.docs) {
      const ticket = doc.data();

      // Check if ghost window expired
      if (ticket.ghostWindowExpiry && new Date(ticket.ghostWindowExpiry) < now) {
        await doc.ref.update({ ghostWindowOpen: false });
        continue;
      }

      // Find new reports at same location
      const prefix  = ticket.location?.geohash?.substring(0, 6);
      if (!prefix) continue;

      const newSnap = await db.collection('tickets')
        .where('location.geohash', '>=', prefix)
        .where('location.geohash', '<=', prefix + '')
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

          // Store ghost report in logs
          await db.collection('ticket_logs').add({
            ticketId:    doc.id,
            action:      'GHOST_CHECK',
            newTicketId: newDoc.id,
            ghostReport: result,
            timestamp:   now.toISOString(),
            actorId:     'system',
          });

          if (result.decision === 'reject_resolution' && result.confidence >= 65) {
            // Ghost confirmed — reopen original ticket
            await doc.ref.update({
              status:    'GHOST_FLAGGED',
              ghostCount: admin.firestore.FieldValue.increment(1),
              ghostReport: result,
              updatedAt:  now.toISOString(),
            });

            // Penalize officer accountability
            if (ticket.assignedOfficerId) {
              const penalty = (ticket.overrideCount || 0) > 0 ? -20 : -10;
              await db.collection('officers').doc(ticket.assignedOfficerId).update({
                ghostClosureCount:   admin.firestore.FieldValue.increment(1),
                accountabilityScore: admin.firestore.FieldValue.increment(penalty),
              });

              const officerDoc = await db.collection('officers').doc(ticket.assignedOfficerId).get();
              if (officerDoc.exists && (officerDoc.data().ghostClosureCount || 0) >= 3) {
                await notify.adminGhostEscalation({ ticket, officer: officerDoc.data() });
              }
            }

            await notify.ghostDetected({ originalTicket: ticket, newTicket });

          } else if (result.decision === 'needs_review' || (result.confidence >= 40 && result.confidence < 65)) {
            // Flag for admin review
            await db.collection('ticket_logs').add({
              ticketId:    doc.id,
              action:      'GHOST_REVIEW_NEEDED',
              confidence:  result.confidence,
              newTicketId: newDoc.id,
              ghostReport: result,
              timestamp:   now.toISOString(),
              actorId:     'system',
            });
          }
        } catch (err) {
          console.error(`[Ghost Worker] Error on ticket ${doc.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[Ghost Worker] Query failed:', err.message);
  }
};

const start = () => {
  setTimeout(runGhostCheck, 30000);
  setInterval(runGhostCheck, 6 * 60 * 60 * 1000); // every 6 hours
  console.log('[Ghost Worker] Started');
};

module.exports = { start };
