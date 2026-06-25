const rateLimit = require('express-rate-limit');

const rateLimiters = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  report: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many reports. Try again in an hour.' },
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  }),
  ai: rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
    message: { error: 'AI rate limit reached. Try again shortly.' },
  }),
  queryBot: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
  }),
};

module.exports = { rateLimiters };
