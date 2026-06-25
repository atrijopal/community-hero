const router = require('express').Router();
const { db, auth, admin } = require('../config/firebase');
const { adminOnly, officerOrAdmin } = require('../middleware/authMiddleware');

// GET /api/staff/officers — list officers
router.get('/officers', officerOrAdmin, async (req, res, next) => {
  try {
    const { departmentId, ward, status = 'active', limit: lim = 50 } = req.query;
    let q = db.collection('officers');
    if (status)       q = q.where('status', '==', status);
    if (departmentId) q = q.where('departmentId', '==', departmentId);
    q = q.orderBy('name').limit(parseInt(lim));
    const snap = await q.get();
    const officers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ officers });
  } catch (err) { next(err); }
});

// GET /api/staff/officers/assignable — workload-balanced for assignment dropdown
router.get('/officers/assignable', adminOnly, async (req, res, next) => {
  try {
    const { departmentId, ward } = req.query;
    let q = db.collection('officers').where('status', '==', 'active');
    if (departmentId) q = q.where('departmentId', '==', departmentId);
    const snap = await q.orderBy('activeCaseCount', 'asc').limit(20).get();
    const officers = snap.docs.map(d => {
      const { password, ...safe } = d.data();
      return { id: d.id, ...safe };
    });
    // Filter by ward if provided (client-side since Firestore doesn't support array-contains with ordering)
    const filtered = ward
      ? officers.filter(o => !o.wardIds || o.wardIds.length === 0 || o.wardIds.includes(ward))
      : officers;
    res.json({ officers: filtered });
  } catch (err) { next(err); }
});

// GET /api/staff/officers/:id
router.get('/officers/:id', officerOrAdmin, async (req, res, next) => {
  try {
    const doc = await db.collection('officers').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Officer not found' });
    const { password, ...safe } = doc.data();
    res.json({ id: doc.id, ...safe });
  } catch (err) { next(err); }
});

// POST /api/staff/officers — admin creates officer
router.post('/officers', adminOnly, async (req, res, next) => {
  try {
    const { name, email, password, designation, departmentId, wardIds, phone } = req.body;
    if (!name || !email || !password || !designation || !departmentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email, password, displayName: name,
    });

    // Set officer custom claim
    await auth.setCustomUserClaims(userRecord.uid, { officer: true });

    const officer = {
      uid:             userRecord.uid,
      name, email, designation, departmentId,
      wardIds:         wardIds || [],
      phone:           phone || null,
      status:          'active',
      activeCaseCount: 0,
      totalAssigned:   0,
      resolvedCount:   0,
      ghostClosureCount: 0,
      overrideCount:   0,
      accountabilityScore: 100,
      performanceScore: 100,
      joinedAt:        new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    await db.collection('officers').doc(userRecord.uid).set(officer);
    res.status(201).json({ id: userRecord.uid, ...officer });
  } catch (err) { next(err); }
});

// PATCH /api/staff/officers/:id — edit officer
router.patch('/officers/:id', adminOnly, async (req, res, next) => {
  try {
    const allowed = ['name','designation','departmentId','wardIds','phone','status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date().toISOString();
    await db.collection('officers').doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (err) { next(err); }
});

// DELETE /api/staff/officers/:id — deactivate (soft delete)
router.delete('/officers/:id', adminOnly, async (req, res, next) => {
  try {
    await db.collection('officers').doc(req.params.id).update({
      status: 'deactivated', updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true, message: 'Officer deactivated' });
  } catch (err) { next(err); }
});

// GET /api/staff/departments
router.get('/departments', officerOrAdmin, async (req, res, next) => {
  try {
    const snap = await db.collection('departments').get();
    res.json({ departments: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) { next(err); }
});

// POST /api/staff/departments
router.post('/departments', adminOnly, async (req, res, next) => {
  try {
    const { id, name, slaDefault, issueTypes, headOfficerId } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    await db.collection('departments').doc(id).set({
      name, slaDefault: slaDefault || 7, issueTypes: issueTypes || [],
      headOfficerId: headOfficerId || null,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ id, name });
  } catch (err) { next(err); }
});

module.exports = router;
