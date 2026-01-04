/**
 * OAuth Token Repository
 *
 * Manages encrypted OAuth tokens for external service integrations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  OAuthToken,
  OAuthProvider,
  CreateOAuthTokenInput,
} from '../../types/calendar.types';

export class OAuthTokenRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * Store OAuth tokens (encrypted)
   * Uses unique constraint on (user_id, provider)
   */
  async storeTokens(tokens: CreateOAuthTokenInput): Promise<OAuthToken> {
    const { data, error } = await this.db
      .from('user_oauth_tokens')
      .upsert(
        {
          user_id: tokens.user_id,
          provider: tokens.provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.token_expiry.toISOString(),
          scope: tokens.scope,
        },
        { onConflict: 'user_id,provider' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store OAuth tokens: ${error.message}`);
    }

    return this.mapToOAuthToken(data);
  }

  /**
   * Get OAuth tokens for a user and provider
   */
  async getTokens(
    userId: string,
    provider: OAuthProvider
  ): Promise<OAuthToken | null> {
    const { data, error } = await this.db
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch OAuth tokens: ${error.message}`);
    }

    return data ? this.mapToOAuthToken(data) : null;
  }

  /**
   * Update access token (after refresh)
   */
  async updateAccessToken(
    userId: string,
    provider: OAuthProvider,
    accessToken: string,
    expiry: Date
  ): Promise<void> {
    const { error } = await this.db
      .from('user_oauth_tokens')
      .update({
        access_token: accessToken,
        token_expiry: expiry.toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw new Error(`Failed to update access token: ${error.message}`);
    }
  }

  /**
   * Delete OAuth tokens (when disconnecting)
   */
  async deleteTokens(userId: string, provider: OAuthProvider): Promise<void> {
    const { error } = await this.db
      .from('user_oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw new Error(`Failed to delete OAuth tokens: ${error.message}`);
    }
  }

  /**
   * Get all users with valid tokens for a provider
   * (for batch sync operations)
   */
  async getUsersWithValidTokens(
    provider: OAuthProvider
  ): Promise<string[]> {
    const { data, error } = await this.db
      .from('user_oauth_tokens')
      .select('user_id')
      .eq('provider', provider)
      .gte('token_expiry', new Date().toISOString());

    if (error) {
      throw new Error(
        `Failed to fetch users with valid tokens: ${error.message}`
      );
    }

    return (data || []).map((row) => row.user_id);
  }

  /**
   * Get tokens expiring soon (for proactive refresh)
   */
  async getTokensExpiringWithin(
    provider: OAuthProvider,
    minutes: number = 10
  ): Promise<OAuthToken[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setMinutes(expiryThreshold.getMinutes() + minutes);

    const { data, error } = await this.db
      .from('user_oauth_tokens')
      .select('*')
      .eq('provider', provider)
      .lte('token_expiry', expiryThreshold.toISOString());

    if (error) {
      throw new Error(`Failed to fetch expiring tokens: ${error.message}`);
    }

    return (data || []).map(this.mapToOAuthToken);
  }

  /**
   * Map database row to OAuthToken type
   */
  private mapToOAuthToken(data: any): OAuthToken {
    return {
      id: data.id,
      user_id: data.user_id,
      provider: data.provider,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expiry: new Date(data.token_expiry),
      scope: data.scope,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
