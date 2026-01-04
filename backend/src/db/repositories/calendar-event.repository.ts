/**
 * Calendar Event Repository
 *
 * Handles database operations for calendar events.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CalendarEvent,
  CreateCalendarEventInput,
  EventFilters,
} from '../../types/calendar.types';

export class CalendarEventRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * Upsert calendar event
   * Uses unique constraint on (user_id, calendar_id, event_id)
   */
  async upsertEvent(event: CreateCalendarEventInput): Promise<CalendarEvent> {
    const { data, error } = await this.db
      .from('calendar_events')
      .upsert(
        {
          user_id: event.user_id,
          calendar_id: event.calendar_id,
          event_id: event.event_id,
          title: event.summary, // Copy summary to title for backward compatibility
          summary: event.summary,
          description: event.description,
          start_time: event.start_time.toISOString(),
          end_time: event.end_time.toISOString(),
          location: event.location,
          attendees: event.attendees,
          source: 'google', // Mark as Google Calendar source
          organizer: event.organizer,
          conference_data: event.conference_data,
          hangout_link: event.hangout_link,
          status: event.status,
          is_meeting: event.is_meeting,
          recurring_event_id: event.recurring_event_id,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,calendar_id,event_id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert calendar event: ${error.message}`);
    }

    return this.mapToCalendarEvent(data);
  }

  /**
   * Get events by user ID with optional filters
   */
  async getByUserId(
    userId: string,
    filters?: EventFilters
  ): Promise<CalendarEvent[]> {
    let query = this.db
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate.toISOString());
    }

    if (filters?.isMeeting !== undefined) {
      query = query.eq('is_meeting', filters.isMeeting);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }

    return (data || []).map(this.mapToCalendarEvent);
  }

  /**
   * Get upcoming meetings (is_meeting=true, future start_time)
   */
  async getUpcomingMeetings(
    userId: string,
    daysAhead: number = 30
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const { data, error } = await this.db
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_meeting', true)
      .neq('status', 'cancelled')
      .gte('start_time', now.toISOString())
      .lte('start_time', futureDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch upcoming meetings: ${error.message}`);
    }

    return (data || []).map(this.mapToCalendarEvent);
  }

  /**
   * Get meetings needing prep
   * - is_meeting = true
   * - prep_task_created = false
   * - start_time in specified hour range from now
   * - status != cancelled
   */
  async getMeetingsNeedingPrep(
    userId: string,
    minHours: number = 12,
    maxHours: number = 48
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const minTime = new Date(now.getTime() + minHours * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const { data, error } = await this.db
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_meeting', true)
      .eq('prep_task_created', false)
      .neq('status', 'cancelled')
      .gte('start_time', minTime.toISOString())
      .lte('start_time', maxTime.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch meetings needing prep: ${error.message}`
      );
    }

    return (data || []).map(this.mapToCalendarEvent);
  }

  /**
   * Mark event as having prep task created
   */
  async markPrepTaskCreated(
    eventId: string,
    taskId: string
  ): Promise<void> {
    const { error } = await this.db
      .from('calendar_events')
      .update({
        prep_task_created: true,
        prep_task_id: taskId,
      })
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to mark prep task created: ${error.message}`);
    }
  }

  /**
   * Mark event as cancelled (don't delete, set status)
   */
  async markEventCancelled(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const { error } = await this.db
      .from('calendar_events')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to mark event cancelled: ${error.message}`);
    }
  }

  /**
   * Delete event by calendar event ID
   */
  async deleteByCalendarEventId(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const { error } = await this.db
      .from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  /**
   * Delete all events for a user (used when disconnecting calendar)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.db
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(
        `Failed to delete all calendar events: ${error.message}`
      );
    }
  }

  /**
   * Map database row to CalendarEvent type
   */
  private mapToCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id,
      user_id: data.user_id,
      calendar_id: data.calendar_id,
      event_id: data.event_id,
      summary: data.summary,
      description: data.description,
      start_time: new Date(data.start_time),
      end_time: new Date(data.end_time),
      location: data.location,
      attendees: data.attendees,
      organizer: data.organizer,
      conference_data: data.conference_data,
      hangout_link: data.hangout_link,
      status: data.status,
      is_meeting: data.is_meeting,
      prep_task_created: data.prep_task_created,
      prep_task_id: data.prep_task_id,
      recurring_event_id: data.recurring_event_id,
      synced_at: new Date(data.synced_at),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
