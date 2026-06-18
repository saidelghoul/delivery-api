import express from 'express';
import * as Sentry from '@sentry/node';
import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import prisma from './config/db.js';

const app = express();

// Middleware to parse JSON
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // check DB
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);

// Sentry error handler — must come after routes, before custom error middleware
Sentry.setupExpressErrorHandler(app);

export default app;
