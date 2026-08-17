/**
 * Express application factory
 * Kept separate from server.js so tests can import the app without opening a port.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route modules (registered in Step 3)
const authRoutes = require('./routes/auth.routes');
const lessonRoutes = require('./routes/lesson.routes');
const questionRoutes = require('./routes/question.routes');
const progressRoutes = require('./routes/progress.routes');
const vocabularyRoutes = require('./routes/vocabulary.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// --- Global middleware ---
app.use(helmet()); // security headers
app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true })); // CORS
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    // Capture raw body for Stripe webhook signature verification
    if (req.originalUrl?.includes('/payments/notify/stripe')) {
      req.rawBody = buf.toString('utf8');
    }
  },
})); // JSON body parsing
app.use(express.urlencoded({ extended: true }));

// Request logging (skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting: 300 requests / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  }),
);

// --- API routes ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// --- Production static files (built React app) ---
if (env.NODE_ENV === 'production') {
  const staticRoot = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticRoot));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticRoot, 'index.html'));
  });
}

// --- 404 & centralized error handling ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
