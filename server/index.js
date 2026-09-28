const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
const env      = require('./config/env');
const v1Routes = require('./routes/v1');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: env.nodeEnv === 'development' ? true : env.corsOrigin,
  credentials: true
}));

// Request logging
if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api/v1', v1Routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[Server] Running on http://localhost:${env.port}  (${env.nodeEnv})`);
});

module.exports = app;
