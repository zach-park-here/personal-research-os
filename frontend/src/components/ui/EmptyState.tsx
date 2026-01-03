/**
 * EmptyState Component
 *
 * Reusable empty state indicator with icon and message
 * Used when sections have no data to display
 */

import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-400 dark:text-[#888888]">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
