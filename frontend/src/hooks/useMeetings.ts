import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Meeting, MeetingPrepResponse } from '../types';

export function useMeetings(userId: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();

    // Poll every 30 seconds for research status updates
    const interval = setInterval(loadMeetings, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadMeetings = async () => {
    try {
      const response: MeetingPrepResponse = await api.calendar.getMeetingPrep(userId, 2);
      setMeetings(response.meetings);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { meetings, loading, error, refreshMeetings: loadMeetings };
}
