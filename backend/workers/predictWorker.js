const { db } = require('../config/firebase');
const gemini  = require('../services/geminiService');

const runPrediction = async () => {
  console.log('[Predict Worker] Running predictions...');
  try {
    // Get all tickets from last 90 days grouped by ward
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const snap = await db.collection('tickets')
      .where('createdAt', '>', cutoff.toISOString())
      .get();

    const wardMap = {};
    for (const doc of snap.docs) {
      const t = doc.data();
      const w = t.location?.ward || 'Unknown';
      if (!wardMap[w]) wardMap[w] = { ward: w, issues: [], lat: t.location?.lat, lng: t.location?.lng };
      wardMap[w].issues.push({
        issueType: t.issueType,
        month: t.createdAt?.substring(0, 7),
        resolved: ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status),
      });
    }

    for (const [ward, data] of Object.entries(wardMap)) {
      if (data.issues.length < 3) continue; // Need enough data
      try {
        const predictions = await gemini.predictIssues(data.issues, {
          ward, season: getSeason(), currentMonth: new Date().getMonth() + 1,
        });

        if (predictions && predictions.length > 0) {
          for (const pred of predictions) {
            await db.collection('predictions').add({
              ward, lat: data.lat, lng: data.lng,
              ...pred,
              generatedAt: new Date().toISOString(),
              active: true,
            });
          }
        }
      } catch (err) {
        console.error(`[Predict Worker] Error for ward ${ward}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Predict Worker] Failed:', err.message);
  }
};

function getSeason() {
  const m = new Date().getMonth();
  if (m >= 5 && m <= 8)  return 'monsoon';
  if (m >= 9 && m <= 11) return 'post-monsoon';
  if (m <= 1)            return 'winter';
  return 'summer';
}

const start = () => {
  setTimeout(runPrediction, 60000); // after 1 min
  setInterval(runPrediction, 24 * 60 * 60 * 1000); // daily
  console.log('[Predict Worker] Started');
};

module.exports = { start };
