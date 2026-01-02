import { Express } from 'express';
import { tasksRouter } from './tasks.routes';
import { researchRouter } from './research.routes';

/**
 * Setup all API routes
 */
export function setupRoutes(app: Express) {
  app.use('/api/tasks', tasksRouter);
  app.use('/api/research', researchRouter);
  // Add more routes:
  // app.use('/api/projects', projectsRouter);
  // app.use('/api/calendar', calendarRouter);
}
