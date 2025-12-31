/**
 * useConversation Hook
 * Manages conversation state with automatic persistence to the backend
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface UseConversationOptions {
  userId: string;
  conversationId?: string | null; // null = create new conversation
  context?: string; // e.g., task_id
  contextType?: 'general' | 'task_creation' | 'research';
  autoSave?: boolean; // Default: true
}

interface UseConversationReturn {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, role?: 'user' | 'assistant') => Promise<void>;
  clearMessages: () => void;
  deleteConversation: () => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
}

/**
 * Hook for managing a conversation with automatic persistence
 */
export function useConversation(options: UseConversationOptions): UseConversationReturn {
  const {
    userId,
    conversationId: initialConversationId,
    context,
    contextType = 'general',
    autoSave = true,
  } = options;

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load existing conversation on mount
   */
  useEffect(() => {
    async function loadConversation() {
      if (!initialConversationId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { messages: dbMessages } = await api.conversations.getById(
          initialConversationId
        );

        const loadedMessages: Message[] = dbMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));

        setMessages(loadedMessages);
        setConversationId(initialConversationId);
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    }

    loadConversation();
  }, [initialConversationId]);

  /**
   * Create a new conversation if needed
   */
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) {
      return conversationId;
    }

    // Create new conversation
    const newConversation = await api.conversations.create({
      userId,
      context,
      contextType,
    });

    setConversationId(newConversation.id);
    return newConversation.id;
  }, [conversationId, userId, context, contextType]);

  /**
   * Send a message (adds to state and persists to DB if autoSave is true)
   */
  const sendMessage = useCallback(
    async (content: string, role: 'user' | 'assistant' = 'user') => {
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        role,
        content,
        timestamp: new Date(),
      };

      // Optimistically add to state
      setMessages((prev) => [...prev, newMessage]);

      if (!autoSave) {
        return;
      }

      try {
        // Ensure conversation exists
        const convId = await ensureConversation();

        // Persist to backend
        const savedMessage = await api.conversations.addMessage(convId, {
          role,
          content,
        });

        // Update with real ID from backend
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: savedMessage.id,
                  timestamp: new Date(savedMessage.created_at),
                }
              : msg
          )
        );
      } catch (err) {
        console.error('Failed to save message:', err);
        setError(err instanceof Error ? err.message : 'Failed to save message');

        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    },
    [autoSave, ensureConversation]
  );

  /**
   * Clear all messages (only from state, doesn't delete from DB)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Delete the conversation from the database
   */
  const deleteConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await api.conversations.delete(conversationId);
      setMessages([]);
      setConversationId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }, [conversationId]);

  /**
   * Update conversation title
   */
  const updateTitle = useCallback(
    async (title: string) => {
      if (!conversationId) return;

      try {
        await api.conversations.updateTitle(conversationId, title);
      } catch (err) {
        console.error('Failed to update conversation title:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update conversation title'
        );
      }
    },
    [conversationId]
  );

  return {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    deleteConversation,
    updateTitle,
  };
}
