import { ChevronRight, ChevronDown, Sparkles, Search, Bot, User, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { useState, useEffect } from 'react';
import { useResearch } from '../hooks/useResearch';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (task: Task) => void;
  onShowSources?: (task: Task) => void;
  onSelectSubtask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

function TaskList({ tasks, selectedTaskId, onSelectTask, onShowSources, onSelectSubtask, onDeleteTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-[#888888] dark:text-[#C5C7CA]">
        <p className="text-sm">No tasks for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItemWithSubtasks
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onClick={() => onSelectTask(task)}
          onShowSources={onShowSources}
          onSelectSubtask={onSelectSubtask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}

interface TaskItemWithSubtasksProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onShowSources?: (task: Task) => void;
  onSelectSubtask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

function TaskItemWithSubtasks({
  task,
  isSelected,
  onClick,
  onShowSources,
  onSelectSubtask,
  onDeleteTask,
}: TaskItemWithSubtasksProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const [searchProgress, setSearchProgress] = useState<{ currentSource: string; progress: number } | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Get subtasks from backend research results
  const { researchResult } = useResearch(task.id);
  const subtasks = researchResult?.subtask_results?.map((subtaskResult) => ({
    id: subtaskResult.subtask_id,
    title: subtaskResult.subtask_title,
    userId: 'demo-user',
    description: '',
    priority: 'medium' as const,
    status: 'completed' as const,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isResearchEligible: true,
    researchStatus: 'completed' as 'completed' | 'executing' | 'not_started',
    parentId: task.id,
    isResearch: true,
    sources: subtaskResult.sources.map((source) => ({
      title: source.title,
      url: source.url,
      description: source.snippet,
      favicon: undefined,
    })),
    summarization: '', // subtask_results don't have content field
  })) || [];

  const hasSubtasks = subtasks && subtasks.length > 0;

  // Separate AI and User tasks (for now all from backend are AI tasks)
  const aiTasks = subtasks;
  const userTasks: Task[] = [];

  // Find first AI task in progress
  const firstAiTaskInProgress = aiTasks.find(st => st.researchStatus === 'executing');

  useEffect(() => {
    // Start AI preparation and web search simulation for research tasks
    if (task.isResearchEligible && task.researchStatus === 'not_started') {
      startResearchProcess();
    }
  }, [task.id, task.isResearchEligible, task.researchStatus]);

  const startResearchProcess = async () => {
    // Phase 1: AI analyzes and prioritizes
    setAiStatus('Analyzing task and prioritizing subtasks...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Phase 2: Generate keywords
    setAiStatus('Generating search keywords...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const generatedKeywords = [
      'AI agents',
      'content marketing automation',
      'agent workflows',
      'marketing pipeline integration',
    ];
    setKeywords(generatedKeywords);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Phase 3: Retrieve memory
    setAiStatus('Retrieving your search behavior and preferences...');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Phase 4: Start web search
    setAiStatus(null);
    simulateWebSearch();
  };

  const simulateWebSearch = async () => {
    const sources = [
      'TechCrunch',
      'Product Hunt',
      'GitHub',
      'Medium',
      'Hacker News',
      'Stack Overflow',
    ];

    for (let i = 0; i < sources.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSearchProgress({
        currentSource: sources[i],
        progress: ((i + 1) / sources.length) * 100,
      });
    }

    // Clear progress after completion
    setTimeout(() => {
      setSearchProgress(null);
    }, 1000);
  };

  return (
    <>
      {/* Parent Task */}
      <TaskItem
        task={task}
        isSelected={isSelected}
        onClick={onClick}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        hasSubtasks={hasSubtasks}
        onDeleteTask={onDeleteTask}
      />

      {/* AI Preparation Status */}
      {task.isResearchEligible && aiStatus && (
        <div className="ml-10 mb-2">
          <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#C5C7CA] mb-1.5">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce" />
              <div
                className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span className="font-medium">{aiStatus}</span>
          </div>

          {/* Show keywords when generated */}
          {keywords.length > 0 && aiStatus?.includes('keywords') && (
            <div className="ml-4 flex flex-wrap gap-1.5 mt-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-[#F3F3F3] dark:bg-[#2D2D2D] text-[10px] text-[#666666] dark:text-[#C5C7CA] rounded-full border border-[#E8E8E8] dark:border-[#3A3A3C]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Web Search Progress - Show below main task */}
      {task.isResearchEligible && searchProgress && !aiStatus && (
        <div className="ml-10 mb-2">
          <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#C5C7CA]">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce" />
              <div
                className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-1 h-1 bg-[#888888] dark:bg-[#C5C7CA] rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span>Searching {searchProgress.currentSource}...</span>
          </div>

          {/* Show persistent keywords during search */}
          {keywords.length > 0 && (
            <div className="ml-4 flex flex-wrap gap-1.5 mt-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-[#F3F3F3] dark:bg-[#2D2D2D] text-[10px] text-[#666666] dark:text-[#C5C7CA] rounded-full border border-[#E8E8E8] dark:border-[#3A3A3C]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtasks - Separated by AI and User */}
      {hasSubtasks && isExpanded && (
        <div className="ml-6 space-y-3">
          {/* AI Tasks Section */}
          {aiTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-semibold text-[#888888] dark:text-[#C5C7CA] uppercase">AI Tasks</h4>
              </div>
              <div className="space-y-1">
                {aiTasks.map((subtask, idx) => {
                  const isInProgress = subtask.researchStatus === 'executing' || (idx === 0 && !firstAiTaskInProgress);
                  return (
                    <SubtaskItem
                      key={subtask.id}
                      task={subtask}
                      isInProgress={isInProgress}
                      onShowSources={onShowSources}
                      onSelectSubtask={onSelectSubtask}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* User Tasks Section */}
          {userTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2">
                <User className="w-4 h-4 text-[#DD4B39] dark:text-[#10A37F]" />
                <h4 className="text-xs font-semibold text-[#888888] dark:text-[#C5C7CA] uppercase">Your Tasks</h4>
              </div>
              <div className="space-y-1">
                {userTasks.map((subtask) => (
                  <SubtaskItem
                    key={subtask.id}
                    task={subtask}
                    isInProgress={false}
                    onShowSources={onShowSources}
                    onSelectSubtask={onSelectSubtask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  isSubtask?: boolean;
  hasSubtasks?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isResearch?: boolean;
  onDeleteTask?: (taskId: string) => void;
}

function TaskItem({
  task,
  isSelected,
  onClick,
  isSubtask = false,
  hasSubtasks = false,
  isExpanded,
  onToggleExpand,
  isResearch = false,
  onDeleteTask,
}: TaskItemProps) {
  const researchStatus = task.researchStatus;

  // Debug logging
  console.log('[TaskItem]', task.title, {
    isResearchEligible: task.isResearchEligible,
    researchStatus,
    isSubtask,
    shouldShowResearchingBadge: task.isResearchEligible && !isSubtask && researchStatus !== 'completed' && researchStatus !== 'not_started',
    shouldShowCompletedBadge: researchStatus === 'completed' && !isSubtask,
  });

  return (
    <div
      className={`
        group flex items-start gap-2.5 px-2 py-2 rounded cursor-pointer
        transition-all duration-200
        ${isSelected ? 'bg-[#FFEFEB] dark:bg-[#10A37F]/20' : 'hover:bg-[#F9F9F9] dark:hover:bg-[#2D2D2D]'}
        ${isSubtask ? 'text-[#666666] dark:text-[#C5C7CA]' : ''}
      `}
    >
      {/* Expand/Collapse for parent tasks with subtasks */}
      {hasSubtasks && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#666666] dark:text-[#C5C7CA]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#666666] dark:text-[#C5C7CA]" />
          )}
        </button>
      )}

      {/* Spacing for subtasks without expand button */}
      {isSubtask && !hasSubtasks && <div className="w-4" />}

      {/* Checkbox - Todoist style */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`
          w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5
          transition-all cursor-pointer
          ${
            task.status === 'completed'
              ? 'bg-[#808080] dark:bg-[#10A37F] border-[#808080] dark:border-[#10A37F]'
              : 'border-[#D1D1D1] dark:border-[#3A3A3C] hover:border-[#808080] dark:hover:border-[#10A37F]'
          }
        `}
      >
        {task.status === 'completed' && (
          <svg
            className="w-full h-full text-white"
            fill="none"
            strokeWidth="2.5"
            stroke="currentColor"
            viewBox="0 0 18 18"
          >
            <path d="M4 9l3 3 7-7" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              task.status === 'completed'
                ? 'line-through text-[#888888] dark:text-[#C5C7CA]'
                : isSubtask
                ? 'text-[#666666] dark:text-[#C5C7CA]'
                : 'text-[#202020] dark:text-[#ECECEC]'
            }`}
          >
            {task.title}
          </span>

          {/* Search icon for research subtasks */}
          {isResearch && isSubtask && (
            <Search className="w-3.5 h-3.5 text-[#888888] dark:text-[#C5C7CA]" />
          )}

          {/* Research Badge - In Progress */}
          {task.isResearchEligible &&
            !isSubtask &&
            researchStatus !== 'completed' &&
            researchStatus !== 'not_started' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[10px] text-blue-600 dark:text-blue-400 rounded-md font-medium border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                Researching
              </span>
            )}

          {/* Research Badge - Completed (Minimal) */}
          {researchStatus === 'completed' && !isSubtask && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-[#2D2D2D] text-[10px] text-gray-700 dark:text-[#C5C7CA] rounded border border-gray-200 dark:border-[#3A3A3C] font-medium">
              Completed
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-[#888888] dark:text-[#C5C7CA] mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
      </div>

      {/* Delete button - appears on hover */}
      {!isSubtask && onDeleteTask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4 text-[#888888] dark:text-[#C5C7CA] hover:text-red-600 dark:hover:text-red-400" />
        </button>
      )}
    </div>
  );
}

interface SubtaskItemProps {
  task: Task;
  isInProgress: boolean;
  onShowSources?: (task: Task) => void;
  onSelectSubtask?: (task: Task) => void;
}

function SubtaskItem({ task, isInProgress, onShowSources, onSelectSubtask }: SubtaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (task.status === 'completed' && onSelectSubtask) {
      onSelectSubtask(task);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          group flex items-start gap-2.5 px-2 py-2 rounded cursor-pointer
          transition-colors
          ${isInProgress ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-[#F9F9F9] dark:hover:bg-[#2D2D2D]'}
        `}
      >
        {/* Expand/Collapse button for summarization */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#666666] dark:text-[#C5C7CA]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#666666] dark:text-[#C5C7CA]" />
          )}
        </button>

        {/* Checkbox */}
        <div
          className={`
            w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5
            transition-all cursor-pointer
            ${
              task.status === 'completed'
                ? 'bg-[#808080] dark:bg-[#10A37F] border-[#808080] dark:border-[#10A37F]'
                : 'border-[#D1D1D1] dark:border-[#3A3A3C] hover:border-[#808080] dark:hover:border-[#10A37F]'
            }
          `}
        >
          {task.status === 'completed' && (
            <svg
              className="w-full h-full text-white"
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              viewBox="0 0 18 18"
            >
              <path d="M4 9l3 3 7-7" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                task.status === 'completed'
                  ? 'line-through text-[#888888] dark:text-[#C5C7CA]'
                  : isInProgress
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-[#666666] dark:text-[#C5C7CA]'
              }`}
            >
              {task.title}
            </span>

            {/* Search icon for research tasks */}
            {task.isResearch && (
              <Search className={`w-3.5 h-3.5 ${isInProgress ? 'text-blue-600 dark:text-blue-400' : 'text-[#888888] dark:text-[#C5C7CA]'}`} />
            )}
          </div>

          {/* Show "Researching..." text for in-progress tasks */}
          {isInProgress && task.status !== 'completed' && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Researching...</p>
          )}
        </div>
      </div>

      {/* Summarization & Sources Section - Expanded */}
      {isExpanded && task.status === 'completed' && (
        <div className="ml-8 mt-1 mb-2">
          {/* Summarization */}
          {task.summarization && (
            <div className="px-3 py-2 bg-[#F9F9F9] dark:bg-[#2D2D2D] border border-[#E8E8E8] dark:border-[#3A3A3C] rounded-lg mb-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#666666] dark:text-[#C5C7CA] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#666666] dark:text-[#C5C7CA] mb-1">Summary</p>
                  <p className="text-xs text-[#888888] dark:text-[#C5C7CA] leading-relaxed">{task.summarization}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sources Button */}
          {task.sources && task.sources.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowSources?.(task);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2D2D2D] rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View {task.sources.length} sources</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskList;
