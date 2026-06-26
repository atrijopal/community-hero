const router  = require('express').Router();
const { db, storage, admin } = require('../config/firebase');
const gemini  = require('../services/geminiService');
const notify  = require('../services/notifyService');
const { authMiddleware, optionalAuth, adminOnly, officerOrAdmin } = require('../middleware/authMiddleware');
const { ticketSchema } = require('../schemas/ticketSchema');
const { processPhoto } = require('../services/storageService');
const { rateLimiters } = require('../middleware/rateLimiter');
const { CITY_CODES }   = require('../config/constants');
const ngeohash = require('ngeohash');
const crypto   = require('crypto');
const multer   = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- POST / — create ticket ----------
router.post('/', rateLimiters.report, optionalAuth, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.body.data) return res.status(400).json({ error: 'Missing data field' });
    const body = JSON.parse(req.body.data);
    const { error } = ticketSchema.validate(body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    if (!req.file)  return res.status(400).json({ error: 'Photo required' });

    const processedPhoto = await processPhoto(req.file.buffer);
    const geohash = ngeohash.encode(body.location.lat, body.location.lng, 7);

    // Duplicate check — single equality filter only; geohash prefix checked in JS
    // (geohash range + issueType equality combo requires composite index — avoiding that)
    const CLOSED_STATUSES = new Set(['RESOLVED', 'REJECTED', 'CLOSED_OVERRIDE']);
    const geohashPrefix = geohash.substring(0, 6);
    const dupCheck = await db.collection('tickets')
      .where('issueType', '==', body.issueType)
      .limit(30)
      .get();

    const openDups = dupCheck.docs.filter(d => {
      const data = d.data();
      return !CLOSED_STATUSES.has(data.status) && data.location?.geohash?.startsWith(geohashPrefix);
    });
    if (openDups.length) {
      const dupData = openDups[0].data();
      try {
        const dupResult = await gemini.detectDuplicate(
          processedPhoto,
          dupData.photos?.report || null,
          {
            newIssueType:        body.issueType,
            newDescription:      body.description,
            existingIssueType:   dupData.issueType,
            existingDescription: dupData.description,
          },
        );
        if (dupResult?.is_duplicate && dupResult?.confidence >= 60) {
          return res.status(409).json({
            duplicate:       true,
            matchReason:     dupResult.reason,
            matchConfidence: dupResult.confidence,
            existingTicket:  {
              publicId:    dupData.publicId,
              issueType:   dupData.issueType,
              status:      dupData.status,
              severity:    dupData.severity,
              dangerLevel: dupData.dangerLevel,
              description: dupData.description,
              address:     dupData.location?.address,
              createdAt:   dupData.createdAt,
              photoUrl:    dupData.photos?.report || null,
            },
          });
        }
      } catch (_) {} // duplicate check failure is non-fatal
    }

    // Generate ticket ID
    const counter  = await getNextSequence(body.location.city);
    const cityCode = CITY_CODES[body.location.city] || 'GEN';
    const year     = new Date().getFullYear();
    const seq      = String(counter).padStart(5, '0');
    const salt     = crypto.randomBytes(3).toString('hex');
    const docId    = `${cityCode}-${year}-${seq}-${salt}`;
    const publicId = `${cityCode}-${year}-${seq}`;

    // Upload photo
    const photoUrl = await uploadPhoto(processedPhoto, docId, 'report');

    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + 7);

    let severity = body.severity;
    if (['open_manhole', 'exposed_wire'].includes(body.issueType)) {
      severity = Math.max(severity, 9);
    }

    const ticket = {
      publicId,
      status:         'UNASSIGNED',
      issueType:      body.issueType,
      category:       body.category,
      severity,
      dangerLevel:    body.dangerLevel,
      departmentId:   body.departmentId,
      description:    body.description,
      citizenDescription: body.description,
      aiSuggested:    body.aiSuggested || null,
      location: {
        geohash,
        lat:     body.location.lat,
        lng:     body.location.lng,
        ward:    body.location.ward,
        city:    body.location.city,
        address: body.location.address,
      },
      photos:         { report: photoUrl, resolution: null, reopen: [] },
      citizenId:      req.user?.uid || null,
      citizenPhone:   body.phone  || null,
      citizenEmail:   body.email  || null,
      assignedOfficerId:   null,
      assignedOfficerName: null,
      slaDeadline:    slaDeadline.toISOString(),
      upvoteCount:    0,
      upvoterIds:     [],
      verificationStatus: 'PENDING',
      verifierIds:    [],
      ghostWindowOpen:   false,
      ghostWindowExpiry: null,
      ghostCount:     0,
      overrideCount:  0,
      resolutionRetries: 0,
      reminderSent:   false,
      rtiGenerated:   false,
      appealGenerated: false,
      slaBreached:    false,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    };

    await db.collection('tickets').doc(docId).set(ticket);
    await logAction(docId, req.user?.uid || 'anonymous', 'TICKET_CREATED', null, 'UNASSIGNED');

    if (body.phone || body.email) {
      notify.ticketCreated({ publicId, phone: body.phone, email: body.email }).catch(console.error);
    }

    // Award XP if logged in
    if (req.user?.uid) {
      awardXP(req.user.uid, 50, 'ticket_created').catch(console.error);
    }

    res.status(201).json({
      ticketId:    publicId,
      docId,
      status:      'UNASSIGNED',
      slaDeadline: slaDeadline.toISOString(),
      trackUrl:    `${process.env.FRONTEND_URL || ''}/track/${publicId}`,
    });
  } catch (err) { console.error('[POST /tickets] Error:', err.message, err.stack?.split('\n')[1]); next(err); }
});

