/**
 * Calendar API Routes
 *
 * Endpoints for Google Calendar integration:
 * - OAuth flow (auth URL, callback)
 * - Manual sync trigger
 * - Calendar status check
 * - Webhook receiver
 * - Disconnect calendar
 */

import { Router, Request, Response } from 'express';
import { GoogleCalendarService } from '../services/calendar/google-calendar.service';
import { WebhookHandlerService } from '../services/calendar/webhook-handler.service';
import { getCalendarScheduler } from '../services/calendar/calendar-sync-scheduler.service';
import { MeetingPrepAutomationService } from '../services/calendar/meeting-prep-automation.service';
import { getRepositories } from '../db/repositories';

const router = Router();

// Lazy initialization to ensure env vars are loaded
let calendarService: GoogleCalendarService | null = null;
let webhookHandler: WebhookHandlerService | null = null;
let meetingPrepAutomation: MeetingPrepAutomationService | null = null;

function getCalendarService() {
  if (!calendarService) {
    calendarService = new GoogleCalendarService();
  }
  return calendarService;
}

function getWebhookHandler() {
  if (!webhookHandler) {
    webhookHandler = new WebhookHandlerService();
  }
  return webhookHandler;
}

function getMeetingPrepAutomation() {
  if (!meetingPrepAutomation) {
    meetingPrepAutomation = new MeetingPrepAutomationService();
  }
  return meetingPrepAutomation;
}

/**
 * GET /api/calendar/auth/google
 *
 * Generate Google OAuth consent URL
 * Query params: userId
 * Returns: { authUrl: string }
 */
router.get('/auth/google', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const authUrl = getCalendarService().getAuthUrl(userId);

    res.json({ authUrl });
  } catch (error: any) {
    console.error('[CalendarRoutes] Failed to generate auth URL:', error.message);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/calendar/auth/google/callback
 *
 * OAuth callback handler
 * Query params: code, state (contains userId)
 * Redirects to frontend with success/error
 */
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}?calendar_error=missing_params`
      );
    }

    // Decode state to get userId
    const stateData = JSON.parse(
      Buffer.from(state, 'base64').toString('utf-8')
    );
    const userId = stateData.userId;

    if (!userId) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}?calendar_error=invalid_state`
      );
    }

    // Exchange code for tokens
    await getCalendarService().exchangeCodeForTokens(code, userId);

    // Register webhook for push notifications
    await getWebhookHandler().registerWebhookForUser(userId, 'primary');

    // Run initial full sync
    await getCalendarService().initialFullSync(userId);

    // Run meeting prep automation immediately after initial sync
    await getMeetingPrepAutomation().runMeetingPrepAutomation(userId);

    // Redirect to frontend with success
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}?calendar_connected=true`
    );
  } catch (error: any) {
    console.error('[CalendarRoutes] OAuth callback failed:', error.message);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}?calendar_error=${encodeURIComponent(error.message)}`
    );
  }
});

/**
 * POST /api/calendar/sync
 *
 * Manually trigger calendar sync
 * Body: { userId }
 * Returns: { eventsSynced: number }
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const scheduler = getCalendarScheduler();
    const eventsSynced = await scheduler.triggerManualSync(userId);

    // Run meeting prep automation after sync
    await getMeetingPrepAutomation().runMeetingPrepAutomation(userId);

    res.json({ eventsSynced });
  } catch (error: any) {
    console.error('[CalendarRoutes] Manual sync failed:', error.message);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

/**
 * GET /api/calendar/events
 *
 * List user's synced calendar events
 * Query params: userId, startDate, endDate, isMeeting
 * Returns: CalendarEvent[]
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const isMeeting = req.query.isMeeting
      ? req.query.isMeeting === 'true'
      : undefined;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const repos = getRepositories();
    const events = await repos.calendarEvents.getByUserId(userId, {
      startDate,
      endDate,
      isMeeting,
    });

    res.json(events);
  } catch (error: any) {
    console.error('[CalendarRoutes] Failed to fetch events:', error.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * GET /api/calendar/meeting-prep
 *
 * Get upcoming meetings with prep tasks and research status
 * Query params: userId, days (default: 2)
 * Returns: { meetings: MeetingPrepItem[] }
 */
