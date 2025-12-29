import { FileText, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import { Task, ResearchIntent } from '../types';

interface IntentModalProps {
  task: Task;
  onSelectIntent: (intent: ResearchIntent) => void;
  onClose: () => void;
}

const INTENT_OPTIONS = [
  {
    value: 'background_brief' as ResearchIntent,
    icon: FileText,
    label: 'Background brief',
    description: 'Get a quick overview and context',
  },
  {
    value: 'competitive_scan' as ResearchIntent,
    icon: Users,
    label: 'Competitive scan',
    description: 'Compare players and alternatives',
  },
  {
    value: 'decision_support' as ResearchIntent,
    icon: TrendingUp,
    label: 'Decision support',
    description: 'Help me make a strategic choice',
  },
  {
    value: 'update_since_last' as ResearchIntent,
    icon: Clock,
    label: 'Update since last research',
    description: 'What changed since I last looked',
  },
  {
    value: 'general_summary' as ResearchIntent,
    icon: Sparkles,
    label: 'General summary',
    description: 'Comprehensive research overview',
  },
];

function IntentModal({ task, onSelectIntent, onClose }: IntentModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border">
            <h3 className="text-lg font-semibold mb-1">
              What kind of research do you need?
            </h3>
            <p className="text-sm text-text-secondary">
              for "{task.title}"
            </p>
          </div>

          {/* Options */}
          <div className="px-4 py-4 space-y-2">
            {INTENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => onSelectIntent(option.value)}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-md hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 flex-shrink-0">
                    <Icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-0.5">
                      {option.label}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-bg-hover rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default IntentModal;
