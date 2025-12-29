/**
 * Orchestrator
 *
 * Manages triggers, queue, and agent execution.
 * This is where backend calls into the agents library.
 */

import { startScheduler } from '../services/scheduler.service';

export async function startOrchestrator(): Promise<void> {
  console.log('Starting orchestrator...');

  // Start cron jobs (history updates, etc.)
  startScheduler();

  // TODO: Initialize Bull queue
  // TODO: Set up trigger listeners
  // TODO: Register job processors

  console.log('✓ Orchestrator started');
}
