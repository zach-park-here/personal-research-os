/**
 * History API Routes
 */

import { Router } from 'express';
import multer from 'multer';
import { triggerManualUpdate } from '../services/history-update.service';
import { importChromeHistoryFromCsv } from '../services/chrome-import.service';
import { getRepositories } from '../db/repositories';

export const historyRouter = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /api/history/import
 *
 * Upload Chrome history CSV file
 */
historyRouter.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.body.userId || 'user_123'; // In production, get from auth

    console.log(`[API] Chrome import requested for user: ${userId}`);
    console.log(`[API] File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Convert buffer to string
    const csvContent = req.file.buffer.toString('utf-8');

    // Import history
    const result = await importChromeHistoryFromCsv(userId, csvContent);

    if (result.errors.length > 0) {
      return res.status(500).json({
        message: 'Import completed with errors',
        result,
      });
    }

    res.json({
      message: 'Import successful',
      result,
    });

  } catch (error: any) {
    console.error('[API] Import failed:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/history/update
 *
 * Manual trigger: Run history update now
 */
historyRouter.post('/update', async (req, res) => {
  try {
    const userId = req.body.userId; // In production, get from auth

    console.log(`[API] Manual history update requested by user: ${userId}`);

    const result = await triggerManualUpdate(userId);

    if (result.success) {
      res.json({
        message: 'History update completed',
        importedCount: result.importedCount,
        profileUpdated: result.profileUpdated,
      });
    } else {
      res.status(500).json({
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Failed to update history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/history/profile
 *
 * Get current browsing profile
 */
historyRouter.get('/profile', async (req, res) => {
  try {
    const userId = req.query.userId as string;

    // TODO: Get from BrowsingProfileRepository
    // const profile = await repos.browsingProfile.findByUser(userId);

    res.json({
      message: 'Profile retrieval not yet implemented',
      // profile
    });
  } catch (error: any) {
    console.error('Failed to get profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/history/stats
 *
 * Get browsing history statistics
 */
historyRouter.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'user_123';

    const repos = getRepositories();

    // Get top domains
    const topDomains = await repos.browsingHistory.getTopDomains(userId, 50);

    // Get search patterns
    const searchPatterns = await repos.searchFlows.getSearchPatterns(userId);

    res.json({
      topDomains,
      searchPatterns,
    });

  } catch (error: any) {
    console.error('[API] Failed to get stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
    });
  }
});
