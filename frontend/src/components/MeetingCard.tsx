import { Clock, Video, Users, CheckCircle2, Loader2, AlertCircle, Calendar, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Format time: "10:30 AM"
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format time range: "10:30 AM - 11:30 AM"
  const formatTimeRange = () => {
    return `${formatTime(meeting.start_time)} - ${formatTime(meeting.end_time)}`;
  };

  const isResearchCompleted = meeting.research?.status === 'completed';
  const isResearching =
    meeting.research?.status === 'executing' ||
    meeting.research?.status === 'planning' ||
    meeting.research?.status === 'classifying';
  const isResearchFailed = meeting.research?.status === 'failed';
  const hasResearch = meeting.prep_task !== null;

  // Get attendee count (excluding organizer)
  const attendeeCount = meeting.attendees?.length || 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-2 bg-white dark:bg-[#2D2D2D] transition-all duration-200">
      {/* Main card - always visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors"
      >
        {/* Expand/Collapse icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>

        {/* Time badge */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{formatTime(meeting.start_time)}</span>
          </div>
        </div>

        {/* Meeting info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {meeting.summary}
            </span>
          </div>

          {/* Duration */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatTimeRange()}
          </div>
        </div>

        {/* Research status badge */}
        {hasResearch && (
          <div className="flex-shrink-0">
            {isResearchCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-gray-700 text-[10px] text-blue-600 dark:text-gray-300 rounded-md font-medium border border-blue-200 dark:border-gray-600">
                <CheckCircle2 className="w-3 h-3" />
                Prep Ready
              </span>
            )}

            {isResearching && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-gray-700 text-[10px] text-blue-600 dark:text-gray-300 rounded-md font-medium border border-blue-200 dark:border-gray-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Researching
              </span>
            )}

            {isResearchFailed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-gray-700 text-[10px] text-red-600 dark:text-gray-300 rounded-md font-medium border border-red-200 dark:border-gray-600">
                <AlertCircle className="w-3 h-3" />
                Research Failed
              </span>
            )}

            {!isResearchCompleted && !isResearching && !isResearchFailed && meeting.research?.status === 'not_started' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-400 rounded-md font-medium border border-gray-200 dark:border-gray-600">
                <Calendar className="w-3 h-3" />
                Prep Pending
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-200 dark:border-gray-700">
          <div className="ml-7 mt-3 space-y-3">
            {/* Attendees */}
            {attendeeCount > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  INVITEE ({attendeeCount})
                </div>
                <div className="space-y-2">
                  {meeting.attendees.map((attendee, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                        {attendee.displayName?.charAt(0).toUpperCase() || attendee.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {attendee.displayName || attendee.email}
                        </div>
                        {attendee.displayName && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {attendee.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {meeting.location && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  LOCATION
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  {meeting.location}
                </div>
              </div>
            )}

            {/* Google Meet link */}
            {meeting.hangout_link && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  VIDEO CONFERENCE
                </div>
                <a
                  href={meeting.hangout_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video className="w-4 h-4" />
                  Join Google Meet
                </a>
              </div>
            )}

            {/* View prep button (if completed) */}
            {isResearchCompleted && (
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 dark:hover:bg-[#4A4A4C] text-gray-900 dark:text-gray-100 text-sm font-medium rounded-md transition-colors"
                >
                  View Meeting Prep
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