// ---------- GET / — list tickets (officer/admin) ----------
router.get('/', authMiddleware, officerOrAdmin, async (req, res, next) => {
  try {
    let q = db.collection('tickets');
    const { status, departmentId, ward, officerId, limit: lim = 50 } = req.query;
    if (status)       q = q.where('status', '==', status);
    if (departmentId) q = q.where('departmentId', '==', departmentId);
    if (ward)         q = q.where('location.ward', '==', ward);
    if (officerId)    q = q.where('assignedOfficerId', '==', officerId);
    // No orderBy — avoids composite index requirement when filters are combined; sort in JS
    q = q.limit(parseInt(lim));

    const snap = await q.get();
    const tickets = snap.docs
      .map(d => {
        const { internalNotes, citizenPhone, citizenEmail, ...pub } = d.data();
        return { id: d.id, ...pub };
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    res.json({ tickets, count: tickets.length });
  } catch (err) { next(err); }
});

// ---------- GET /:publicId — public ticket view ----------
router.get('/:publicId', async (req, res, next) => {
  try {
    const snap = await db.collection('tickets')
      .where('publicId', '==', req.params.publicId)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({ error: 'Ticket not found' });
    const data = snap.docs[0].data();
    const { internalNotes, citizenPhone, citizenEmail, ...publicData } = data;
    res.json({ id: snap.docs[0].id, ...publicData });
  } catch (err) { next(err); }
});

// ---------- PATCH /:id/assign — admin assigns officer ----------
router.patch('/:id/assign', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { officerId, internalNote } = req.body;
    if (!officerId) return res.status(400).json({ error: 'officerId required' });

    const officerDoc = await db.collection('officers').doc(officerId).get();
    if (!officerDoc.exists || officerDoc.data().status !== 'active') {
      return res.status(400).json({ error: 'Officer not found or inactive' });
    }
    const officer = officerDoc.data();

    const ticketRef = db.collection('tickets').doc(req.params.id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) return res.status(404).json({ error: 'Ticket not found' });

    await ticketRef.update({
      status:              'ASSIGNED',
      assignedOfficerId:   officerId,
      assignedOfficerName: officer.name,
      departmentId:        officer.departmentId,
      internalNotes:       internalNote || '',
      updatedAt:           new Date().toISOString(),
    });

    await db.collection('officers').doc(officerId).update({
      activeCaseCount: admin.firestore.FieldValue.increment(1),
      totalAssigned:   admin.firestore.FieldValue.increment(1),
    });

    await logAction(req.params.id, req.user.uid, 'OFFICER_ASSIGNED', ticketSnap.data().status, 'ASSIGNED', { officerId });

    const ticket = ticketSnap.data();
    notify.officerAssigned({ ticket, officer }).catch(console.error);

    res.json({ status: 'ASSIGNED', assignedOfficer: { name: officer.name, department: officer.departmentId } });
  } catch (err) { next(err); }
});

