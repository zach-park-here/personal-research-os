import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import TaskCreationChat from '../components/TaskCreationChat';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';

function Dashboard() {
  const { tasks, allTasks, addTask, selectedTask, setSelectedTask, updateTask } = useTasks();
  const [showTaskCreationChat, setShowTaskCreationChat] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sourcesTask, setSourcesTask] = useState<Task | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);

  // Count completed tasks (including subtasks)
  const completedCount = allTasks.filter(task => task.status === 'completed').length;

  const handleTaskCreatedFromChat = async (title: string, subtasksData?: Array<{ title: string; assignedTo: 'user' | 'ai'; isResearch: boolean; reasoning?: string }>) => {
    const task = await addTask(title);

    // If subtasks are provided, create them
    if (subtasksData && subtasksData.length > 0) {
      const subtasks: Task[] = subtasksData.map((st, idx) => ({
        id: crypto.randomUUID(),
        userId: 'demo-user',
        title: st.title,
        description: '',
        priority: 'medium' as const,
        // Only first AI task is completed for demo
        status: (st.assignedTo === 'ai' && idx === 0) ? 'completed' as const : 'active' as const,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: st.assignedTo,
        isResearch: st.isResearch,
        reasoning: st.reasoning || (st.isResearch ? `This task requires research to gather information about ${st.title.toLowerCase()}. I'll search relevant sources and compile findings.` : undefined),
        // Only completed tasks get summarization
        summarization: (st.isResearch && idx === 0) ? `AI agents are transforming content marketing through automation, personalization, and data-driven insights. Leading platforms like Jasper, Copy.ai, and ChatGPT enable marketers to generate high-quality content at scale while maintaining brand voice. Key applications include automated content creation, SEO optimization, social media scheduling, and audience targeting based on behavioral analytics.` : undefined,
        // Only completed tasks get sources
        sources: (st.isResearch && idx === 0) ? [
          {
            title: 'How AI Agents Are Revolutionizing Content Marketing in 2025',
            url: 'https://www.marketingaiinstitute.com/blog/ai-agents-content-marketing',
            description: 'Explore how autonomous AI agents are transforming content creation, distribution, and performance optimization for modern marketing teams.',
            favicon: '🤖',
          },
          {
            title: 'Top 10 AI Content Marketing Tools Every Marketer Should Know',
            url: 'https://www.hubspot.com/marketing/ai-content-tools',
            description: 'Comprehensive review of leading AI-powered content marketing platforms including Jasper, Copy.ai, Writesonic, and how they integrate into existing workflows.',
            favicon: '📊',
          },
          {
            title: 'AI Agents in Marketing: Use Cases, Benefits & Implementation',
            url: 'https://www.contentmarketinginstitute.com/articles/ai-agents-guide',
            description: 'Detailed guide on implementing AI agents for content ideation, creation, optimization, and distribution across multiple channels.',
            favicon: '📝',
          },
          {
            title: 'The Complete Guide to AI-Powered Content Pipelines',
            url: 'https://www.copyblogger.com/ai-content-pipeline',
            description: 'Learn how to build automated content pipelines using AI agents for research, drafting, editing, SEO optimization, and publishing.',
            favicon: '⚙️',
          },
          {
            title: 'Case Study: How Fortune 500 Companies Use AI Content Agents',
            url: 'https://www.forrester.com/report/ai-content-marketing-case-studies',
            description: 'Real-world examples from leading brands showing ROI improvements, time savings, and quality metrics when implementing AI content agents.',
            favicon: '📈',
          },
        ] : undefined,
        researchStatus: st.assignedTo === 'ai' && st.isResearch ? (idx === 0 ? 'completed' as const : 'executing' as const) : 'not_started' as const,
        parentId: task.id,
      }));

      // Update the task with subtasks
      updateTask(task.id, { subtasks });
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar - Fixed */}
      <div
        className={`transition-all duration-300 ease-out ${
          sidebarVisible ? 'w-[280px]' : 'w-0'
        } overflow-hidden flex-shrink-0`}
      >
        <Sidebar
          onToggle={() => setSidebarVisible(false)}
          completedCount={completedCount}
          onAddTask={() => setShowTaskCreationChat(true)}
        />
      </div>

      {/* Main Content Area - Task List */}
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        {/* Top Bar with Menu Button */}
        {!sidebarVisible && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setSidebarVisible(true)}
              className="p-2 hover:bg-[#F3F3F3] rounded transition-colors"
              title="Show sidebar"
            >
              <Menu className="w-5 h-5 text-[#888888]" />
            </button>
          </div>
        )}

        {/* Header - Today */}
        <div className="pt-12 pb-6 border-b border-[#F0F0F0] w-full max-w-[800px]">
          <div className="px-10">
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-xl font-bold">Today</h1>
            </div>
            <p className="text-xs text-[#888888]">Dec 24 · Today · Tuesday</p>
          </div>
        </div>

        {/* Task List - Scrollable area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin w-full max-w-[800px]">
          <div className="py-4 px-10">
            {/* Tasks */}
            <TaskList
              tasks={tasks}
              selectedTaskId={selectedTask?.id}
              onSelectTask={setSelectedTask}
              onShowSources={setSourcesTask}
              onSelectSubtask={setSelectedSubtask}
            />

            {/* Task Creation Chat - Inline */}
            {showTaskCreationChat && (
              <TaskCreationChat
                onClose={() => setShowTaskCreationChat(false)}
                onTaskCreated={handleTaskCreatedFromChat}
              />
            )}

            {/* Add Task Button */}
            {!showTaskCreationChat && (
              <div className="mt-4">
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => setShowTaskCreationChat(true)}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-[#D1D1D1] flex-shrink-0 group-hover:border-[#888888] transition-colors" />
                  <div className="flex-1 text-sm text-[#888888]">
                    Add task
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Panel (right side - slides in) */}
      {selectedTask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setSelectedTask(null)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-[#F0F0F0] shadow-2xl z-50 overflow-y-auto scrollbar-thin">
            <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
          </div>
        </>
      )}

      {/* Sources Panel (right side - slides in) */}
      {sourcesTask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setSourcesTask(null)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white border-l border-[#F0F0F0] shadow-2xl z-50 overflow-y-auto scrollbar-thin">
            <SourcesPanel task={sourcesTask} onClose={() => setSourcesTask(null)} />
          </div>
        </>
      )}

      {/* Subtask Detail Panel (center modal) */}
      {selectedSubtask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
            onClick={() => setSelectedSubtask(null)}
          />
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <SubtaskDetailPanel task={selectedSubtask} onClose={() => setSelectedSubtask(null)} />
          </div>
        </>
      )}
    </div>
  );
}

