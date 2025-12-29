import { Router } from 'express';
import { getRepositories } from '../db/repositories';
import { requestResearchForTask } from '../services/research/orchestrator.service';
import { isResearchTask } from '../services/research/classifier.service';

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
    const { tasks } = getRepositories();

    const taskList = await tasks.listByUser(userId);
    res.json(taskList);
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
    const { tasks } = getRepositories();
    await tasks.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
