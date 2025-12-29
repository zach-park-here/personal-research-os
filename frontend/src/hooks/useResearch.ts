import { useState, useEffect } from 'react';
import { ResearchResult, ResearchStep } from '../types';
import { MOCK_RESEARCH_RESULT } from '../lib/mockData';

/**
 * Hook to simulate research progress and results
 * In production, this would poll the API for status updates
 */
export function useResearch(taskId: string) {
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[] | null>(null);

  useEffect(() => {
    // Simulate research progress
    const steps: ResearchStep[] = [
      { step: 1, total: 4, label: 'Searching top reports...', status: 'completed' },
      { step: 2, total: 4, label: 'Analyzing 12 sources...', status: 'in_progress' },
      { step: 3, total: 4, label: 'Extracting key findings...', status: 'pending' },
      { step: 4, total: 4, label: 'Building final brief...', status: 'pending' },
    ];

    setResearchSteps(steps);

    // Simulate step transitions
    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep > 4) {
        clearInterval(interval);
        // Research complete
        setResearchSteps(null);
        setResearchResult({
          ...MOCK_RESEARCH_RESULT,
          task_id: taskId,
        });
        return;
      }

      setResearchSteps((prev) =>
        prev!.map((step) => ({
          ...step,
          status:
            step.step < currentStep
              ? 'completed'
              : step.step === currentStep
              ? 'in_progress'
              : 'pending',
        }))
      );
    }, 2000); // Update every 2 seconds for demo

    return () => clearInterval(interval);
  }, [taskId]);

  return {
    researchResult,
    researchSteps,
  };
}
