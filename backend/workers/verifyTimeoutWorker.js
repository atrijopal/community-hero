const { db } = require('../config/firebase');

const runVerifyTimeout = async () => {
  const now    = new Date();
  const cutoff = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago

  try {
    // Single equality filter only — range on createdAt requires composite index; filter in JS instead
    const snap = await db.collection('tickets')
      .where('verificationStatus', '==', 'PENDING')
      .get();
    const cutoffISO = cutoff.toISOString();

    for (const doc of snap.docs) {
      const ticket = doc.data();
      if (!ticket.createdAt || ticket.createdAt >= cutoffISO) continue;
      // Auto-verify if enough community upvotes (3+)
      if ((ticket.upvoteCount || 0) >= 3 || (ticket.verifierIds?.length || 0) >= 2) {
        await doc.ref.update({ verificationStatus: 'VERIFIED', updatedAt: now.toISOString() });
      } else {
        // Verify anyway after 2 hours (no verification = move forward)
        await doc.ref.update({ verificationStatus: 'AUTO_VERIFIED', updatedAt: now.toISOString() });
      }
    }
  } catch (err) {
    console.error('[Verify Worker] Failed:', err.message);
  }
};

const start = () => {
  setTimeout(runVerifyTimeout, 15000);
  setInterval(runVerifyTimeout, 30 * 60 * 1000); // every 30 min
  console.log('[Verify Worker] Started');
};

module.exports = { start };
