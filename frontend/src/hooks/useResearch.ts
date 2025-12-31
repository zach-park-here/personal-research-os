import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { ResearchResult } from '@personal-research-os/shared/types/research';
import type { ResearchStep } from '../types';

/**
 * Hook to fetch research results from backend API
 * Polls the API until research is completed
 */
export function useResearch(taskId: string) {
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([
    { step: 1, total: 4, label: 'Planning research queries with o1...', status: 'pending' },
    { step: 2, total: 4, label: 'Executing web searches with GPT-4o...', status: 'pending' },
    { step: 3, total: 4, label: 'Analyzing search results...', status: 'pending' },
    { step: 4, total: 4, label: 'Generating meeting prep report with o1...', status: 'pending' },
  ]);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let currentStepIndex = 0;

    // Simulate progress through steps
    const progressInterval = setInterval(() => {
      if (currentStepIndex < 4 && isLoading) {
        setResearchSteps(prev => prev.map((step, idx) => {
          if (idx < currentStepIndex) return { ...step, status: 'completed' as const };
          if (idx === currentStepIndex) return { ...step, status: 'in_progress' as const };
          return step;
        }));
        currentStepIndex++;
      }
    }, 5000); // Update every 5 seconds

    const fetchResearch = async () => {
      try {
        console.log(`[useResearch] Fetching research for task ${taskId}`);
        const response = await api.research.getResults(taskId);

        if (!isMounted) return;

        if (response) {
          console.log(`[useResearch] Research found for task ${taskId}`);
          setResearchResult(response.research);
          setIsLoading(false);
          setError(null);

          // Stop polling once we have results
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else {
          console.log(`[useResearch] No research found yet for task ${taskId}, will poll...`);
          setResearchResult(null);
          setIsLoading(true);
        }
      } catch (err: any) {
        console.error(`[useResearch] Error fetching research:`, err);
        if (isMounted) {
          setError(err.message || 'Failed to load research results');
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchResearch();

    // Poll every 3 seconds if no results yet
    pollInterval = setInterval(() => {
      if (isLoading && !error) {
        fetchResearch();
      }
    }, 3000);

    // Cleanup
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [taskId, isLoading]);

  return {
    researchResult,
    isLoading,
    error,
    researchSteps,
  };
}
