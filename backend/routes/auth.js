const router = require('express').Router();
const { auth, db } = require('../config/firebase');
const { adminOnly } = require('../middleware/authMiddleware');

// GET /api/auth/me
router.get('/me', async (req, res) => {
  res.json({
    uid:  req.user.uid,
    role: req.user.role,
  });
});

// POST /api/auth/set-admin — set admin claim (one-time use, must be authenticated)
router.post('/set-admin', adminOnly, async (req, res, next) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    await auth.setCustomUserClaims(uid, { admin: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/auth/officer/:id/deactivate
router.post('/officer/:id/deactivate', adminOnly, async (req, res, next) => {
  try {
    await auth.updateUser(req.params.id, { disabled: true });
    await db.collection('officers').doc(req.params.id).update({ status: 'deactivated' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
