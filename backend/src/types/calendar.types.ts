/**
 * Google Calendar Integration Types
 *
 * These types match the database schema and Google Calendar API v3 responses
 */

// ============================================================================
// Database Entity Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  user_id: string;
  calendar_id: string;
  event_id: string;
  summary: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  location: string | null;
  attendees: Attendee[];
  organizer: Organizer | null;
  conference_data: ConferenceData | null;
  hangout_link: string | null;
  status: EventStatus;
  is_meeting: boolean;
  prep_task_created: boolean;
  prep_task_id: string | null;
  recurring_event_id: string | null;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthToken {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  access_token: string; // Encrypted
  refresh_token: string; // Encrypted
  token_expiry: Date;
  scope: string;
  created_at: Date;
  updated_at: Date;
}

export interface CalendarWebhook {
  id: string;
  user_id: string;
  calendar_id: string;
  channel_id: string; // UUID
  resource_id: string; // Google's opaque ID
  expiration: Date;
  sync_token: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Google Calendar API Types
// ============================================================================

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
  optional?: boolean;
}

export interface Organizer {
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface ConferenceData {
  conferenceSolution?: {
    name?: string; // "Google Meet", "Zoom Meeting", etc.
    iconUri?: string;
    key?: {
      type: string; // "hangoutsMeet" or "addOn"
    };
  };
  conferenceId?: string;
  entryPoints?: EntryPoint[];
  notes?: string;
}

export interface EntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export type OAuthProvider = 'google' | 'microsoft' | 'apple';

// ============================================================================
// Service Types
// ============================================================================

export interface ProspectInfo {
  prospectName: string;
  prospectEmail: string;
  prospectCompany: string;
  prospectTitle?: string;
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  status?: EventStatus;
  isMeeting?: boolean;
}

export interface SyncResult {
  eventsSynced: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  nextSyncToken: string;
}

export interface CalendarSyncParams {
  timeMin?: Date;
  timeMax?: Date;
  syncToken?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Attendee[];
  organizer?: Organizer;
  conferenceData?: ConferenceData;
  hangoutLink?: string;
  status?: EventStatus;
  recurringEventId?: string;
  recurrence?: string[];
  created?: string;
  updated?: string;
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // Unix timestamp in milliseconds
  scope: string;
  token_type: string;
}

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookNotification {
  channelId: string;
  resourceId: string;
  resourceState: 'sync' | 'exists' | 'not_exists';
  resourceUri?: string;
  expiration?: string;
}

export interface WebhookRegistration {
  id: string; // channelId
  resourceId: string;
  resourceUri: string;
  expiration: number; // Unix timestamp in milliseconds
}

// ============================================================================
// Repository Input Types
// ============================================================================

export interface CreateCalendarEventInput {
  user_id: string;
  calendar_id: string;
  event_id: string;
  summary: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  attendees?: Attendee[];
  organizer?: Organizer;
  conference_data?: ConferenceData;
  hangout_link?: string;
  status: EventStatus;
  is_meeting: boolean;
  recurring_event_id?: string;
}

export interface UpdateCalendarEventInput {
  summary?: string;
  description?: string;
  start_time?: Date;
  end_time?: Date;
  location?: string;
  attendees?: Attendee[];
  organizer?: Organizer;
  conference_data?: ConferenceData;
  hangout_link?: string;
  status?: EventStatus;
  is_meeting?: boolean;
  prep_task_created?: boolean;
  prep_task_id?: string;
}

export interface CreateOAuthTokenInput {
  user_id: string;
  provider: OAuthProvider;
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
  scope: string;
}

export interface CreateWebhookInput {
  user_id: string;
  calendar_id: string;
  channel_id: string;
  resource_id: string;
  expiration: Date;
  sync_token?: string;
}
