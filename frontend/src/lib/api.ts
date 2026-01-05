/**
 * Frontend API Client
 * Connects to backend REST API
 */

import type { Task } from '../types';
import type { ResearchResult } from '@personal-research-os/shared/types/research';

const API_BASE = 'http://localhost:3000/api';

// Conversation types
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  context: string | null;
  context_type: 'general' | 'task_creation' | 'research';
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: any | null;
  created_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: ConversationMessage[];
}

export interface ConversationPreview {
  conversation: Conversation;
  firstMessage: ConversationMessage | null;
  messageCount: number;
}

export interface CreateConversationRequest {
  userId: string;
  title?: string;
  context?: string;
  contextType?: 'general' | 'task_creation' | 'research';
}

export interface AddMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
}

export interface CreateTaskRequest {
  userId: string;
  title: string;
  description?: string;
  projectId?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}

export interface ResearchResponse {
  research: ResearchResult;
}

export interface ResearchQuery {
  id: string;
  title: string;
  query: string;
}

export interface ResearchPlanResponse {
  taskType: 'meeting_prep' | 'general_research';
  meetingContext?: {
    prospectName?: string;
    prospectTitle?: string;
    prospectCompany?: string;
    prospectEmail?: string;
    meetingDate?: string;
  };
  queries: ResearchQuery[];
}

export const api = {
  tasks: {
    /**
     * Create a new task
     */
    async create(data: CreateTaskRequest): Promise<Task> {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to create task: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Get all tasks for a user
     */
    async getByUserId(userId: string): Promise<Task[]> {
      const res = await fetch(`${API_BASE}/tasks?userId=${userId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Update a task
     */
    async update(taskId: string, updates: Partial<Task>): Promise<Task> {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Failed to update task: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Delete a task
     */
    async delete(taskId: string): Promise<void> {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete task: ${res.statusText}`);
      }
    },
  },

  research: {
    /**
     * Plan research queries for a task title (without creating task)
     */
    async plan(userId: string, title: string, description?: string): Promise<ResearchPlanResponse> {
      const res = await fetch(`${API_BASE}/research/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, description }),
      });

      if (!res.ok) {
        throw new Error(`Failed to plan research: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Request research for a task (manual trigger)
     */
    async request(taskId: string): Promise<void> {
      const res = await fetch(`${API_BASE}/research/request/${taskId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Failed to request research: ${res.statusText}`);
      }
    },

    /**
     * Get research results for a task
     */
    async getResults(taskId: string): Promise<ResearchResponse | null> {
      const res = await fetch(`${API_BASE}/research/${taskId}`);

      if (res.status === 404) {
        return null; // Research not found
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch research results: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Poll for research results until ready
     * @param taskId - Task ID to poll for
     * @param maxAttempts - Maximum number of polling attempts (default: 30)
     * @param intervalMs - Polling interval in milliseconds (default: 2000)
     */
    async pollForResults(
      taskId: string,
      maxAttempts = 30,
      intervalMs = 2000
    ): Promise<ResearchResponse> {
      for (let i = 0; i < maxAttempts; i++) {
        const result = await this.getResults(taskId);

        if (result) {
          return result;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

      throw new Error('Research timeout - results not ready after polling');
    },
  },

  conversations: {
    /**
     * Create a new conversation
     */
    async create(data: CreateConversationRequest): Promise<Conversation> {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to create conversation: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Get a conversation with all its messages
     */
    async getById(id: string): Promise<ConversationWithMessages> {
      const res = await fetch(`${API_BASE}/conversations/${id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch conversation: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Get all conversations for a user (with previews)
     */
    async getByUserId(userId: string, limit = 50): Promise<ConversationPreview[]> {
      const res = await fetch(`${API_BASE}/conversations/user/${userId}?limit=${limit}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch user conversations: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Get conversations by context (e.g., task_id)
     */
    async getByContext(context: string): Promise<Conversation[]> {
      const res = await fetch(`${API_BASE}/conversations/context/${context}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch conversations by context: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Update conversation title
     */
    async updateTitle(id: string, title: string): Promise<Conversation> {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update conversation: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Delete a conversation
     */
    async delete(id: string): Promise<void> {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete conversation: ${res.statusText}`);
      }
    },

    /**
     * Add a message to a conversation
     */
    async addMessage(conversationId: string, data: AddMessageRequest): Promise<ConversationMessage> {
      const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to add message: ${res.statusText}`);
      }

      return res.json();
    },

    /**
     * Get all messages for a conversation
     */
    async getMessages(conversationId: string): Promise<ConversationMessage[]> {
      const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);

      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.statusText}`);
      }

      return res.json();
    },
  },

  calendar: {
    /**
     * Get upcoming meetings with prep tasks and research status
     */
    async getMeetingPrep(userId: string, days: number = 2) {
      const res = await fetch(
        `${API_BASE}/calendar/meeting-prep?userId=${userId}&days=${days}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch meeting prep data');
      }

      return res.json();
    },
  },
};
