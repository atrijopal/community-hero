const router  = require('express').Router();
const { upload } = require('../middleware/uploadMiddleware');
const { rateLimiters } = require('../middleware/rateLimiter');
const { optionalAuth } = require('../middleware/authMiddleware');
const gemini  = require('../services/geminiService');
const { translate } = require('../services/translateService');

// POST /api/ai/classify — classify issue from photo
router.post('/classify', rateLimiters.ai, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo required' });
    const { city = 'Kolkata', season, timeOfDay } = req.body;
    const result = await gemini.classifyIssue(req.file.buffer, { city, season, timeOfDay });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/ai/verify — verify photo matches declared category + classify
router.post('/verify', rateLimiters.ai, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo required' });
    const { city = 'Kolkata', season, declaredCategory, declaredType, description } = req.body;

    // If no declared category (AI-decide escape hatch), fall back to classify
    if (!declaredCategory) {
      const result = await gemini.classifyIssue(req.file.buffer, { city, season });
      return res.json({ ...result, match: true, matchConfidence: 100, detectedType: result.issueType, mismatchReason: null });
    }

    const result = await gemini.verifyReport(req.file.buffer, { city, season, declaredCategory, declaredType, description });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/ai/translate — translate text via Google Translate API
router.post('/translate', rateLimiters.ai, async (req, res, next) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    if (!['en', 'hi', 'bn'].includes(targetLang)) {
      return res.status(400).json({ error: 'targetLang must be en, hi, or bn' });
    }
    const translated = await translate(text, targetLang);
    res.json({ translated, targetLang });
  } catch (err) { next(err); }
});

module.exports = router;
