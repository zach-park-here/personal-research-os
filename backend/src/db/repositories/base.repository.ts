import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Base Repository
 *
 * All repositories inherit from this class.
 * Uses Supabase (Postgres) from the start.
 */
export abstract class BaseRepository {
  protected db: SupabaseClient;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  /**
   * Helper to handle Supabase errors consistently
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${context}] Database error:`, error);
    throw new Error(`${context}: ${error.message || 'Unknown error'}`);
  }
}
