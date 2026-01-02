/**
 * Research Orchestrator Service
 *
 * CENTRAL BRAIN of the Research MVP.
 * Coordinates: Classifier → Planner → Executor
 */

import { getRepositories } from '../../db/repositories';
import { isResearchTask, classifyTaskType, extractMeetingContext } from './classifier.service';
import { planWebResearch } from './planner.service';
import { executeResearch, executeIntentBasedResearch } from './executor.service';
import type { ResearchIntent, ResearchResult, TaskType } from '@personal-research-os/shared/types/research';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_MEETING_CONTEXT } from '../../config/demo.config';

export interface ResearchOrchestrationResult {
  success: boolean;
  message: string;
  researchResult?: ResearchResult;
  error?: string;
}

/**
 * Request research for a task
 * This is the MAIN ENTRY POINT for research pipeline
 */
export async function requestResearchForTask(
  taskId: string
): Promise<ResearchOrchestrationResult> {
  console.log(`\n[Orchestrator] 🚀 Research requested for task: ${taskId}`);

  try {
    const repos = getRepositories();

    // Get task
    const task = await repos.tasks.findById(taskId);
    if (!task) {
      return {
        success: false,
        message: 'Task not found',
        error: 'TASK_NOT_FOUND',
      };
    }

    // Ensure research_tasks entry exists for tracking
    await repos.researchTasks.getOrCreateForTracking(taskId);

    // Step 1: Classify
    console.log('[Orchestrator] Step 1: Classifying task...');
    await repos.researchTasks.updateResearchTracking(taskId, {
      researchStatus: 'classifying',
    });

    const isResearch = isResearchTask(task);

    if (!isResearch) {
      console.log('[Orchestrator] ❌ Task is not research-eligible');
      await repos.researchTasks.updateResearchTracking(taskId, {
        isResearchEligible: false,
        researchStatus: 'not_started',
      });
      return {
        success: false,
        message: 'Task does not require research',
        error: 'NOT_RESEARCH_TASK',
      };
    }

    console.log('[Orchestrator] ✅ Task is research-eligible');
    await repos.researchTasks.updateResearchTracking(taskId, {
      isResearchEligible: true,
    });

    // Step 1.5: Classify task type
    const userProfile = await repos.userProfiles.getByUserId(task.userId).catch(() => null);
    const taskType = classifyTaskType(task, userProfile);

    // DEMO: Override meeting context with demo data for testing purposes
    let meetingContext = taskType === 'meeting_prep' ? extractMeetingContext(task) : undefined;
    if (taskType === 'meeting_prep') {
      console.log('[Orchestrator] DEMO MODE: Using demo meeting context');
      meetingContext = {
        ...DEMO_MEETING_CONTEXT,
        meetingDate: meetingContext?.meetingDate || DEMO_MEETING_CONTEXT.meetingDate,
      };
    }

    console.log(`[Orchestrator] Task type: ${taskType}`);
    if (meetingContext) {
      console.log(`[Orchestrator] Meeting context:`, meetingContext);
    }

    // Step 2: Get intent (for MVP, use default)
    // In production, this would come from user selection
    const intent: ResearchIntent = 'general_summary';
    console.log(`[Orchestrator] Step 2: Using intent: ${intent}`);
    await repos.researchTasks.updateResearchTracking(taskId, {
      researchIntent: intent,
      researchStatus: 'planning',
    });

    // Step 3: Plan
    console.log('[Orchestrator] Step 3: Planning research subtasks...');
    const subtasks = await planWebResearch(task, intent, taskType, meetingContext);
    console.log(`[Orchestrator] ✅ Generated ${subtasks.length} subtasks`);

    // Save plan to DB
    const plan = await repos.researchPlans.create({
      taskId: task.id,
      userId: task.userId,
      intent,
      subtasks,
    });
    console.log(`[Orchestrator] ✅ Saved research plan: ${plan.id}`);

    // Update plan status
    await repos.researchPlans.updateStatus(plan.id, 'in_progress');
    await repos.researchTasks.updateResearchTracking(taskId, {
      researchStatus: 'executing',
    });

    // Step 4: Execute
    console.log('[Orchestrator] Step 4: Executing research...');

    let executionResult;
    if (taskType === 'meeting_prep' && meetingContext) {
      // Use new intent-based architecture for meeting prep
      console.log('[Orchestrator] Using intent-based research architecture for meeting prep');
      executionResult = await executeIntentBasedResearch(task.userId, intent, taskType, meetingContext);
    } else {
      // Use original architecture for other research types
      executionResult = await executeResearch(subtasks, intent, task.userId, taskType, meetingContext);
    }

    console.log(`[Orchestrator] ✅ Research completed: ${executionResult.pagesAnalyzed} pages analyzed`);

    // Step 5: Save results
    console.log('[Orchestrator] Step 5: Saving results...');
    console.log('[Orchestrator] 📊 DETAILED REPORT STRUCTURE:');
    console.log(JSON.stringify({
      taskType,
      reportKeys: Object.keys(executionResult.report),
      reportStructure: executionResult.report,
      recommendedPagesCount: executionResult.recommended_pages.length,
      subtaskResultsCount: executionResult.subtask_results.length,
    }, null, 2));

    const result = await repos.researchResults.create({
      taskId: task.id,
      planId: plan.id,
      userId: task.userId,
      report: executionResult.report,
      recommended_pages: executionResult.recommended_pages,
      subtask_results: executionResult.subtask_results,
      sourcesCount: executionResult.sourcesCount,
      pagesAnalyzed: executionResult.pagesAnalyzed,
    });

    // Update plan status and research tracking
    await repos.researchPlans.updateStatus(plan.id, 'completed');
    await repos.researchTasks.updateResearchTracking(taskId, {
      researchStatus: 'completed',
    });

    console.log(`[Orchestrator] ✅ Saved research result: ${result.id}`);
    console.log('[Orchestrator] 🎉 Research pipeline completed!\n');

    return {
      success: true,
      message: 'Research completed successfully',
      researchResult: {
        task_id: taskId,
        intent,
        report: executionResult.report,
        recommended_pages: executionResult.recommended_pages,
      },
    };

  } catch (error: any) {
    console.error('[Orchestrator] ❌ Research failed:', error);

    // Update research status to failed
    try {
      const repos = getRepositories();
      await repos.researchTasks.updateResearchTracking(taskId, {
        researchStatus: 'failed',
      });
    } catch (trackingError) {
      console.error('[Orchestrator] Failed to update tracking status:', trackingError);
    }

    return {
      success: false,
      message: 'Research failed',
      error: error.message,
    };
  }
}

/**
 * Get research results for a task
 */
export async function getResearchResults(taskId: string): Promise<ResearchResult | null> {
  const repos = getRepositories();

  const result = await repos.researchResults.getByTaskId(taskId);
  if (!result) {
    return null;
  }

  return {
    task_id: result.taskId,
    intent: (await repos.researchPlans.getByTaskId(taskId))?.intent || 'general_summary',
    report: result.report,
    recommended_pages: result.recommended_pages,
    subtask_results: result.subtask_results,
  };
}
