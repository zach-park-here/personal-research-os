import { useState } from 'react';
import { Task } from '../types';
import { generateSubtasks } from '../lib/generateSubtasks';

/**
 * Task management hook
 * For demo, uses local state. In production, would connect to API
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const addTask = async (title: string, parentId?: string): Promise<Task> => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: 'demo-user',
      title,
      description: '',
      priority: 'medium',
      status: 'active',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isResearchEligible: isResearchTask(title),
      researchStatus: 'not_started',
      parentId,
      subtasks: [],
    };

    setTasks((prev) => [newTask, ...prev]);

    // Generate subtasks for parent tasks only
    if (!parentId) {
      const subtaskTitles = await generateSubtasks(newTask);
      const subtasks: Task[] = [];

      for (const subtaskTitle of subtaskTitles) {
        const subtask: Task = {
          id: crypto.randomUUID(),
          userId: 'demo-user',
          title: subtaskTitle,
          description: '',
          priority: 'medium',
          status: 'active',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isResearchEligible: isResearchTask(subtaskTitle),
          researchStatus: 'not_started',
          parentId: newTask.id,
        };
        subtasks.push(subtask);
      }

      // Update parent task with subtasks
      setTasks((prev) =>
        prev.map((task) =>
          task.id === newTask.id
            ? { ...task, subtasks }
            : task
        )
      );

      // Also add subtasks to main task list
      setTasks((prev) => [...prev, ...subtasks]);

      newTask.subtasks = subtasks;
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );

    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
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
  };
}

function isResearchTask(title: string): boolean {
  const researchKeywords = [
    'research', 'analyze', 'analysis', 'market', 'competitive',
    'investigate', 'study', 'review', 'compare', 'find out', 'figure out',
    '조사', '분석', '리서치', '연구', '정리'
  ];

  const lowerTitle = title.toLowerCase();
  return researchKeywords.some(keyword => lowerTitle.includes(keyword));
}
