import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getRepositories } from '../../db/repositories';
import { encrypt, decrypt } from '../../utils/encryption.util';
import {
  GoogleCalendarEvent,
  CalendarSyncParams,
  CreateCalendarEventInput,
  Attendee,
  ConferenceData,
  Organizer,
} from '../../types/calendar.types';

/**
 * Google Calendar Service
 *
 * Handles OAuth authentication and calendar event synchronization
 */
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    console.log('[GoogleCalendarService] Constructor - CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('[GoogleCalendarService] Constructor - CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...');
    console.log('[GoogleCalendarService] Constructor - REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth consent URL
   *
   * @param userId - User ID to include in state parameter
   * @returns OAuth consent URL
   */
  getAuthUrl(userId: string): string {
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param code - Authorization code from OAuth callback
   * @param userId - User ID
   * @returns Access token (unencrypted, for immediate use)
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<string> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    // Store encrypted tokens in database
    const repos = getRepositories();
    await repos.oauthTokens.storeTokens({
      user_id: userId,
      provider: 'google',
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
      token_expiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.readonly',
    });

    console.log(`[GoogleCalendar] Stored OAuth tokens for user: ${userId}`);

    return tokens.access_token;
  }

  /**
   * Get valid access token for a user
   * Automatically refreshes if expired
   *
   * @param userId - User ID
   * @returns Valid access token
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const repos = getRepositories();
    const tokenRecord = await repos.oauthTokens.getTokens(userId, 'google');

    if (!tokenRecord) {
      throw new Error(`No Google Calendar connection found for user: ${userId}`);
    }

    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer

    // Token still valid
    if (tokenRecord.token_expiry > expiryBuffer) {
      return decrypt(tokenRecord.access_token);
    }

    // Token expired or expiring soon, refresh it
    console.log(`[GoogleCalendar] Refreshing access token for user: ${userId}`);
    return await this.refreshAccessToken(userId);
  }

  /**
   * Refresh access token using refresh token
   *
   * @param userId - User ID
   * @returns New access token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const repos = getRepositories();
    const tokenRecord = await repos.oauthTokens.getTokens(userId, 'google');

    if (!tokenRecord) {
      throw new Error(`No Google Calendar connection found for user: ${userId}`);
    }

    const refreshToken = decrypt(tokenRecord.refresh_token);

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update access token in database
    await repos.oauthTokens.updateAccessToken(
      userId,
      'google',
      encrypt(credentials.access_token),
      new Date(credentials.expiry_date || Date.now() + 3600 * 1000)
    );

    console.log(`[GoogleCalendar] Access token refreshed for user: ${userId}`);

    return credentials.access_token;
  }

  /**
   * Fetch upcoming events from Google Calendar
   *
   * @param userId - User ID
   * @param params - Sync parameters (time range or syncToken)
   * @returns Events and nextSyncToken
   */
  async listUpcomingEvents(
    userId: string,
    params: CalendarSyncParams = {}
  ): Promise<{ events: GoogleCalendarEvent[]; nextSyncToken?: string }> {
    const accessToken = await this.getValidAccessToken(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const requestParams: any = {
      calendarId: 'primary',
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
      conferenceDataVersion: 1, // Required to get conferenceData
    };

    // Incremental sync using syncToken
    if (params.syncToken) {
      requestParams.syncToken = params.syncToken;
    } else {
      // Full sync with time range
      requestParams.timeMin = (
        params.timeMin || new Date()
      ).toISOString();
      requestParams.timeMax = (
        params.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).toISOString();
    }

    try {
      const response = await this.calendar.events.list(requestParams);

      return {
        events: (response.data.items || []) as GoogleCalendarEvent[],
        nextSyncToken: response.data.nextSyncToken || undefined,
      };
    } catch (error: any) {
      if (error.code === 410) {
        // syncToken expired, need full sync
        console.log(`[GoogleCalendar] syncToken expired for user: ${userId}, doing full sync`);
        return await this.listUpcomingEvents(userId, {
          timeMin: params.timeMin,
          timeMax: params.timeMax,
        });
      }
      throw error;
    }
  }

  /**
   * Initial full sync after OAuth connection
   *
   * @param userId - User ID
   */
  async initialFullSync(userId: string): Promise<void> {
    console.log(`[GoogleCalendar] Starting initial full sync for user: ${userId}`);

    const { events, nextSyncToken } = await this.listUpcomingEvents(userId, {
      timeMin: new Date(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`[GoogleCalendar] Fetched ${events.length} events for user: ${userId}`);

    // Store events in database
    const repos = getRepositories();
    for (const event of events) {
      if (!event.start?.dateTime) continue; // Skip all-day events

      const calendarEvent = this.mapGoogleEventToCalendarEvent(userId, event);
      await repos.calendarEvents.upsertEvent(calendarEvent);
    }

    // Store syncToken for future incremental syncs
    if (nextSyncToken) {
      const webhook = await repos.calendarWebhooks.getByUserId(userId, 'primary');
      if (webhook) {
        await repos.calendarWebhooks.updateSyncToken(userId, 'primary', nextSyncToken);
      }
    }

    console.log(`[GoogleCalendar] Initial sync complete for user: ${userId}`);
  }

  /**
   * Incremental sync using stored syncToken
   *
   * @param userId - User ID
   */
  async syncCalendarEvents(userId: string): Promise<void> {
    const repos = getRepositories();
    const webhook = await repos.calendarWebhooks.getByUserId(userId, 'primary');

    const syncToken = webhook?.sync_token;

    console.log(
      `[GoogleCalendar] Syncing events for user: ${userId} (incremental: ${!!syncToken})`
    );

    const { events, nextSyncToken } = await this.listUpcomingEvents(userId, {
      syncToken: syncToken || undefined,
      timeMin: syncToken ? undefined : new Date(),
      timeMax: syncToken ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log(`[GoogleCalendar] Processing ${events.length} changed events`);

    for (const event of events) {
      if (!event.start?.dateTime) continue;

      // Check if event is cancelled (deleted)
      if (event.status === 'cancelled') {
        await repos.calendarEvents.markEventCancelled(userId, 'primary', event.id);
        continue;
      }

      const calendarEvent = this.mapGoogleEventToCalendarEvent(userId, event);
      await repos.calendarEvents.upsertEvent(calendarEvent);
    }

    // Update syncToken
    if (nextSyncToken && webhook) {
      await repos.calendarWebhooks.updateSyncToken(userId, 'primary', nextSyncToken);
    }

    console.log(`[GoogleCalendar] Sync complete for user: ${userId}`);
  }

  /**
   * Map Google Calendar event to our database format
   */
  private mapGoogleEventToCalendarEvent(
    userId: string,
    event: GoogleCalendarEvent
  ): CreateCalendarEventInput {
    // Detect if this is a meeting
    const isMeeting = this.isMeetingEvent(event);

    return {
      user_id: userId,
      calendar_id: 'primary',
      event_id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description,
      start_time: new Date(event.start.dateTime!),
      end_time: new Date(event.end.dateTime!),
      location: event.location,
      attendees: (event.attendees as Attendee[]) || [],
      organizer: event.organizer as Organizer,
      conference_data: event.conferenceData as ConferenceData,
      hangout_link: event.hangoutLink,
      status: event.status || 'confirmed',
      is_meeting: isMeeting,
      recurring_event_id: event.recurringEventId,
    };
  }

  /**
   * Rule-based meeting detection
   * No LLM needed - pure data structure analysis
   */
  private isMeetingEvent(event: GoogleCalendarEvent): boolean {
    // Cancelled events are not meetings
    if (event.status === 'cancelled') return false;

    // 1. Has conferenceData with entryPoints (Zoom, Meet, Teams, etc.)
    if (event.conferenceData?.entryPoints && event.conferenceData.entryPoints.length > 0) {
      return true;
    }

    // 2. Has hangoutLink (Google Meet legacy)
    if (event.hangoutLink) {
      return true;
    }

    // 3. Location contains common meeting URLs
    if (event.location) {
      const meetingUrlPattern = /zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com/i;
      if (meetingUrlPattern.test(event.location)) {
        return true;
      }
    }

    // 4. Has external attendees (not same domain as organizer)
    if (event.attendees && event.attendees.length > 0 && event.organizer?.email) {
      const organizerDomain = event.organizer.email.split('@')[1];
      const hasExternalAttendee = event.attendees.some((attendee: any) => {
        const attendeeDomain = attendee.email?.split('@')[1];
        return attendeeDomain && attendeeDomain !== organizerDomain;
      });
      if (hasExternalAttendee) {
        return true;
      }
    }

    return false;
  }

  /**
   * Disconnect calendar integration for a user
   * Revokes tokens and cleans up data
   */
  async disconnectCalendar(userId: string): Promise<void> {
    const repos = getRepositories();

    // Delete OAuth tokens
    await repos.oauthTokens.deleteTokens(userId, 'google');

    // Delete webhooks
    await repos.calendarWebhooks.deleteAllForUser(userId);

    // Optionally delete calendar events (or keep for history)
    // await repos.calendarEvents.deleteAllForUser(userId);

    console.log(`[GoogleCalendar] Disconnected calendar for user: ${userId}`);
  }
}
