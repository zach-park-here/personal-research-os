import { Router } from 'express';
import { getRepositories } from '../db/repositories';
import { requestResearchForTask } from '../services/research/orchestrator.service';
import { isResearchTask, classifyTaskType } from '../services/research/classifier.service';

export const tasksRouter = Router();

/**
 * Example API routes using repository pattern
 *
 * NO direct database access - all goes through repositories.
 * This makes Postgres migration seamless.
 */

// GET /api/tasks
tasksRouter.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string; // In production, get from auth middleware
    const repos = getRepositories();
    const { tasks, researchResults, researchTasks } = repos;

    const taskList = await tasks.listByUser(userId);

    // Enrich tasks with research status and task type
    const enrichedTasks = await Promise.all(
      taskList.map(async (task) => {
        const isEligible = isResearchTask(task);
        let researchStatus: 'not_started' | 'executing' | 'completed' = 'not_started';
        let taskType: 'meeting_prep' | 'general_research' | undefined = undefined;

        if (isEligible) {
          // Classify task type
          const userProfile = await repos.userProfiles.getByUserId(task.userId).catch(() => null);
          taskType = classifyTaskType(task, userProfile);

          // IMPORTANT: Check research tracking status FIRST (to catch in-progress state)
          // Then check if completed result exists
          const researchTracking = await researchTasks.getByTaskId(task.id).catch(() => null);
          if (researchTracking) {
            const status = researchTracking.researchStatus;
            // Map detailed statuses to simplified ones for UI
            if (status === 'completed') {
              researchStatus = 'completed';
            } else if (status === 'classifying' || status === 'planning' || status === 'executing') {
              researchStatus = 'executing';
            } else if (status === 'failed') {
              researchStatus = 'not_started';
            }
          } else {
            // If no tracking record exists, check if a completed result was saved
            const researchResult = await researchResults.getByTaskId(task.id).catch(() => null);
            if (researchResult) {
              researchStatus = 'completed';
            }
          }
        }

        const enrichedTask = {
          ...task,
          isResearchEligible: isEligible,
          researchStatus,
          taskType,
        };

        // DEBUG: Log task type for research tasks
        if (isEligible && taskType) {
          console.log(`[TasksAPI] 📋 Task enrichment:`, {
            id: task.id,
            title: task.title,
            taskType,
            researchStatus,
          });
        }

        return enrichedTask;
      })
    );

    res.json(enrichedTasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/due-soon
tasksRouter.get('/due-soon', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const hours = parseInt(req.query.hours as string) || 24;
    const { tasks } = getRepositories();

    const dueSoon = await tasks.listDueSoon(userId, hours);
    res.json(dueSoon);
  } catch (error) {
    console.error('Failed to fetch due soon tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
tasksRouter.get('/:id', async (req, res) => {
  try {
    const { tasks } = getRepositories();
    const task = await tasks.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks
tasksRouter.post('/', async (req, res) => {
  try {
    const { tasks } = getRepositories();
    const newTask = await tasks.create(req.body);

    // Auto-trigger research classification and execution in background
    // Don't await - let it run asynchronously
    if (isResearchTask(newTask)) {
      requestResearchForTask(newTask.id).catch((err) => {
        console.error(`Background research failed for task ${newTask.id}:`, err);
      });
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', async (req, res) => {
  try {
    const { tasks } = getRepositories();
    const updated = await tasks.update(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Re-trigger research if title or description changed
    // (Only if updated fields include title or description)
    if ((req.body.title || req.body.description) && isResearchTask(updated)) {
      requestResearchForTask(updated.id).catch((err) => {
        console.error(`Background research re-trigger failed for task ${updated.id}:`, err);
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const repos = getRepositories();

    console.log(`[TasksAPI] 🗑️ Deleting task ${taskId} and all related research data...`);

    // Delete related research data first
    try {
      // Delete research results
      const researchResult = await repos.researchResults.getByTaskId(taskId).catch(() => null);
      if (researchResult) {
        await repos.researchResults.delete(researchResult.id);
        console.log(`[TasksAPI] ✅ Deleted research result for task ${taskId}`);
      }

      // Delete research tracking
      const researchTask = await repos.researchTasks.getByTaskId(taskId).catch(() => null);
      if (researchTask) {
        await repos.researchTasks.delete(researchTask.id);
        console.log(`[TasksAPI] ✅ Deleted research tracking for task ${taskId}`);
      }

      // Delete research plans
      const researchPlan = await repos.researchPlans.getByTaskId(taskId).catch(() => null);
      if (researchPlan) {
        await repos.researchPlans.delete(researchPlan.id);
        console.log(`[TasksAPI] ✅ Deleted research plan for task ${taskId}`);
      }
    } catch (cleanupErr) {
      console.error(`[TasksAPI] ⚠️ Failed to cleanup research data for task ${taskId}:`, cleanupErr);
      // Continue with task deletion even if cleanup fails
    }

    // Delete the task itself
    await repos.tasks.delete(taskId);
    console.log(`[TasksAPI] ✅ Deleted task ${taskId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
