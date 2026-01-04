/**
 * Task Types
 *
 * Re-export task types from shared package with backend-specific extensions
 */

export type { Task } from '@personal-research-os/shared/types';

/**
 * Extended Task type with metadata for calendar integration
 */
export interface TaskWithMetadata {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  tags: string[];
  metadata?: Record<string, any>; // Calendar event IDs, prospect info, etc.
  createdAt: string;
  updatedAt: string;
}
