import { Check, Loader2 } from 'lucide-react';
import { ResearchStep } from '../types';

interface ResearchProgressProps {
  steps: ResearchStep[];
}

function ResearchProgress({ steps }: ResearchProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        <h3 className="text-sm font-medium text-text-secondary">
          Researching in progress...
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <StepItem key={step.step} step={step} />
        ))}
      </div>
    </div>
  );
}

function StepItem({ step }: { step: ResearchStep }) {
  return (
    <div className="flex items-start gap-3">
      {/* Status Icon */}
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 mt-0.5">
        {step.status === 'completed' && (
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
        {step.status === 'in_progress' && (
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        )}
        {step.status === 'pending' && (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">
            Step {step.step}/{step.total}
          </span>
        </div>
        <div
          className={`text-sm mt-0.5 ${
            step.status === 'pending'
              ? 'text-text-secondary'
              : 'text-text-primary'
          }`}
        >
          {step.label}
        </div>
      </div>
    </div>
  );
}

export default ResearchProgress;
