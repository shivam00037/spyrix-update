import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import searchRoutes from './routes/search.js';
import dataRoutes from './routes/data.js';
import businessRoutes from './routes/business.js';
import aiRoutes from './routes/ai.js';
import feedbackRoutes from './routes/feedback.js';
import { authenticate } from './middleware/authenticate.js';
import dns from "node:dns";

dns.setServers(["8.8.8.8"]);

const app = express();
// Render and similar single-proxy hosts forward X-Forwarded-For; trust only one upstream proxy.
app.set('trust proxy', 1);
const port = Number(process.env.PORT || 5000);

app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim());
app.use(cors({ origin(origin, callback) {
  const localViteOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):51[0-9]{2}$/.test(origin || '');
  if (!origin || allowedOrigins.includes(origin) || localViteOrigin) return callback(null, true);
  return callback(new Error('Origin is not allowed by SPYRIX API CORS policy.'));
} }));
app.use(express.json({ limit: '5mb' }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'spyrix-invoice-api' }));
app.get('/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'waiting_for_database', database: ready ? 'connected' : 'disconnected' });
});

// Feedback email is independent of MongoDB; all account/workspace data needs the DB.
app.use('/api/v1', (req, res, next) => {
  if (req.path === '/feedback' || req.path.startsWith('/feedback/')) return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The SPYRIX database is still connecting. Please try again in a moment.' });
  }
  return next();
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/dashboard', authenticate, dashboardRoutes);
app.use('/api/v1/search', authenticate, searchRoutes);
app.use('/api/v1/data', authenticate, dataRoutes);
app.use('/api/v1/business', authenticate, businessRoutes);
app.use('/api/v1/ai', authenticate, aiRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  if (error?.name === 'ValidationError') return res.status(400).json({ message: 'Some submitted values are invalid.' });
  res.status(error.status || 500).json({ message: process.env.NODE_ENV === 'production' ? 'Server error. Please try again.' : (error.message || 'Server error.') });
});

const server = app.listen(port, () => console.log(`SPYRIX API listening on port ${port}`));
let stopping = false;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function connectDatabaseWithRetry() {
  while (!stopping && mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
      console.log('[SPYRIX API] Database is ready.');
      return;
    } catch (error) {
      const missingUri = !String(process.env.MONGODB_URI || '').trim();
      console.error(`[SPYRIX API] MongoDB connection failed: ${error.message}`);
      if (missingUri) console.error('[SPYRIX API] Add MONGODB_URI to server/.env or Render environment variables to enable account and workspace operations.');
      await wait(missingUri ? 15000 : 5000);
    }
  }
}

connectDatabaseWithRetry();

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[SPYRIX API] ${signal} received. Shutting down.`);
  server.close(async () => {
    try { await mongoose.disconnect(); } finally { process.exit(0); }
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
