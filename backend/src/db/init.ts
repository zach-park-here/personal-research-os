import { initSupabase } from './supabase';

/**
 * Initialize database
 *
 * Creates Supabase connection.
 * Run migrations separately with: npm run db:migrate
 */
export async function initDatabase() {
  try {
    // Initialize Supabase client
    initSupabase();

    console.log('✓ Supabase connection initialized');
  } catch (error: any) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}
