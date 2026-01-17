import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './db/client.js';
import { startScheduler } from './services/scheduler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import checkinRoutes from './routes/checkin.js';
import contactsRoutes from './routes/contacts.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/checkin', checkinRoutes);
app.use('/contacts', contactsRoutes);
app.use('/notifications', notificationsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
});

// Start server
async function start() {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('Database initialized');

    // Start the alert scheduler
    startScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
