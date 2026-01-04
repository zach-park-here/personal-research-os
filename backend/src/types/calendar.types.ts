/**
 * Calendar Types
 *
 * Type definitions for Google Calendar integration
 */

/**
 * Database Entities
 */

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

export interface CalendarWebhook {
  id: string;
  user_id: string;
  calendar_id: string;
  channel_id: string;
  resource_id: string;
  expiration: Date;
  sync_token: string | null;
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

/**
 * Input Types (for creating records)
 */

export interface CreateCalendarEventInput {
  user_id: string;
  calendar_id: string;
  event_id: string;
  summary: string;
  description?: string | null;
  start_time: Date;
  end_time: Date;
  location?: string | null;
  attendees: Attendee[];
  organizer: Organizer | null;
  conference_data: ConferenceData | null;
  hangout_link?: string | null;
  status: EventStatus;
  is_meeting: boolean;
  recurring_event_id?: string | null;
}

export interface CreateCalendarWebhookInput {
  user_id: string;
  calendar_id: string;
  channel_id: string;
  resource_id: string;
  expiration: Date;
  sync_token: string | null;
}

export interface CreateOAuthTokenInput {
  user_id: string;
  provider: OAuthProvider;
  access_token: string; // Already encrypted
  refresh_token: string; // Already encrypted
  token_expiry: Date;
  scope: string;
}

/**
 * Google Calendar API Types
 */

export interface GoogleCalendarEvent {
  id: string;
  kind?: string;
  etag?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
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
  creator?: Organizer;
  conferenceData?: ConferenceData;
  hangoutLink?: string;
  status?: EventStatus;
  recurringEventId?: string;
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'birthday';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  transparency?: 'opaque' | 'transparent';
  iCalUID?: string;
  sequence?: number;
  htmlLink?: string;
  created?: string;
  updated?: string;
  attachments?: EventAttachment[];
  reminders?: {
    useDefault?: boolean;
    overrides?: EventReminder[];
  };
}

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  organizer?: boolean;
  self?: boolean;
}

export interface Organizer {
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface ConferenceData {
  conferenceId?: string;
  conferenceSolution?: {
    name?: string;
    iconUri?: string;
    key?: {
      type?: string;
    };
  };
  entryPoints?: ConferenceEntryPoint[];
  notes?: string;
}

export interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

export interface EventAttachment {
  fileId?: string;
  fileUrl: string;
  title?: string;
  mimeType?: string;
  iconLink?: string;
}

export interface EventReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

/**
 * Service Types
 */

export interface CalendarSyncParams {
  syncToken?: string;
  timeMin?: Date;
  timeMax?: Date;
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  isMeeting?: boolean;
  status?: EventStatus;
}

/**
 * Enums
 */

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export type OAuthProvider = 'google' | 'microsoft';
