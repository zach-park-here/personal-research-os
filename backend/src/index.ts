import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupRoutes } from './api/routes';
import { initDatabase } from './db/init';
import { startOrchestrator } from './orchestrator';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

    // Start orchestrator (triggers, queue management)
    await startOrchestrator();
    console.log('✓ Orchestrator started');

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
