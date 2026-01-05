import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupRoutes } from './api/routes';
import { initDatabase } from './db/init';
import { startCalendarScheduler } from './services/calendar/calendar-sync-scheduler.service';

// Load .env from backend directory
const envPath = path.join(__dirname, '..', '.env');
console.log('[ENV] Loading from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('[ENV] Failed to load .env:', result.error);
  // Fallback: try loading from project root
  dotenv.config();
}
console.log('[ENV] GOOGLE_CLIENT_ID loaded:', !!process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
setupRoutes(app);

// Initialize
async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('✓ Database initialized');

    // Start calendar scheduler (webhook renewal, periodic sync, meeting prep)
    startCalendarScheduler();
    console.log('✓ Calendar scheduler started');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
