import { BaseRepository } from './base.repository';
import type { Task } from '@personal-research-os/shared/types';

/**
 * Task Repository
 *
 * All database access for tasks goes through this class.
 * Domain-level methods only - no raw SQL exposed to API layer.
 */
export class TaskRepository extends BaseRepository {
  private readonly TABLE = 'tasks';

  /**
   * Create a new task
   */
  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .insert({
        user_id: task.userId,
        project_id: task.projectId || null,
        title: task.title,
        description: task.description || null,
        due_date: task.dueDate || null,
        priority: task.priority || 'medium',
        status: task.status || 'active',
        tags: task.tags || [],
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'TaskRepository.create');
    }

    return this.mapRowToTask(data);
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      this.handleError(error, 'TaskRepository.findById');
    }

    return data ? this.mapRowToTask(data) : null;
  }

  /**
   * List all active tasks for a user
   */
  async listByUser(userId: string, status: Task['status'] = 'active'): Promise<Task[]> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'TaskRepository.listByUser');
    }

    return (data || []).map(this.mapRowToTask);
  }

  /**
   * List tasks due today or soon
   */
  async listDueSoon(userId: string, hoursThreshold: number = 24): Promise<Task[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);

    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('due_date', 'is', null)
      .lte('due_date', threshold.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      this.handleError(error, 'TaskRepository.listDueSoon');
    }

    return (data || []).map(this.mapRowToTask);
  }

  /**
   * Update a task
   */
  async update(id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Promise<Task | null> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;

    const { data, error } = await this.db
      .from(this.TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'TaskRepository.update');
    }

    return data ? this.mapRowToTask(data) : null;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, 'TaskRepository.delete');
    }
  }

  /**
   * Map database row to Task domain object
   */
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      priority: row.priority,
      status: row.status,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
