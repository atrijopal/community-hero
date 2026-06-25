const { db } = require('../config/firebase');
const gemini  = require('../services/geminiService');
const notify  = require('../services/notifyService');
const pdfSvc  = require('../services/pdfService');

const INTERVALS = { REMINDER: 7, ESCALATE: 14, RTI: 30, APPEAL: 60 };

const runSLACheck = async () => {
  console.log('[SLA Worker] Running check...');
  const now = new Date();

  try {
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
            timestamp: now.toISOString(), actorId: 'system',
          });
          await doc.ref.update({ appealGenerated: true, updatedAt: now.toISOString() });
          await notify.appealReady({ ticket, appealText });

        } else if (daysSince >= INTERVALS.RTI && !ticket.rtiGenerated) {
          const rtiText = await gemini.generateRTI(ticket);
          const pdfUrl  = pdfSvc ? await pdfSvc.generateRTIPdf(rtiText, ticket.publicId) : null;
          await doc.ref.update({
            rtiGenerated: true,
            rtiPdfUrl:    pdfUrl,
            rtiText,
            status:       'RTI_FILED',
            updatedAt:    now.toISOString(),
          });
          await db.collection('ticket_logs').add({
            ticketId: doc.id, action: 'RTI_GENERATED',
            timestamp: now.toISOString(), actorId: 'system',
          });
          await notify.rtiReady({ ticket, pdfUrl });

        } else if (daysSince >= INTERVALS.ESCALATE && !['ESCALATED','RTI_FILED'].includes(ticket.status)) {
          await doc.ref.update({ status: 'ESCALATED', updatedAt: now.toISOString() });
          await db.collection('ticket_logs').add({
            ticketId: doc.id, action: 'AUTO_ESCALATED',
            timestamp: now.toISOString(), actorId: 'system',
          });
          await notify.escalated({ ticket, note: `Auto-escalated after ${Math.floor(daysSince)} days` });

        } else if (daysSince >= INTERVALS.REMINDER && !ticket.reminderSent) {
          await doc.ref.update({ reminderSent: true, updatedAt: now.toISOString() });
          await notify.officerReminder({ ticket });
        }

        // SLA breach flag
        if (ticket.slaDeadline && new Date(ticket.slaDeadline) < now && !ticket.slaBreached) {
          await doc.ref.update({ slaBreached: true });
        }
      } catch (err) {
        console.error(`[SLA Worker] Error on ticket ${doc.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[SLA Worker] Query failed:', err.message);
  }
};

const start = () => {
  // Run after 10s delay to let server start
  setTimeout(runSLACheck, 10000);
  setInterval(runSLACheck, 60 * 60 * 1000); // every hour
  console.log('[SLA Worker] Started');
};

module.exports = { start };
