/**
 * Research API Routes
 */

import { Router } from 'express';
import { requestResearchForTask, getResearchResults } from '../services/research/orchestrator.service';

export const researchRouter = Router();

/**
 * POST /api/research/request/:taskId
 *
 * Trigger research for a task
 */
researchRouter.post('/request/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log(`[API] Research request for task: ${taskId}`);

    const result = await requestResearchForTask(taskId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message,
      });
    }

    res.json({
      message: result.message,
      research: result.researchResult,
    });

  } catch (error: any) {
    console.error('[API] Research request failed:', error);
    res.status(500).json({
      error: 'Research request failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/research/:taskId
 *
 * Get research results for a task
 */
researchRouter.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await getResearchResults(taskId);

    if (!result) {
      return res.status(404).json({
        error: 'Research not found',
        message: 'No research results found for this task',
      });
    }

    res.json({
      research: result,
    });

  } catch (error: any) {
    console.error('[API] Failed to get research:', error);
    res.status(500).json({
      error: 'Failed to get research',
      message: error.message,
    });
  }
});
