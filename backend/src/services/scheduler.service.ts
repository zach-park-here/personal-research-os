/**
 * Scheduler Service
 *
 * Manages periodic background jobs
 */

import * as cron from 'node-cron';
import { runHistoryUpdate } from './history-update.service';

// Store active cron jobs
const jobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Start all scheduled jobs
 */
export function startScheduler() {
  console.log('🕒 Starting scheduler...');

  // Daily history update at 3 AM
  const historyUpdateJob = cron.schedule('0 3 * * *', async () => {
    console.log('⏰ [Cron] Daily history update triggered');

    // TODO: Get all active users
    const activeUsers = ['user_123']; // Placeholder

    for (const userId of activeUsers) {
      try {
        await runHistoryUpdate(userId);
      } catch (error) {
        console.error(`[Cron] Failed for user ${userId}:`, error);
      }
    }
  });

  jobs.set('history-update', historyUpdateJob);

  console.log('✅ Scheduler started');
  console.log('   - History Update: Daily at 3:00 AM');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  console.log('Stopping scheduler...');
  jobs.forEach((job, name) => {
    job.stop();
    console.log(`  ✓ Stopped: ${name}`);
  });
  jobs.clear();
}

/**
 * List active jobs
 */
export function listJobs() {
  return Array.from(jobs.keys());
}
