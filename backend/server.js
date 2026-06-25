require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');

const ticketRoutes    = require('./routes/tickets');
const authRoutes      = require('./routes/auth');
const staffRoutes     = require('./routes/staff');
const aiRoutes        = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');

const { authMiddleware } = require('./middleware/authMiddleware');
const { rateLimiters }   = require('./middleware/rateLimiter');

// Start background workers
require('./workers/slaWorker').start();
require('./workers/ghostWorker').start();
require('./workers/predictWorker').start();
require('./workers/verifyTimeoutWorker').start();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check (Cloud Run requirement)
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/tickets',   rateLimiters.general, ticketRoutes);
app.use('/api/auth',      rateLimiters.auth,    authMiddleware, authRoutes);
app.use('/api/staff',     rateLimiters.general, authMiddleware, staffRoutes);
app.use('/api/ai',        rateLimiters.ai,      aiRoutes);
app.use('/api/analytics', rateLimiters.general, authMiddleware, analyticsRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack, path: req.path }));
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