router.get('/meeting-prep', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const days = parseInt(req.query.days as string) || 2;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const repos = getRepositories();

    // 1. Get upcoming meetings (today/tomorrow)
    const meetings = await repos.calendarEvents.getUpcomingMeetingsForPrep(userId, days);

    // 2. For each meeting, get prep task (if exists)
    const meetingsWithPrep = await Promise.all(
      meetings.map(async (meeting) => {
        let prepTask = null;
        let research = null;

        // Get prep task if created
        if (meeting.prep_task_created && meeting.prep_task_id) {
          try {
            prepTask = await repos.tasks.findById(meeting.prep_task_id);

            // Get research status and results if task exists
            if (prepTask) {
              const researchTracking = await repos.researchTasks.getByTaskId(prepTask.id);
              const researchResult = await repos.researchResults.getByTaskId(prepTask.id);

              research = {
                status: researchTracking?.researchStatus || 'not_started',
                result: researchResult ? {
                  report: researchResult.report,
                  recommended_pages: researchResult.recommended_pages,
                  created_at: researchResult.createdAt,
                } : null,
              };
            }
          } catch (error: any) {
            console.warn(`[MeetingPrep API] Failed to load task/research for meeting ${meeting.id}:`, error.message);
          }
        }

        return {
          // Meeting info
          id: meeting.id,
          summary: meeting.summary,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          location: meeting.location,
          hangout_link: meeting.hangout_link,
          attendees: meeting.attendees,
          organizer: meeting.organizer,
          conference_data: meeting.conference_data,
          status: meeting.status,

          // Prep task info
          prep_task: prepTask ? {
            id: prepTask.id,
            title: prepTask.title,
            description: prepTask.description,
            due_date: prepTask.dueDate,
            status: prepTask.status,
            priority: prepTask.priority,
          } : null,

          // Research info
          research,
        };
      })
    );

    res.json({ meetings: meetingsWithPrep });
  } catch (error: any) {
    console.error('[CalendarRoutes] Failed to fetch meeting prep:', error.message);
    res.status(500).json({ error: 'Failed to fetch meeting prep data' });
  }
});

/**
 * GET /api/calendar/status
 *
 * Check calendar connection status
 * Query params: userId
 * Returns: { connected: boolean, lastSync: string, webhookExpiry: string }
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const repos = getRepositories();

    // Check if user has OAuth tokens
    const tokens = await repos.oauthTokens.getTokens(userId, 'google');
    const connected = !!tokens;

    if (!connected) {
      return res.json({
        connected: false,
        lastSync: null,
        webhookExpiry: null,
      });
    }

    // Get webhook info
    const webhook = await repos.calendarWebhooks.getByUserId(userId, 'primary');

    // Get last synced event
    const events = await repos.calendarEvents.getByUserId(userId);
    const lastSync =
      events.length > 0
        ? events.sort(
            (a, b) => b.synced_at.getTime() - a.synced_at.getTime()
          )[0].synced_at
        : null;

    res.json({
      connected: true,
      lastSync: lastSync ? lastSync.toISOString() : null,
      webhookExpiry: webhook ? webhook.expiration.toISOString() : null,
      tokenExpiry: tokens.token_expiry.toISOString(),
    });
  } catch (error: any) {
    console.error('[CalendarRoutes] Failed to get status:', error.message);
    res.status(500).json({ error: 'Failed to get calendar status' });
  }
});

/**
 * POST /api/calendar/webhook
 *
 * Webhook receiver for Google Calendar push notifications
 * Headers:
 *   X-Goog-Resource-State: 'sync' or 'exists'
 *   X-Goog-Channel-Id: Channel ID
 *   X-Goog-Resource-ID: Resource ID
 *
 * Returns: 200 OK (must respond quickly)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const resourceState = req.headers['x-goog-resource-state'] as string;
    const channelId = req.headers['x-goog-channel-id'] as string;

    if (!resourceState || !channelId) {
      console.warn('[CalendarRoutes] Invalid webhook headers');
      return res.status(400).send('Invalid webhook headers');
    }

    console.log(
      `[CalendarRoutes] Webhook received - Channel: ${channelId}, State: ${resourceState}`
    );

    // Respond immediately (Google requires fast response)
    res.status(200).send('OK');

    // Process webhook asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await getWebhookHandler().handleWebhookNotification(channelId, resourceState);

        // If sync happened, run meeting prep automation
        if (resourceState === 'exists') {
          const repos = getRepositories();
          const webhook = await repos.calendarWebhooks.getByChannelId(channelId);
          if (webhook) {
            await getMeetingPrepAutomation().runMeetingPrepAutomation(webhook.user_id);
          }
        }
      } catch (error: any) {
        console.error('[CalendarRoutes] Webhook processing failed:', error.message);
      }
    });
  } catch (error: any) {
    console.error('[CalendarRoutes] Webhook handling failed:', error.message);
    res.status(500).send('Internal server error');
  }
});

/**
 * POST /api/calendar/disconnect
 *
 * Disconnect calendar integration
 * Body: { userId }
 * Returns: { success: boolean }
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Stop webhooks
    await getWebhookHandler().disconnectWebhook(userId);

    // Delete OAuth tokens and calendar data
    await getCalendarService().disconnectCalendar(userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[CalendarRoutes] Disconnect failed:', error.message);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

export default router;
