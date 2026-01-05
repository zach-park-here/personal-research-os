import { Calendar } from 'lucide-react';
import type { Meeting } from '../types';
import { MeetingCard } from './MeetingCard';

interface MeetingListProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
}

export function MeetingList({ meetings, onMeetingClick }: MeetingListProps) {
  // Group meetings by date
  const groupMeetingsByDate = (meetings: Meeting[]) => {
    const groups: Record<string, Meeting[]> = {};

    meetings.forEach((meeting) => {
      const date = new Date(meeting.start_time);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Reset time parts for accurate comparison
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      const meetingDate = new Date(date);
      meetingDate.setHours(0, 0, 0, 0);

      let key: string;
      if (meetingDate.getTime() === today.getTime()) {
        key = 'Today';
      } else if (meetingDate.getTime() === tomorrow.getTime()) {
        key = 'Tomorrow';
      } else {
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(meeting);
    });

    // Sort meetings within each group by start time
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return groups;
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No upcoming meetings</p>
      </div>
    );
  }

  const groupedMeetings = groupMeetingsByDate(meetings);

  // Sort group keys: Today, Tomorrow, then dates
  const sortedKeys = Object.keys(groupedMeetings).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    // For other dates, sort chronologically
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-6">
      {sortedKeys.map((dateKey) => (
        <div key={dateKey}>
          {/* Date header */}
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
            {dateKey}
          </h3>

          {/* Meetings for this date */}
          <div className="space-y-2">
            {groupedMeetings[dateKey].map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={() => onMeetingClick(meeting)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
