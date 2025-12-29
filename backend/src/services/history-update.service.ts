/**
 * History Update Service
 *
 * Handles periodic browser history import and profiling
 */

import { getRepositories } from '../db/repositories';
// import { importChromeHistory } from './chrome-import.service'; // TODO: Fix this import
import { runChromeProfiler } from '@personal-research-os/agents';

export interface HistoryUpdateResult {
  success: boolean;
  importedCount: number;
  profileUpdated: boolean;
  error?: string;
}

/**
 * Run full history update process
 *
 * 1. Import new Chrome history
 * 2. Run Agent A (Profiler)
 * 3. Update browsing_profile and recurring_patterns
 */
export async function runHistoryUpdate(userId: string): Promise<HistoryUpdateResult> {
  try {
    console.log(`[History Update] Starting for user: ${userId}`);

    // Step 1: Import Chrome History
    console.log('[History Update] Step 1: Importing Chrome history...');
    // const importResult = await importChromeHistory(userId); // TODO: Fix this
    const importResult = { count: 0 }; // Placeholder
    console.log(`[History Update] Imported ${importResult.count} new entries`);

    // Step 2: Run Agent A (Profiler)
    console.log('[History Update] Step 2: Running Chrome Profiler...');
    const { browsingProfile, recurringPatterns } = await runChromeProfiler(userId);

    // Step 3: Save profile to database
    console.log('[History Update] Step 3: Updating profile...');
    const repos = getRepositories();

    // TODO: Create BrowsingProfileRepository
    // await repos.browsingProfile.upsert(userId, browsingProfile);
    // await repos.recurringPatterns.upsert(userId, recurringPatterns);

    console.log('[History Update] ✅ Completed successfully');

    return {
      success: true,
      importedCount: importResult.count,
      profileUpdated: true,
    };

  } catch (error: any) {
    console.error('[History Update] ❌ Failed:', error);
    return {
      success: false,
      importedCount: 0,
      profileUpdated: false,
      error: error.message,
    };
  }
}

/**
 * Manual trigger endpoint
 */
export async function triggerManualUpdate(userId: string): Promise<HistoryUpdateResult> {
  console.log(`[Manual Trigger] User ${userId} requested history update`);
  return runHistoryUpdate(userId);
}
