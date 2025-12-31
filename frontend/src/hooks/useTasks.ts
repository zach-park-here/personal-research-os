import { useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../lib/api';

/**
 * Task management hook - Backend connected
 * Loads tasks from backend and persists all changes to database
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from backend on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Poll for research status updates when research is in progress
  useEffect(() => {
    // Check if any tasks are currently researching
    const hasResearchInProgress = tasks.some(
      task => task.researchStatus === 'executing'
    );

    if (hasResearchInProgress) {
      console.log('[useTasks] Research in progress detected, starting status polling...');
      const pollInterval = setInterval(() => {
        loadTasks(); // Refresh task list
      }, 3000); // Poll every 3 seconds

      return () => {
        console.log('[useTasks] Stopping research status polling');
        clearInterval(pollInterval);
      };
    }
  }, [tasks]);

  /**
   * Load all tasks from backend
   */
  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[useTasks] Loading tasks from backend...');
      const fetchedTasks = await api.tasks.getByUserId('demo-user');

      // DEBUG: Log what backend returned
      fetchedTasks.forEach(task => {
        if (task.isResearchEligible) {
          console.log('[useTasks] 🔍 Backend returned task:', {
            id: task.id,
            title: task.title,
            taskType: task.taskType,
            researchStatus: task.researchStatus,
          });
        }
      });

      // Mark research-eligible tasks
      const tasksWithResearchFlag = fetchedTasks.map(task => ({
        ...task,
        isResearchEligible: isResearchTask(task.title),
      }));

      setTasks(tasksWithResearchFlag);
      console.log(`[useTasks] Loaded ${tasksWithResearchFlag.length} tasks from backend`);
    } catch (err: any) {
      console.error('[useTasks] Failed to load tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new task and save to backend
   * For research-eligible tasks, automatically trigger backend research pipeline
   */
  const addTask = async (title: string, parentId?: string): Promise<Task> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useTasks] Creating task: "${title}"${parentId ? ` (parent: ${parentId})` : ''}`);

      // Create task in backend
      const newTask = await api.tasks.create({
        userId: 'demo-user',
        title,
        description: '',
        priority: 'medium',
        tags: [],
      });

      // Mark research eligibility
      const taskWithFlag = {
        ...newTask,
        isResearchEligible: isResearchTask(title),
      };

      // Add to local state
      setTasks((prev) => [taskWithFlag, ...prev]);

      // Trigger research pipeline for research-eligible tasks
      // Backend will:
      //   1. Classify task
      //   2. Generate subtasks using LLM (planner.service.ts)
      //   3. Execute web research
      //   4. Synthesize report
      if (taskWithFlag.isResearchEligible && !parentId) {
        console.log(`[useTasks] Task is research-eligible, triggering backend research pipeline...`);
        try {
          await api.research.request(newTask.id);
          console.log(`[useTasks] Research pipeline started for task ${newTask.id}`);

          // Update task status to indicate research is in progress
          const updatedTask = await api.tasks.update(newTask.id, {
            researchStatus: 'in_progress',
          });

          setTasks((prev) =>
            prev.map((t) => (t.id === newTask.id ? { ...updatedTask, isResearchEligible: true } : t))
          );
        } catch (researchErr: any) {
          console.error('[useTasks] Failed to start research:', researchErr);
          // Don't fail task creation if research fails
        }
      }

      console.log(`[useTasks] Task created: ${newTask.id}`);
      return taskWithFlag;
    } catch (err: any) {
      console.error('[useTasks] Failed to create task:', err);
      setError(err.message || 'Failed to create task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a task in backend
   */
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useTasks] Updating task ${id}:`, updates);
      const updatedTask = await api.tasks.update(id, updates);

      const taskWithFlag = {
        ...updatedTask,
        isResearchEligible: isResearchTask(updatedTask.title),
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? taskWithFlag : task))
      );

      if (selectedTask?.id === id) {
        setSelectedTask(taskWithFlag);
      }

      console.log(`[useTasks] Task updated: ${id}`);
    } catch (err: any) {
      console.error('[useTasks] Failed to update task:', err);
      setError(err.message || 'Failed to update task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a task from backend
   */
  const deleteTask = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useTasks] Deleting task ${id}`);
      await api.tasks.delete(id);

      setTasks((prev) => prev.filter((task) => task.id !== id));

      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }

      console.log(`[useTasks] Task deleted: ${id}`);
    } catch (err: any) {
      console.error('[useTasks] Failed to delete task:', err);
      setError(err.message || 'Failed to delete task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get only parent tasks (no parentId)
  const parentTasks = tasks.filter((task) => !task.parentId);

  return {
    tasks: parentTasks, // Only show parent tasks in main list
    allTasks: tasks, // All tasks including subtasks
    selectedTask,
    setSelectedTask,
    addTask,
    updateTask,
    deleteTask,
    loadTasks,
    isLoading,
    error,
  };
}

/**
 * Check if a task is research-eligible based on keywords
 */
function isResearchTask(title: string): boolean {
  const researchKeywords = [
    'research', 'analyze', 'analysis', 'market', 'competitive',
    'investigate', 'study', 'review', 'compare', 'find out', 'figure out',
    '조사', '분석', '리서치', '연구', '정리'
  ];

  const lowerTitle = title.toLowerCase();
  return researchKeywords.some(keyword => lowerTitle.includes(keyword));
}
