/**
 * Demo Configuration
 *
 * Demo/test data for development and testing purposes
 */

import type { MeetingContext } from '../services/research/classifier.service';

/**
 * Default demo meeting context (Daniel Park at Pickle AI)
 * Used for testing and demonstration purposes
 */
export const DEMO_MEETING_CONTEXT: MeetingContext = {
  prospectName: 'Daniel Park',
  prospectTitle: 'CEO',
  prospectCompany: 'Pickle AI',
  prospectEmail: 'daniel@pickle.com',
  meetingDate: 'this week',
} as const;

/**
 * Enable/disable demo mode via environment variable
 * Set USE_DEMO_DATA=true to use demo context for all meeting prep tasks
 */
export const USE_DEMO_DATA = process.env.USE_DEMO_DATA === 'true';