// ---------- PATCH /:id/status — officer updates status ----------
router.patch('/:id/status', authMiddleware, officerOrAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['IN_PROGRESS', 'ASSIGNED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status transition' });

    const ticketRef = db.collection('tickets').doc(req.params.id);
    const snap = await ticketRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Ticket not found' });
    if (snap.data().assignedOfficerId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not assigned to this ticket' });
    }

    await ticketRef.update({ status, updatedAt: new Date().toISOString() });
    await logAction(req.params.id, req.user.uid, `STATUS_UPDATE_${status}`, snap.data().status, status);
    res.json({ status });
  } catch (err) { next(err); }
});

// ---------- POST /:id/resolution — officer uploads proof ----------
router.post('/:id/resolution', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    const ticketRef  = db.collection('tickets').doc(req.params.id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketSnap.data();
    if (ticket.assignedOfficerId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not assigned to this ticket' });
    }
    if (!req.file) return res.status(400).json({ error: 'Resolution photo required' });

    const processedPhoto  = await processPhoto(req.file.buffer);
    const resolutionUrl   = await uploadPhoto(processedPhoto, req.params.id, 'resolution');

    const validation = await gemini.validateResolution(ticket.photos.report, resolutionUrl);

    const evidenceReport = {
      officerId:       req.user.uid,
      submittedAt:     new Date().toISOString(),
      beforePhotoUrl:  ticket.photos.report,
      afterPhotoUrl:   resolutionUrl,
      geminiConfidence: validation.confidence_score || validation.confidence || 0,
      sameLocation:    validation.same_location,
      issueResolved:   validation.issue_resolved_in_image2 || validation.issue_resolved,
      rejectionReason: validation.rejection_reason || null,
      approved:        false,
    };

    if ((validation.confidence_score || validation.confidence || 0) >= 70 &&
        (validation.issue_resolved_in_image2 || validation.issue_resolved) &&
        validation.same_location) {

      evidenceReport.approved = true;
      const ghostExpiry = new Date();
      ghostExpiry.setDate(ghostExpiry.getDate() + 14);

      await ticketRef.update({
        status:           'RESOLVED',
        'photos.resolution': resolutionUrl,
        resolvedAt:       new Date().toISOString(),
        ghostWindowOpen:  true,
        ghostWindowExpiry: ghostExpiry.toISOString(),
        evidenceReport,
        updatedAt:        new Date().toISOString(),
      });

      await db.collection('officers').doc(req.user.uid).update({
        activeCaseCount: admin.firestore.FieldValue.increment(-1),
        resolvedCount:   admin.firestore.FieldValue.increment(1),
      });

      await logAction(req.params.id, req.user.uid, 'RESOLVED', ticket.status, 'RESOLVED', { evidenceReport });
      notify.ticketResolved({ ticket }).catch(console.error);

      return res.json({ status: 'RESOLVED', geminiValidation: validation, evidenceReport });
    } else {
      const retries = (ticket.resolutionRetries || 0) + 1;
      await ticketRef.update({
        resolutionRetries: retries,
        evidenceReport,
        updatedAt: new Date().toISOString(),
      });

      if (retries >= 3) {
        await ticketRef.update({ status: 'ESCALATED' });
        notify.escalatedAfterFailedResolution({ ticket }).catch(console.error);
      }

      return res.status(422).json({
        status: 'RESOLUTION_REJECTED',
        geminiValidation: validation,
        evidenceReport,
        retriesRemaining: Math.max(0, 3 - retries),
      });
    }
  } catch (err) { next(err); }
});

