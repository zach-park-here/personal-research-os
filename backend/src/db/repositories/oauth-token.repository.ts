import { BaseRepository } from './base.repository';
import { OAuthToken, CreateOAuthTokenInput, OAuthProvider } from '../../types/calendar.types';

/**
 * OAuth Token Repository
 *
 * Manages encrypted OAuth tokens for calendar providers
 * IMPORTANT: Tokens are stored encrypted in the database
 */
export class OAuthTokenRepository extends BaseRepository {
  private readonly TABLE = 'user_oauth_tokens';

  /**
   * Store OAuth tokens for a user and provider
   * Tokens should be encrypted before calling this method
   */
  async storeTokens(input: CreateOAuthTokenInput): Promise<OAuthToken> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .upsert(
        {
          ...input,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select()
      .single();

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.storeTokens');
    }

    return data as OAuthToken;
  }

  /**
   * Get OAuth tokens for a user and provider
   * Returns encrypted tokens - must be decrypted by caller
   */
  async getTokens(
    userId: string,
    provider: OAuthProvider
  ): Promise<OAuthToken | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      this.handleError(error, 'OAuthTokenRepository.getTokens');
    }

    return data as OAuthToken;
  }

  /**
   * Update access token and expiry after refresh
   * Access token should be encrypted before calling this method
   */
  async updateAccessToken(
    userId: string,
    provider: OAuthProvider,
    accessToken: string,
    expiry: Date
  ): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .update({
        access_token: accessToken,
        token_expiry: expiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.updateAccessToken');
    }
  }

  /**
   * Check if user has connected a provider
   */
  async hasProvider(userId: string, provider: OAuthProvider): Promise<boolean> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      this.handleError(error, 'OAuthTokenRepository.hasProvider');
    }

    return !!data;
  }

  /**
   * Get all users who have connected a specific provider
   * Used for batch sync operations
   */
  async getUsersWithValidTokens(provider: OAuthProvider): Promise<string[]> {
    const now = new Date();

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('user_id')
      .eq('provider', provider)
      .gt('token_expiry', now.toISOString());

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.getUsersWithValidTokens');
    }

    return (data as { user_id: string }[])?.map((row) => row.user_id) || [];
  }

  /**
   * Get tokens that are about to expire (within specified minutes)
   * Used for proactive token refresh
   */
  async getTokensExpiringWithin(
    provider: OAuthProvider,
    minutes: number = 10
  ): Promise<OAuthToken[]> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + minutes * 60 * 1000);

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('provider', provider)
      .gt('token_expiry', now.toISOString())
      .lte('token_expiry', expiryThreshold.toISOString());

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.getTokensExpiringWithin');
    }

    return (data as OAuthToken[]) || [];
  }

  /**
   * Delete OAuth tokens for a user and provider (for disconnect)
   */
  async deleteTokens(userId: string, provider: OAuthProvider): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.deleteTokens');
    }
  }

  /**
   * Delete all tokens for a user (for account deletion)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'OAuthTokenRepository.deleteAllForUser');
    }
  }
}