interface SourcesPanelProps {
  task: Task;
  onClose: () => void;
}

interface SubtaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

function SubtaskDetailPanel({ task, onClose }: SubtaskDetailPanelProps) {
  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F3F3F3] rounded transition-colors"
          >
            <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-[#202020]">Research Task 👋</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[#F3F3F3] rounded transition-colors">
            <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-[#F3F3F3] rounded transition-colors">
            <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-[#F3F3F3] rounded transition-colors">
            <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task Title */}
      <div className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#808080] border-2 border-[#808080] flex-shrink-0 mt-0.5 flex items-center justify-center">
            <svg
              className="w-full h-full text-white"
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              viewBox="0 0 18 18"
            >
              <path d="M4 9l3 3 7-7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base text-[#202020] mb-1">{task.title}</h3>
            <p className="text-xs text-[#888888]">Completed</p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Add Subtask Button */}
        <button className="w-full text-left px-3 py-2 text-sm text-[#888888] hover:bg-[#F9F9F9] rounded transition-colors mb-4">
          + Add subtask
        </button>

        {/* Summary Section */}
        {task.summarization && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h4 className="text-sm font-medium text-[#666666]">Comments</h4>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                AI
              </div>
              <div className="flex-1 bg-[#F9F9F9] rounded-lg px-4 py-3 border border-[#E8E8E8]">
                <p className="text-sm text-[#202020] leading-relaxed">{task.summarization}</p>
              </div>
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-[#E8E8E8] my-6" />

        {/* Labels Section */}
        <div className="mb-4">
          <button className="flex items-center gap-2 text-sm text-[#666666] hover:bg-[#F9F9F9] px-3 py-2 rounded transition-colors w-full text-left">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Labels</span>
            <span className="ml-auto text-[#888888]">+</span>
          </button>
        </div>

        {/* Due Date Section */}
        <div className="mb-4">
          <button className="flex items-center gap-2 text-sm text-[#666666] hover:bg-[#F9F9F9] px-3 py-2 rounded transition-colors w-full text-left">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Due date</span>
            <span className="ml-auto text-[#888888]">+</span>
          </button>
        </div>

        {/* Reminder Section */}
        <div className="mb-4">
          <button className="flex items-center gap-2 text-sm text-[#666666] hover:bg-[#F9F9F9] px-3 py-2 rounded transition-colors w-full text-left">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Reminder</span>
            <span className="ml-auto text-[#888888]">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SourcesPanel({ task, onClose }: SourcesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[#202020]">Citations</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F3F3F3] rounded transition-colors"
          >
            <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-[#666666]">{task.title}</p>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-6">
        {task.sources && task.sources.length > 0 ? (
          <div className="space-y-4">
            {task.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-[#E8E8E8] rounded-lg hover:border-[#888888] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Favicon or Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-[#F3F3F3] flex items-center justify-center text-lg">
                    {source.favicon ? (
                      <img src={source.favicon} alt="" className="w-4 h-4" />
                    ) : (
                      <span className="text-sm">🌐</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#202020] group-hover:text-blue-600 transition-colors mb-1">
                      {source.title}
                    </h3>
                    <p className="text-xs text-[#888888] leading-relaxed mb-2">
                      {source.description}
                    </p>
                    <p className="text-xs text-[#888888] truncate">
                      {new URL(source.url).hostname}
                    </p>
                  </div>

                  {/* External Link Icon */}
                  <svg className="w-4 h-4 text-[#888888] flex-shrink-0 mt-0.5 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#888888]">
            <p className="text-sm">No sources available</p>
          </div>
        )}
      </div>

      {/* Footer - More section (optional) */}
      <div className="px-6 py-4 border-t border-[#F0F0F0]">
        <p className="text-xs text-[#888888] text-center">
          {task.sources?.length || 0} sources found
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
