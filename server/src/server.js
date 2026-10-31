import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { seedDatabase } from './seed.js';
import { Ticket } from './models/Ticket.js';
import { scanAndEscalateAllTickets } from './services/slaEngine.js';

import ticketRoutes from './routes/ticketRoutes.js';
import slaPolicyRoutes from './routes/slaPolicyRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/sla-policies', slaPolicyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// Seed API endpoint for easy reset from UI
app.post('/api/seed', async (req, res) => {
  try {
    const stats = await seedDatabase();
    res.json({
      success: true,
      message: 'Database seeded successfully with sample SLA policies and tickets',
      stats,
    });
  } catch (err) {
    console.error('Error seeding database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Customer Service SLA Tracker API (HACK-P368)',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// SLA Background Monitor Interval (runs every 30 seconds)
let slaMonitorInterval = null;

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const ticketCount = await Ticket.countDocuments();
    if (ticketCount === 0) {
      console.log('[INIT] Database is empty. Seeding initial data...');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` SLA Tracker Backend API running on http://localhost:${PORT}`);
      console.log(` Problem ID: HACK-P368`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });

    // Start background SLA monitoring
    slaMonitorInterval = setInterval(async () => {
      try {
        await scanAndEscalateAllTickets();
      } catch (err) {
        console.error('[SLA MONITOR ERROR]:', err.message);
      }
    }, 30000);

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n[SHUTDOWN] Closing server and database connection...');
      if (slaMonitorInterval) clearInterval(slaMonitorInterval);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start only if run directly
startServer();

export default app;
