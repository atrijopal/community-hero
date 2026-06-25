const { auth } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token   = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid:  decoded.uid,
      role: decoded.admin          ? 'admin'
          : decoded.senior_officer ? 'senior_officer'
          : decoded.officer        ? 'officer'
          : 'citizen',
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token   = header.split('Bearer ')[1];
      const decoded = await auth.verifyIdToken(token);
      req.user = { uid: decoded.uid };
    } catch (_) {}
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const officerOrAdmin = (req, res, next) => {
  if (!['officer','senior_officer','admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Officer or admin only' });
  }
  next();
};

module.exports = { authMiddleware, optionalAuth, adminOnly, officerOrAdmin };
