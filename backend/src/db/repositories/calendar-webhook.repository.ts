import { BaseRepository } from './base.repository';
import { CalendarWebhook, CreateWebhookInput } from '../../types/calendar.types';

/**
 * Calendar Webhook Repository
 *
 * Manages Google Calendar webhook subscriptions for real-time sync
 */
export class CalendarWebhookRepository extends BaseRepository {
  private readonly TABLE = 'calendar_webhooks';

  /**
   * Upsert a webhook subscription
   * Uses unique constraint on (user_id, calendar_id)
   */
  async upsert(input: CreateWebhookInput): Promise<CalendarWebhook> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .upsert(
        {
          ...input,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,calendar_id',
        }
      )
      .select()
      .single();

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.upsert');
    }

    return data as CalendarWebhook;
  }

  /**
   * Get webhook by channel ID (for webhook notification handling)
   */
  async getByChannelId(channelId: string): Promise<CalendarWebhook | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      this.handleError(error, 'CalendarWebhookRepository.getByChannelId');
    }

    return data as CalendarWebhook;
  }

  /**
   * Get webhook for a user and calendar
   */
  async getByUserId(
    userId: string,
    calendarId: string = 'primary'
  ): Promise<CalendarWebhook | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('calendar_id', calendarId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'CalendarWebhookRepository.getByUserId');
    }

    return data as CalendarWebhook;
  }

  /**
   * Get all webhooks for a user
   */
  async getAllForUser(userId: string): Promise<CalendarWebhook[]> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.getAllForUser');
    }

    return (data as CalendarWebhook[]) || [];
  }

  /**
   * Update sync token after incremental sync
   */
  async updateSyncToken(
    userId: string,
    calendarId: string,
    syncToken: string
  ): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .update({
        sync_token: syncToken,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('calendar_id', calendarId);

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.updateSyncToken');
    }
  }

  /**
   * Get webhooks expiring within specified minutes
   * Used for auto-renewal cron job
   */
  async getExpiringSoon(minutes: number = 60): Promise<CalendarWebhook[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setMinutes(expiryThreshold.getMinutes() + minutes);

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .lte('expiration', expiryThreshold.toISOString())
      .order('expiration', { ascending: true });

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.getExpiringSoon');
    }

    return (data as CalendarWebhook[]) || [];
  }

  /**
   * Get all active webhooks (not expired yet)
   */
  async getAllActive(): Promise<CalendarWebhook[]> {
    const now = new Date();

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .gt('expiration', now.toISOString());

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.getAllActive');
    }

    return (data as CalendarWebhook[]) || [];
  }

  /**
   * Delete webhook subscription
   */
  async delete(userId: string, calendarId: string = 'primary'): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('calendar_id', calendarId);

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.delete');
    }
  }

  /**
   * Delete webhook by channel ID
   */
  async deleteByChannelId(channelId: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('channel_id', channelId);

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.deleteByChannelId');
    }
  }

  /**
   * Delete all webhooks for a user (for disconnect/cleanup)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'CalendarWebhookRepository.deleteAllForUser');
    }
  }
}
