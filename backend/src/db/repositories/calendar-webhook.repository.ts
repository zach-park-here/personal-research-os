/**
 * Calendar Webhook Repository
 *
 * Manages webhook subscriptions for calendar push notifications.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CalendarWebhook, CreateCalendarWebhookInput } from '../../types/calendar.types';

export class CalendarWebhookRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * Upsert webhook subscription
   * Uses unique constraint on (user_id, calendar_id)
   */
  async upsert(webhook: CreateCalendarWebhookInput): Promise<CalendarWebhook> {
    const { data, error } = await this.db
      .from('calendar_webhooks')
      .upsert(
        {
          user_id: webhook.user_id,
          calendar_id: webhook.calendar_id,
          channel_id: webhook.channel_id,
          resource_id: webhook.resource_id,
          expiration: webhook.expiration.toISOString(),
          sync_token: webhook.sync_token,
        },
        { onConflict: 'user_id,calendar_id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert calendar webhook: ${error.message}`);
    }

    return this.mapToCalendarWebhook(data);
  }

  /**
   * Get webhook by channel ID (for webhook notifications)
   */
  async getByChannelId(channelId: string): Promise<CalendarWebhook | null> {
    const { data, error } = await this.db
      .from('calendar_webhooks')
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch webhook by channel ID: ${error.message}`);
    }

    return data ? this.mapToCalendarWebhook(data) : null;
  }

  /**
   * Get webhook by user ID and calendar ID
   */
  async getByUserId(
    userId: string,
    calendarId: string = 'primary'
  ): Promise<CalendarWebhook | null> {
    const { data, error } = await this.db
      .from('calendar_webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch webhook by user ID: ${error.message}`);
    }

    return data ? this.mapToCalendarWebhook(data) : null;
  }

  /**
   * Get all webhooks for a user
   */
  async getAllForUser(userId: string): Promise<CalendarWebhook[]> {
    const { data, error } = await this.db
      .from('calendar_webhooks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user webhooks: ${error.message}`);
    }

    return (data || []).map(this.mapToCalendarWebhook);
  }

  /**
   * Get webhooks expiring soon (for renewal)
   */
  async getExpiringSoon(minutes: number = 60): Promise<CalendarWebhook[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setMinutes(expiryThreshold.getMinutes() + minutes);

    const { data, error } = await this.db
      .from('calendar_webhooks')
      .select('*')
      .lte('expiration', expiryThreshold.toISOString());

    if (error) {
      throw new Error(`Failed to fetch expiring webhooks: ${error.message}`);
    }

    return (data || []).map(this.mapToCalendarWebhook);
  }

  /**
   * Update sync token after successful sync
   */
  async updateSyncToken(
    userId: string,
    calendarId: string,
    syncToken: string
  ): Promise<void> {
    const { error } = await this.db
      .from('calendar_webhooks')
      .update({ sync_token: syncToken })
      .eq('user_id', userId)
      .eq('calendar_id', calendarId);

    if (error) {
      throw new Error(`Failed to update sync token: ${error.message}`);
    }
  }

  /**
   * Delete webhook subscription
   */
  async delete(userId: string, calendarId: string): Promise<void> {
    const { error } = await this.db
      .from('calendar_webhooks')
      .delete()
      .eq('user_id', userId)
      .eq('calendar_id', calendarId);

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Delete all webhooks for a user (used when disconnecting)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.db
      .from('calendar_webhooks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete all webhooks: ${error.message}`);
    }
  }

  /**
   * Map database row to CalendarWebhook type
   */
  private mapToCalendarWebhook(data: any): CalendarWebhook {
    return {
      id: data.id,
      user_id: data.user_id,
      calendar_id: data.calendar_id,
      channel_id: data.channel_id,
      resource_id: data.resource_id,
      expiration: new Date(data.expiration),
      sync_token: data.sync_token,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
