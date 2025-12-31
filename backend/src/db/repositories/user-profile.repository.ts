/**
 * User Profile Repository
 *
 * Database operations for user profiles
 */

import { BaseRepository } from './base.repository';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '@personal-research-os/shared/types';

export class UserProfileRepository extends BaseRepository {
  private readonly TABLE = 'user_profiles';

  /**
   * Get user profile by user ID
   */
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      this.handleError(error, 'UserProfileRepository.getByUserId');
    }

    return this.mapDbToUserProfile(data);
  }

  /**
   * Create a new user profile
   */
  async create(input: CreateUserProfileInput): Promise<UserProfile> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .insert({
        user_id: input.userId,
        name: input.name,
        email: input.email,
        job_title: input.jobTitle,
        company: input.company,
        company_description: input.companyDescription,
        industry: input.industry,
        location: input.location,
        interests: input.interests,
        goals: input.goals,
        preferred_sources: input.preferredSources,
        research_style: input.researchStyle || 'balanced',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'UserProfileRepository.create');
    }

    return this.mapDbToUserProfile(data);
  }

  /**
   * Update user profile
   */
  async update(userId: string, input: UpdateUserProfileInput): Promise<UserProfile> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.jobTitle !== undefined) updateData.job_title = input.jobTitle;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.companyDescription !== undefined) updateData.company_description = input.companyDescription;
    if (input.industry !== undefined) updateData.industry = input.industry;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.interests !== undefined) updateData.interests = input.interests;
    if (input.goals !== undefined) updateData.goals = input.goals;
    if (input.preferredSources !== undefined) updateData.preferred_sources = input.preferredSources;
    if (input.researchStyle !== undefined) updateData.research_style = input.researchStyle;

    const { data, error } = await this.db
      .from(this.TABLE)
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'UserProfileRepository.update');
    }

    return this.mapDbToUserProfile(data);
  }

  /**
   * Get or create user profile (useful for first-time users)
   */
  async getOrCreate(userId: string, defaultName: string = 'User'): Promise<UserProfile> {
    const existing = await this.getByUserId(userId);
    if (existing) {
      return existing;
    }

    return this.create({
      userId,
      name: defaultName,
    });
  }

  /**
   * Map database row to UserProfile type
   */
  private mapDbToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      jobTitle: data.job_title,
      company: data.company,
      companyDescription: data.company_description,
      industry: data.industry,
      location: data.location,
      interests: data.interests,
      goals: data.goals,
      preferredSources: data.preferred_sources,
      researchStyle: data.research_style,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
