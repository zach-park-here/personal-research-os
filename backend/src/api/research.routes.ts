/**
 * Research API Routes
 */

import { Router } from 'express';
import { requestResearchForTask, getResearchResults } from '../services/research/orchestrator.service';
import { planWebResearch } from '../services/research/planner.service';
import { classifyTaskType, extractMeetingContext } from '../services/research/classifier.service';
import { getRepositories } from '../db/repositories';

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
 * POST /api/research/plan
 *
 * Generate research queries for a task title (without creating the task)
 * Body: { userId: string, title: string, description?: string }
 */
researchRouter.post('/plan', async (req, res) => {
  try {
    const { userId, title, description } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and title are required',
      });
    }

    console.log(`[API] Planning research for: "${title}"`);

    // Create temporary task object for planning
    const tempTask = {
      id: 'temp',
      userId,
      title,
      description: description || '',
      status: 'active' as const,
      priority: 'medium' as const,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get user profile for context
    const repos = getRepositories();
    const userProfile = await repos.userProfiles.getByUserId(userId).catch(() => null);

    // Classify task type
    const taskType = classifyTaskType(tempTask, userProfile);

    // Extract meeting context if meeting prep
    let meetingContext = undefined;
    if (taskType === 'meeting_prep') {
      meetingContext = extractMeetingContext(tempTask);
      // Note: Demo context override happens in orchestrator.service.ts
    }

    // Generate research queries
    const queries = await planWebResearch(
      tempTask,
      'general_summary',
      taskType,
      meetingContext
    );

    res.json({
      taskType,
      meetingContext,
      queries: queries.map(q => ({
        id: q.id,
        title: q.title,
        query: q.query,
      })),
    });

  } catch (error: any) {
    console.error('[API] Research planning failed:', error);
    res.status(500).json({
      error: 'Research planning failed',
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
