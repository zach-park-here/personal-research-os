/**
 * Calendar Sync Scheduler Service
 *
 * Manages scheduled jobs for calendar integration:
 * 1. Webhook renewal (every 20 minutes)
 * 2. Periodic sync fallback (every 15 minutes in prod, 5 min in test mode)
 * 3. Meeting prep automation (every 15 minutes)
 */

import * as cron from 'node-cron';
import { getRepositories } from '../../db/repositories';
import { GoogleCalendarService } from './google-calendar.service';
import { WebhookHandlerService } from './webhook-handler.service';
import { MeetingPrepAutomationService } from './meeting-prep-automation.service';

export class CalendarSyncSchedulerService {
  private calendarService: GoogleCalendarService;
  private webhookHandler: WebhookHandlerService;
  private meetingPrepAutomation: MeetingPrepAutomationService;

  private webhookRenewalJob?: ReturnType<typeof cron.schedule>;
  private periodicSyncJob?: ReturnType<typeof cron.schedule>;
  private meetingPrepJob?: ReturnType<typeof cron.schedule>;

  constructor() {
    this.calendarService = new GoogleCalendarService();
    this.webhookHandler = new WebhookHandlerService();
    this.meetingPrepAutomation = new MeetingPrepAutomationService();
  }

  /**
   * Start all calendar sync scheduled jobs
   */
  start(): void {
    console.log('[CalendarScheduler] Starting calendar sync scheduler');

    const testMode = process.env.CALENDAR_TEST_MODE === 'true';

    // Job 1: Webhook renewal - every 20 minutes
    // Renews webhooks expiring within 1 hour
    this.webhookRenewalJob = cron.schedule('*/20 * * * *', async () => {
      console.log('[CalendarScheduler] Running webhook renewal job');
      try {
        await this.webhookHandler.renewAllWebhookSubscriptions();
      } catch (error: any) {
        console.error('[CalendarScheduler] Webhook renewal failed:', error.message);
      }
    });

    // Job 2: Periodic sync fallback
    // Production: every 15 minutes
    // Test mode: every 5 minutes
    const syncInterval = testMode ? '*/5 * * * *' : '*/15 * * * *';
    this.periodicSyncJob = cron.schedule(syncInterval, async () => {
      console.log('[CalendarScheduler] Running periodic sync fallback');
      try {
        await this.syncAllUsersCalendars();
      } catch (error: any) {
        console.error('[CalendarScheduler] Periodic sync failed:', error.message);
      }
    });

    // Job 3: Meeting prep automation - every 15 minutes
    // Checks for meetings needing prep and creates tasks
    this.meetingPrepJob = cron.schedule('*/15 * * * *', async () => {
      console.log('[CalendarScheduler] Running meeting prep automation');
      try {
        await this.meetingPrepAutomation.runAutomationForAllUsers();
      } catch (error: any) {
        console.error(
          '[CalendarScheduler] Meeting prep automation failed:',
          error.message
        );
      }
    });

    console.log(
      `[CalendarScheduler] Scheduler started (test mode: ${testMode})`
    );
    console.log(`[CalendarScheduler] - Webhook renewal: every 20 minutes`);
    console.log(
      `[CalendarScheduler] - Periodic sync: every ${testMode ? '5' : '15'} minutes`
    );
    console.log(`[CalendarScheduler] - Meeting prep: every 15 minutes`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('[CalendarScheduler] Stopping calendar sync scheduler');

    if (this.webhookRenewalJob) {
      this.webhookRenewalJob.stop();
    }

    if (this.periodicSyncJob) {
      this.periodicSyncJob.stop();
    }

    if (this.meetingPrepJob) {
      this.meetingPrepJob.stop();
    }

    console.log('[CalendarScheduler] Scheduler stopped');
  }

  /**
   * Sync calendars for all users with valid OAuth tokens
   * Uses incremental sync with syncToken for efficiency
   */
  async syncAllUsersCalendars(): Promise<void> {
    console.log('[CalendarScheduler] Syncing calendars for all users');

    const repos = getRepositories();
    const userIds = await repos.oauthTokens.getUsersWithValidTokens('google');

    if (userIds.length === 0) {
      console.log('[CalendarScheduler] No users with valid tokens');
      return;
    }

    console.log(
      `[CalendarScheduler] Syncing calendars for ${userIds.length} users`
    );

    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      try {
        await this.calendarService.syncCalendarEvents(userId);
        successCount++;
      } catch (error: any) {
        console.error(
          `[CalendarScheduler] Sync failed for user ${userId}:`,
          error.message
        );
        failureCount++;

        // If token refresh fails, mark calendar as disconnected
        if (error.message.includes('refresh token')) {
          console.error(
            `[CalendarScheduler] Invalid refresh token for user ${userId}, disconnecting calendar`
          );
          try {
            await this.calendarService.disconnectCalendar(userId);
          } catch (disconnectError: any) {
            console.error(
              `[CalendarScheduler] Failed to disconnect calendar for user ${userId}:`,
              disconnectError.message
            );
          }
        }
      }
    }

    console.log(
      `[CalendarScheduler] Sync complete - Success: ${successCount}, Failed: ${failureCount}`
    );
  }

  /**
   * Run meeting prep automation for all users
   * Checks for upcoming meetings and creates prep tasks
   */
  async runMeetingPrepForAllUsers(): Promise<void> {
    console.log('[CalendarScheduler] Running meeting prep for all users');

    try {
      await this.meetingPrepAutomation.runAutomationForAllUsers();
    } catch (error: any) {
      console.error(
        '[CalendarScheduler] Meeting prep automation failed:',
        error.message
      );
      throw error;
    }
  }

  /**
   * Manual sync trigger (for API endpoint)
   */
  async triggerManualSync(userId: string): Promise<number> {
    console.log(`[CalendarScheduler] Manual sync triggered for user: ${userId}`);

    await this.calendarService.syncCalendarEvents(userId);

    // Get synced events count
    const repos = getRepositories();
    const events = await repos.calendarEvents.getByUserId(userId);

    console.log(
      `[CalendarScheduler] Manual sync complete - ${events.length} events synced`
    );

    return events.length;
  }

  /**
   * Check scheduler status
   */
  getStatus(): {
    running: boolean;
    testMode: boolean;
    jobs: {
      webhookRenewal: boolean;
      periodicSync: boolean;
      meetingPrep: boolean;
    };
  } {
    return {
      running:
        !!this.webhookRenewalJob ||
        !!this.periodicSyncJob ||
        !!this.meetingPrepJob,
      testMode: process.env.CALENDAR_TEST_MODE === 'true',
      jobs: {
        webhookRenewal: !!this.webhookRenewalJob,
        periodicSync: !!this.periodicSyncJob,
        meetingPrep: !!this.meetingPrepJob,
      },
    };
  }
}

// Singleton instance
let schedulerInstance: CalendarSyncSchedulerService | null = null;

/**
 * Get or create scheduler instance
 */
export function getCalendarScheduler(): CalendarSyncSchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new CalendarSyncSchedulerService();
  }
  return schedulerInstance;
}

/**
 * Start calendar scheduler (called from server startup)
 */
export function startCalendarScheduler(): void {
  const scheduler = getCalendarScheduler();
  scheduler.start();
}

/**
 * Stop calendar scheduler (called from server shutdown)
 */
export function stopCalendarScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}
