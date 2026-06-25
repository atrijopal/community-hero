const router = require('express').Router();
const { db } = require('../config/firebase');
const { officerOrAdmin } = require('../middleware/authMiddleware');

// GET /api/analytics/overview
router.get('/overview', officerOrAdmin, async (req, res, next) => {
  try {
    const snap = await db.collection('tickets').get();
    const all  = snap.docs.map(d => d.data());
    const total    = all.length;
    const resolved = all.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status)).length;
    const open     = all.filter(t => !['RESOLVED','CLOSED_OVERRIDE','REJECTED'].includes(t.status)).length;
    const ghosts   = all.filter(t => t.ghostCount > 0).length;
    const slaBreached = all.filter(t => t.slaBreached).length;
    const avgResTime = calcAvgResTime(all.filter(t => t.resolvedAt));
    res.json({ total, resolved, open, ghosts, slaBreached, avgResolutionDays: avgResTime, resolutionRate: total ? Math.round(resolved / total * 100) : 0 });
  } catch (err) { next(err); }
});

// GET /api/analytics/departments
router.get('/departments', officerOrAdmin, async (req, res, next) => {
  try {
    const [ticketSnap, deptSnap] = await Promise.all([
      db.collection('tickets').get(),
      db.collection('departments').get(),
    ]);
    const tickets = ticketSnap.docs.map(d => d.data());
    const depts   = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const stats   = depts.map(dept => {
      const dt = tickets.filter(t => t.departmentId === dept.id);
      const resolved = dt.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status)).length;
      return {
        id: dept.id, name: dept.name,
        total: dt.length, resolved,
        resolutionRate: dt.length ? Math.round(resolved / dt.length * 100) : 0,
        avgDays: calcAvgResTime(dt.filter(t => t.resolvedAt)),
      };
    });
    res.json({ departments: stats });
  } catch (err) { next(err); }
});

// GET /api/analytics/wards
router.get('/wards', officerOrAdmin, async (req, res, next) => {
  try {
    const snap = await db.collection('tickets').get();
    const wardMap = {};
    for (const doc of snap.docs) {
      const t = doc.data();
      const w = t.location?.ward || 'Unknown';
      if (!wardMap[w]) wardMap[w] = { ward: w, total: 0, resolved: 0, open: 0 };
      wardMap[w].total++;
      if (['RESOLVED','CLOSED_OVERRIDE'].includes(t.status)) wardMap[w].resolved++;
      else wardMap[w].open++;
    }
    const wards = Object.values(wardMap).map(w => ({
      ...w,
      healthScore: w.total ? Math.round((w.resolved / w.total) * 100) : 0,
    }));
    res.json({ wards });
  } catch (err) { next(err); }
});

// GET /api/analytics/trends
router.get('/trends', officerOrAdmin, async (req, res, next) => {
  try {
    const snap = await db.collection('tickets').get();
    const monthly = {};
    for (const doc of snap.docs) {
      const t   = doc.data();
      const mo  = t.createdAt?.substring(0, 7) || 'unknown';
      if (!monthly[mo]) monthly[mo] = { month: mo, reported: 0, resolved: 0 };
      monthly[mo].reported++;
      if (['RESOLVED','CLOSED_OVERRIDE'].includes(t.status)) monthly[mo].resolved++;
    }
    const trends = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
    res.json({ trends });
  } catch (err) { next(err); }
});

function calcAvgResTime(resolvedTickets) {
  if (!resolvedTickets.length) return 0;
  const sum = resolvedTickets.reduce((acc, t) => {
    const days = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000;
    return acc + days;
  }, 0);
  return Math.round(sum / resolvedTickets.length * 10) / 10;
}

module.exports = router;
