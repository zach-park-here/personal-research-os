/**
 * User Profile Types
 *
 * Stores user context for personalized research
 */

export interface UserProfile {
  id: string;
  userId: string;

  // Basic Info
  name: string;
  email?: string;

  // Professional Context
  jobTitle?: string;
  company?: string;
  companyDescription?: string;
  industry?: string;

  // Additional Context
  location?: string;
  interests?: string[];
  goals?: string[];

  // Research Preferences
  preferredSources?: string[];
  researchStyle?: 'brief' | 'detailed' | 'balanced';

  createdAt: string;
  updatedAt: string;
}

export interface CreateUserProfileInput {
  userId: string;
  name: string;
  email?: string;
  jobTitle?: string;
  company?: string;
  companyDescription?: string;
  industry?: string;
  location?: string;
  interests?: string[];
  goals?: string[];
  preferredSources?: string[];
  researchStyle?: 'brief' | 'detailed' | 'balanced';
}

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  jobTitle?: string;
  company?: string;
  companyDescription?: string;
  industry?: string;
  location?: string;
  interests?: string[];
  goals?: string[];
  preferredSources?: string[];
  researchStyle?: 'brief' | 'detailed' | 'balanced';
}
