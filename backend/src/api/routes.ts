import { Express } from 'express';
import { tasksRouter } from './tasks.routes';
import { historyRouter } from './history.routes';
import { researchRouter } from './research.routes';
import calendarRouter from './calendar.routes';

/**
 * Setup all API routes
 */
export function setupRoutes(app: Express) {
  app.use('/api/tasks', tasksRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/research', researchRouter);
  app.use('/api/calendar', calendarRouter);
}
