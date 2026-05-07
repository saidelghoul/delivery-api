import express from 'express';
import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';

const app = express();

// Middleware to parse JSON
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
export default app;
