/**
 * Webhook Handler Service
 *
 * Manages Google Calendar push notifications (Watch API)
 * Handles webhook registration, renewal, and notification processing
 */

import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { getRepositories } from '../../db/repositories';
import { GoogleCalendarService } from './google-calendar.service';

export class WebhookHandlerService {
  private calendarService: GoogleCalendarService;

  constructor() {
    this.calendarService = new GoogleCalendarService();
  }

  /**
   * Register webhook for a user's calendar
   * Creates a Watch API channel that expires in ~24 hours
   */
  async registerWebhookForUser(
    userId: string,
    calendarId: string = 'primary'
  ): Promise<string> {
    console.log(
      `[Webhook] Registering webhook for user: ${userId}, calendar: ${calendarId}`
    );

    try {
      const accessToken = await this.calendarService.getValidAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Generate unique channel ID
      const channelId = uuidv4();
      const webhookUrl = process.env.GOOGLE_WEBHOOK_URL;

      if (!webhookUrl) {
        throw new Error('GOOGLE_WEBHOOK_URL not configured');
      }

      // Register webhook with Google
      const response = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      const resourceId = response.data.resourceId!;
      const expiration = new Date(parseInt(response.data.expiration!));

      console.log(
        `[Webhook] Registered webhook - Channel: ${channelId}, Expires: ${expiration}`
      );

      // Store webhook info in database
      const repos = getRepositories();
      await repos.calendarWebhooks.upsert({
        user_id: userId,
        calendar_id: calendarId,
        channel_id: channelId,
        resource_id: resourceId,
        expiration,
        sync_token: null,
      });

      return channelId;
    } catch (error: any) {
      console.error(
        `[Webhook] Failed to register webhook for user ${userId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Handle webhook notification from Google
   *
   * Google sends:
   * - X-Goog-Resource-State: 'sync' (initial confirmation) or 'exists' (resource changed)
   * - X-Goog-Channel-Id: Channel ID we registered
   * - X-Goog-Resource-ID: Google's resource identifier
   *
   * On 'exists': Trigger incremental sync for the user
   */
  async handleWebhookNotification(
    channelId: string,
    resourceState: string
  ): Promise<void> {
    console.log(
      `[Webhook] Received notification - Channel: ${channelId}, State: ${resourceState}`
    );

    if (resourceState === 'sync') {
      // Initial confirmation when webhook registered
      console.log(`[Webhook] Sync confirmation for channel: ${channelId}`);
      return;
    }

    if (resourceState !== 'exists') {
      console.warn(`[Webhook] Unknown resource state: ${resourceState}`);
      return;
    }

    try {
      // Look up webhook to find user
      const repos = getRepositories();
      const webhook = await repos.calendarWebhooks.getByChannelId(channelId);

      if (!webhook) {
        console.warn(`[Webhook] Unknown channel ID: ${channelId}`);
        return;
      }

      console.log(
        `[Webhook] Triggering incremental sync for user: ${webhook.user_id}`
      );

      // Trigger incremental sync
      await this.calendarService.syncCalendarEvents(webhook.user_id);

      console.log(`[Webhook] Sync complete for user: ${webhook.user_id}`);
    } catch (error: any) {
      console.error(
        `[Webhook] Failed to handle notification for channel ${channelId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Renew webhook subscription for a user
   * Called when webhook is about to expire (<1 hour remaining)
   */
  async renewWebhookSubscription(userId: string): Promise<void> {
    console.log(`[Webhook] Renewing webhook subscription for user: ${userId}`);

    const repos = getRepositories();
    const webhook = await repos.calendarWebhooks.getByUserId(userId, 'primary');

    if (!webhook) {
      console.warn(`[Webhook] No webhook found for user: ${userId}`);
      return;
    }

    try {
      // Stop old webhook channel
      await this.stopWebhookChannel(userId, webhook.channel_id, webhook.resource_id);

      // Register new webhook
      await this.registerWebhookForUser(userId, webhook.calendar_id);

      console.log(`[Webhook] Successfully renewed webhook for user: ${userId}`);
    } catch (error: any) {
      console.error(
        `[Webhook] Failed to renew webhook for user ${userId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Stop a webhook channel
   * Called when renewing or disconnecting calendar
   */
  async stopWebhookChannel(
    userId: string,
    channelId: string,
    resourceId: string
  ): Promise<void> {
    console.log(`[Webhook] Stopping webhook channel: ${channelId}`);

    try {
      const accessToken = await this.calendarService.getValidAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId,
        },
      });

      console.log(`[Webhook] Stopped webhook channel: ${channelId}`);
    } catch (error: any) {
      // Don't throw on stop failures (channel may already be expired)
      console.warn(
        `[Webhook] Failed to stop channel ${channelId}:`,
        error.message
      );
    }
  }

  /**
   * Renew all expiring webhook subscriptions
   * Called by scheduler (every 20 minutes)
   * Renews webhooks expiring within 1 hour
   */
  async renewAllWebhookSubscriptions(): Promise<void> {
    console.log('[Webhook] Checking for expiring webhook subscriptions');

    const repos = getRepositories();
    const expiringWebhooks = await repos.calendarWebhooks.getExpiringSoon(60); // 60 minutes

    if (expiringWebhooks.length === 0) {
      console.log('[Webhook] No webhooks need renewal');
      return;
    }

    console.log(
      `[Webhook] Renewing ${expiringWebhooks.length} expiring webhooks`
    );

    for (const webhook of expiringWebhooks) {
      try {
        await this.renewWebhookSubscription(webhook.user_id);
      } catch (error: any) {
        console.error(
          `[Webhook] Failed to renew webhook for user ${webhook.user_id}:`,
          error.message
        );
        // Continue to next webhook on error
      }
    }

    console.log('[Webhook] Webhook renewal complete');
  }

  /**
   * Disconnect webhook for a user
   * Called when user disconnects calendar integration
   */
  async disconnectWebhook(userId: string): Promise<void> {
    console.log(`[Webhook] Disconnecting webhook for user: ${userId}`);

    const repos = getRepositories();
    const webhooks = await repos.calendarWebhooks.getAllForUser(userId);

    for (const webhook of webhooks) {
      try {
        await this.stopWebhookChannel(
          userId,
          webhook.channel_id,
          webhook.resource_id
        );
      } catch (error: any) {
        console.error(
          `[Webhook] Failed to stop webhook ${webhook.channel_id}:`,
          error.message
        );
      }
    }

    // Delete webhook records
    await repos.calendarWebhooks.deleteAllForUser(userId);

    console.log(`[Webhook] Disconnected all webhooks for user: ${userId}`);
  }
}