// ---------- POST /:id/reopen — citizen ghost re-open ----------
router.post('/:id/reopen', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    const ticketRef  = db.collection('tickets').doc(req.params.id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketSnap.data();

    if (!ticket.ghostWindowOpen) {
      return res.status(400).json({ error: 'Ghost window has closed for this ticket' });
    }
    if (!req.file) return res.status(400).json({ error: 'New photo required for re-open' });

    const processedPhoto = await processPhoto(req.file.buffer);
    const reopenUrl = await uploadPhoto(processedPhoto, req.params.id, 'reopen');

    await ticketRef.update({
      status:   'UNASSIGNED',
      'photos.reopen': admin.firestore.FieldValue.arrayUnion(reopenUrl),
      ghostWindowOpen: false,
      updatedAt: new Date().toISOString(),
    });

    await logAction(req.params.id, req.user.uid, 'GHOST_REOPEN', 'RESOLVED', 'UNASSIGNED');
    if (req.user?.uid) awardXP(req.user.uid, 150, 'ghost_catch').catch(console.error);

    res.json({ status: 'UNASSIGNED', message: 'Ticket reopened for review' });
  } catch (err) { next(err); }
});

// ---------- POST /:id/upvote ----------
router.post('/:id/upvote', optionalAuth, async (req, res, next) => {
  try {
    const ticketRef = db.collection('tickets').doc(req.params.id);
    const userId = req.user?.uid || req.body.phone || req.body.email;
    if (!userId) return res.status(400).json({ error: 'Login or provide contact to upvote' });
    const ticket = (await ticketRef.get()).data();
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    if (ticket.upvoterIds?.includes(userId)) return res.status(409).json({ error: 'Already upvoted' });

    await ticketRef.update({
      upvoteCount: admin.firestore.FieldValue.increment(1),
      upvoterIds:  admin.firestore.FieldValue.arrayUnion(userId),
    });
    if (req.user?.uid) awardXP(req.user.uid, 5, 'upvote').catch(console.error);
    res.json({ upvoteCount: (ticket.upvoteCount || 0) + 1 });
  } catch (err) { next(err); }
});

// ---------- POST /:id/query — NLP bot ----------
router.post('/:id/query', rateLimiters.queryBot, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.length > 300) {
      return res.status(400).json({ error: 'Question required (max 300 chars)' });
    }
    const snap = await db.collection('tickets')
      .where('publicId', '==', req.params.id).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Ticket not found' });
    const { internalNotes, citizenPhone, citizenEmail, ...ticketData } = snap.docs[0].data();
    const answer = await gemini.queryBot(question, ticketData);
    res.json({ answer });
  } catch (err) { next(err); }
});

// ---------- POST /:id/rate — citizen rates resolution ----------
router.post('/:id/rate', authMiddleware, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
    const ticketRef = db.collection('tickets').doc(req.params.id);
    await ticketRef.update({
      citizenRating:  rating,
      citizenComment: comment || null,
      ratedAt:        new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---------- GET /:id/logs — ticket audit trail ----------
router.get('/:id/logs', async (req, res, next) => {
  try {
    // No orderBy — avoids composite index; sort by timestamp in JS
    const snap = await db.collection('ticket_logs')
      .where('ticketId', '==', req.params.id)
      .get();
    const logs = snap.docs
      .map(d => d.data())
      .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    res.json({ logs });
  } catch (err) { next(err); }
});

// ---------- Helper functions ----------
async function getNextSequence(city) {
  const key = city || 'GEN';
  const counterRef = db.collection('counters').doc(key);
  return await db.runTransaction(async (t) => {
    const doc  = await t.get(counterRef);
    const next = (doc.data()?.count || 0) + 1;
    t.set(counterRef, { count: next }, { merge: true });
    return next;
  });
}

async function uploadPhoto(buffer, ticketId, type) {
  const bucket = storage.bucket();
  const path   = `tickets/${ticketId}/${type}/${Date.now()}.jpg`;
  const file   = bucket.file(path);
  await file.save(buffer, { contentType: 'image/jpeg' });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

async function logAction(ticketId, actorId, action, prevState, newState, metadata = {}) {
  await db.collection('ticket_logs').add({
    ticketId, actorId, action,
    previousState: prevState,
    newState,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

async function awardXP(userId, amount, reason) {
  const ref = db.collection('gamification').doc(userId);
  await db.runTransaction(async (t) => {
    const doc  = await t.get(ref);
    const data = doc.data() || { xp: 0, level: 1, streak: 0, badges: [] };
    const newXP = (data.xp || 0) + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    t.set(ref, { ...data, xp: newXP, level: newLevel, lastActivity: new Date().toISOString() }, { merge: true });
  });
}

module.exports = router;
