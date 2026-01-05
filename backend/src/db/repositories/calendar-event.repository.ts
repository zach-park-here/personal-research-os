import { BaseRepository } from './base.repository';
import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  EventFilters,
} from '../../types/calendar.types';

/**
 * Calendar Event Repository
 *
 * Manages calendar events synced from Google Calendar
 */
export class CalendarEventRepository extends BaseRepository {
  private readonly TABLE = 'calendar_events';

  /**
   * Upsert a calendar event (insert or update)
   * Uses unique constraint on (user_id, calendar_id, event_id)
   */
  async upsertEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .upsert(
        {
          ...input,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,calendar_id,event_id',
        }
      )
      .select()
      .single();

    if (error) {
      this.handleError(error, 'CalendarEventRepository.upsertEvent');
    }

    return data as CalendarEvent;
  }

  /**
   * Get events for a user with optional filters
   */
  async getByUserId(
    userId: string,
    filters?: EventFilters
  ): Promise<CalendarEvent[]> {
    let query = this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate.toISOString());
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.isMeeting !== undefined) {
      query = query.eq('is_meeting', filters.isMeeting);
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, 'CalendarEventRepository.getByUserId');
    }

    return (data as CalendarEvent[]) || [];
  }

  /**
   * Get upcoming meetings for a user
   * Only returns events marked as meetings
   */
  async getUpcomingMeetings(
    userId: string,
    daysAhead: number = 30
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_meeting', true)
      .neq('status', 'cancelled')
      .gte('start_time', now.toISOString())
      .lte('start_time', future.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      this.handleError(error, 'CalendarEventRepository.getUpcomingMeetings');
    }

    return (data as CalendarEvent[]) || [];
  }

  /**
   * Get upcoming meetings for prep (today and tomorrow by default)
   * Used by Meeting Prep API to show meetings with research status
   */
  async getUpcomingMeetingsForPrep(
    userId: string,
    daysAhead: number = 2
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
      throw new Error(`Failed to fetch meetings for prep: ${error.message}`);
    }

    return (data || []).map(this.mapToCalendarEvent);
  }

  /**
   * Get meetings needing prep
   * - is_meeting = true
   * - prep_task_created = false
   * - start_time in specified hour range (12-48 hours by default)
   * - status != 'cancelled'
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
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_meeting', true)
      .eq('prep_task_created', false)
      .neq('status', 'cancelled')
      .gte('start_time', minTime.toISOString())
      .lte('start_time', maxTime.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      this.handleError(
        error,
        'CalendarEventRepository.getMeetingsNeedingPrep'
      );
    }

    return (data as CalendarEvent[]) || [];
  }

  /**
   * Get a single event by ID
   */
  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      this.handleError(error, 'CalendarEventRepository.getById');
    }

    return data as CalendarEvent;
  }

  /**
   * Get event by Google Calendar event ID
   */
  async getByEventId(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<CalendarEvent | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'CalendarEventRepository.getByEventId');
    }

    return data as CalendarEvent;
  }

  /**
   * Update an existing event
   */
  async update(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'CalendarEventRepository.update');
    }

    return data as CalendarEvent;
  }

  /**
   * Mark prep task as created for an event
   */
  async markPrepTaskCreated(eventId: string, taskId: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .update({
        prep_task_created: true,
        prep_task_id: taskId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      this.handleError(error, 'CalendarEventRepository.markPrepTaskCreated');
    }
  }

  /**
   * Mark event as cancelled (soft delete)
   */
  async markEventCancelled(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .eq('event_id', eventId);

    if (error) {
      this.handleError(error, 'CalendarEventRepository.markEventCancelled');
    }
  }

  /**
   * Delete an event by Google Calendar event ID
   */
  async deleteByCalendarEventId(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .eq('event_id', eventId);

    if (error) {
      this.handleError(
        error,
        'CalendarEventRepository.deleteByCalendarEventId'
      );
    }
  }

  /**
   * Delete all events for a user (for disconnect/cleanup)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'CalendarEventRepository.deleteAllForUser');
    }
  }
}
