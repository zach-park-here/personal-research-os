/**
 * Meeting Prep Automation Service
 *
 * Automatically creates meeting prep tasks for upcoming meetings.
 * Triggers the existing research pipeline when tasks are created.
 */

import { getRepositories } from '../../db/repositories';
import { CalendarEvent } from '../../types/calendar.types';
import type { Task } from '@personal-research-os/shared/types';

interface ProspectInfo {
  prospectName: string;
  prospectEmail: string;
  prospectCompany: string;
}

export class MeetingPrepAutomationService {
  /**
   * Main automation loop - run by scheduler
   * Finds meetings needing prep and creates tasks
   */
  async runMeetingPrepAutomation(userId: string): Promise<void> {
    console.log(`[MeetingPrep] Running automation for user: ${userId}`);

    try {
      const meetings = await this.detectMeetingsNeedingPrep(userId);

      if (meetings.length === 0) {
        console.log(`[MeetingPrep] No meetings needing prep for user: ${userId}`);
        return;
      }

      console.log(
        `[MeetingPrep] Found ${meetings.length} meetings needing prep for user: ${userId}`
      );

      for (const meeting of meetings) {
        try {
          await this.processMeeting(userId, meeting);
        } catch (error: any) {
          console.error(
            `[MeetingPrep] Failed to process meeting ${meeting.event_id}:`,
            error.message
          );
          // Continue to next meeting on error
        }
      }

      console.log(`[MeetingPrep] Automation complete for user: ${userId}`);
    } catch (error: any) {
      console.error(
        `[MeetingPrep] Automation failed for user ${userId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Process a single meeting: extract prospect info and create task
   */
  private async processMeeting(
    userId: string,
    meeting: CalendarEvent
  ): Promise<void> {
    console.log(
      `[MeetingPrep] Processing meeting: ${meeting.summary} at ${meeting.start_time}`
    );

    // Extract prospect information from attendees
    const prospectInfo = this.extractProspectFromAttendees(meeting, userId);

    if (!prospectInfo) {
      console.log(
        `[MeetingPrep] No external prospect found for meeting: ${meeting.summary}`
      );
      return;
    }

    // Create meeting prep task
    const task = await this.createMeetingPrepTask(userId, meeting, prospectInfo);

    console.log(
      `[MeetingPrep] Created prep task ${task.id} for meeting with ${prospectInfo.prospectName}`
    );
  }

  /**
   * Detect meetings needing prep
   * Query calendar_events where:
   * - is_meeting = true
   * - prep_task_created = false
   * - start_time in 12-48 hours (or 1-7 days in test mode)
   * - status != cancelled
   */
  async detectMeetingsNeedingPrep(userId: string): Promise<CalendarEvent[]> {
    const repos = getRepositories();

    // Test mode: wider time window for testing
    const testMode = process.env.CALENDAR_TEST_MODE === 'true';
    const minHours = testMode ? 24 : 12; // Test: 1 day, Prod: 12 hours
    const maxHours = testMode ? 168 : 48; // Test: 7 days, Prod: 48 hours

    return await repos.calendarEvents.getMeetingsNeedingPrep(
      userId,
      minHours,
      maxHours
    );
  }

  /**
   * Extract prospect information from meeting attendees
   *
   * Logic:
   * 1. Find first external attendee (email domain ≠ user's domain)
   * 2. Skip generic emails (noreply@, support@, notifications@)
   * 3. Extract displayName → prospectName
   * 4. Parse email domain → prospectCompany (e.g., "daniel@pickle.ai" → "Pickle AI")
   */
  extractProspectFromAttendees(
    meeting: CalendarEvent,
    userId: string
  ): ProspectInfo | null {
    if (!meeting.attendees || meeting.attendees.length === 0) {
      return null;
    }

    // Get user's email domain (for external attendee detection)
    // For now, use organizer domain as proxy for user's domain
    const userDomain = meeting.organizer?.email?.split('@')[1];

    if (!userDomain) {
      console.warn(
        `[MeetingPrep] Cannot determine user domain for meeting: ${meeting.event_id}`
      );
      return null;
    }

    // Generic email patterns to skip
    const genericPatterns = [
      /^noreply@/i,
      /^no-reply@/i,
      /^support@/i,
      /^notifications@/i,
      /^calendar@/i,
      /^donotreply@/i,
    ];

    // Find first external, non-generic attendee
    for (const attendee of meeting.attendees) {
      if (!attendee.email) continue;

      const attendeeEmail = attendee.email.toLowerCase();
      const attendeeDomain = attendeeEmail.split('@')[1];

      // Skip if same domain as user
      if (attendeeDomain === userDomain) continue;

      // Skip if generic email
      if (genericPatterns.some((pattern) => pattern.test(attendeeEmail))) {
        continue;
      }

      // Found external prospect!
      const prospectName = attendee.displayName || attendeeEmail.split('@')[0];
      const prospectCompany = this.formatCompanyName(attendeeDomain);

      return {
        prospectName,
        prospectEmail: attendeeEmail,
        prospectCompany,
      };
    }

    return null;
  }

  /**
   * Format company name from email domain
   * e.g., "pickle.ai" → "Pickle AI"
   *      "google.com" → "Google"
   *      "acme-corp.io" → "Acme Corp"
   */
  private formatCompanyName(domain: string): string {
    if (!domain) return 'Unknown Company';

    // Remove TLD
    const withoutTld = domain.split('.')[0];

    // Replace hyphens/underscores with spaces
    const words = withoutTld.split(/[-_]/);

    // Capitalize each word
    const capitalized = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return capitalized;
  }

  /**
   * Create meeting prep task
   *
   * Task format:
   * - Title: "Preparing for meeting with {prospectName} at {prospectCompany}"
   * - Description: Meeting time, location, agenda from event.description
   * - Due date: 2 hours before meeting start_time
   * - Tags: ['meeting-prep', 'auto-generated', 'calendar-sync']
   *
   * IMPORTANT: Creating a task with "meeting" keyword auto-triggers research pipeline
   */
  async createMeetingPrepTask(
    userId: string,
    meeting: CalendarEvent,
    prospectInfo: ProspectInfo
  ): Promise<Task> {
    const repos = getRepositories();

    // Task title
    const title = `Preparing for meeting with ${prospectInfo.prospectName} at ${prospectInfo.prospectCompany}`;

    // Task description - include meeting details
    const meetingTime = meeting.start_time.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let description = `**Meeting Details:**\n`;
    description += `- Time: ${meetingTime}\n`;
    if (meeting.location) {
      description += `- Location: ${meeting.location}\n`;
    }
    if (meeting.hangout_link) {
      description += `- Meeting Link: ${meeting.hangout_link}\n`;
    } else if (meeting.conference_data?.entryPoints?.[0]?.uri) {
      description += `- Meeting Link: ${meeting.conference_data.entryPoints[0].uri}\n`;
    }
    description += `- Prospect: ${prospectInfo.prospectName} (${prospectInfo.prospectEmail})\n`;
    description += `\n`;

    // Include original meeting description/agenda if available
    if (meeting.description) {
      description += `**Meeting Agenda:**\n${meeting.description}\n\n`;
    }

    description += `---\n`;
    description += `*Auto-generated from Google Calendar event*`;

    // Due date: 2 hours before meeting
    const dueDate = new Date(meeting.start_time);
    dueDate.setHours(dueDate.getHours() - 2);

    // Create task
    const task = await repos.tasks.create({
      userId,
      title,
      description,
      dueDate: dueDate.toISOString(),
      priority: 'high', // Meeting prep is important
      status: 'active',
      tags: ['meeting-prep', 'auto-generated', 'calendar-sync'],
    });

    // Mark calendar event as having prep task created
    await repos.calendarEvents.markPrepTaskCreated(meeting.id, task.id);

    console.log(
      `[MeetingPrep] Task created: ${task.id} for meeting: ${meeting.event_id}`
    );

    // NOTE: Task creation with "meeting" keyword auto-triggers research pipeline
    // No need to manually trigger research here - it happens via existing task webhook/observer

    return task;
  }

  /**
   * Run automation for all users with connected calendars
   * Called by scheduler for batch processing
   */
  async runAutomationForAllUsers(): Promise<void> {
    console.log('[MeetingPrep] Running automation for all users');

    const repos = getRepositories();
    const userIds = await repos.oauthTokens.getUsersWithValidTokens('google');

    if (userIds.length === 0) {
      console.log('[MeetingPrep] No users with connected calendars');
      return;
    }

    console.log(
      `[MeetingPrep] Running automation for ${userIds.length} users`
    );

    for (const userId of userIds) {
      try {
        await this.runMeetingPrepAutomation(userId);
      } catch (error: any) {
        console.error(
          `[MeetingPrep] Failed automation for user ${userId}:`,
          error.message
        );
        // Continue to next user on error
      }
    }

    console.log('[MeetingPrep] Batch automation complete');
  }
}
