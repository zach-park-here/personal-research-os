import { useState } from 'react';
import { Menu, Moon, Sun, X, Calendar, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import TaskDetailModal from '../components/TaskDetailModal';
import MeetingPrepView from '../components/MeetingPrepView';
import { MeetingList } from '../components/MeetingList';
import { useTasks } from '../hooks/useTasks';
import { useResearch } from '../hooks/useResearch';
import { useMeetings } from '../hooks/useMeetings';
import { useDarkMode } from '../contexts/DarkModeContext';
import type { Meeting } from '../types';

function Dashboard() {
  const { tasks, allTasks, addTask, selectedTask, setSelectedTask, deleteTask } = useTasks();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [taskInputValue, setTaskInputValue] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Fetch meetings data
  const {
    meetings,
    loading: meetingsLoading,
    error: meetingsError,
  } = useMeetings('demo-user');

  // Fetch research results for selected task or meeting
  const taskIdForResearch = selectedTask?.id || selectedMeeting?.prep_task?.id || '';
  const { researchResult } = useResearch(taskIdForResearch);

  // Check if selected task is meeting prep (use taskType from backend classification)
  // OR if selectedMeeting has completed research
  const isMeetingPrep =
    (selectedTask?.researchStatus === 'completed' && selectedTask?.taskType === 'meeting_prep') ||
    (selectedMeeting?.research?.status === 'completed');

  // Check if research is still in progress
  const isResearchInProgress = selectedTask?.isResearchEligible &&
    selectedTask?.researchStatus &&
    selectedTask?.researchStatus !== 'completed' &&
    selectedTask?.researchStatus !== 'not_started' &&
    selectedTask?.researchStatus !== 'failed';

  // DEBUG: Log routing decision
  if (selectedTask) {
    console.log('[Dashboard] 🔍 ROUTING DEBUG:');
    console.log('  selectedTask.id:', selectedTask.id);
    console.log('  selectedTask.title:', selectedTask.title);
    console.log('  selectedTask.taskType:', selectedTask.taskType);
    console.log('  selectedTask.researchStatus:', selectedTask.researchStatus);
    console.log('  isMeetingPrep:', isMeetingPrep);
    console.log('  isResearchInProgress:', isResearchInProgress);
    console.log('  researchResult exists:', !!researchResult);
    if (researchResult?.report) {
      console.log('  report keys:', Object.keys(researchResult.report));
      console.log('  has persona_analysis:', 'persona_analysis' in researchResult.report);
    }
    console.log('  Will show:', isResearchInProgress ? 'BLOCKED' : isMeetingPrep ? 'MeetingPrepView' : 'TaskDetailModal');
  }

  // Count completed tasks (including subtasks)
  const completedCount = allTasks.filter(task => task.status === 'completed').length;

  const handleCreateTask = async () => {
    if (!taskInputValue.trim() || isCreatingTask) return;

    setIsCreatingTask(true);

    try {
      // Create task - backend will automatically trigger research if needed
      await addTask(taskInputValue);

      // Reset input
      setTaskInputValue('');
      setShowTaskInput(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTask();
    } else if (e.key === 'Escape') {
      setTaskInputValue('');
      setShowTaskInput(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#1E1E1E] overflow-hidden transition-colors">
      {/* Left Sidebar */}
      <div
        className={`transition-all duration-300 ease-out ${
          sidebarVisible ? 'w-[280px]' : 'w-0'
        } overflow-hidden flex-shrink-0`}
      >
        <Sidebar
          onToggle={() => setSidebarVisible(false)}
          completedCount={completedCount}
          onAddTask={() => setShowTaskInput(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
            title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Menu Button */}
        {!sidebarVisible && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setSidebarVisible(true)}
              className="p-2 hover:bg-[#F3F3F3] dark:hover:bg-[#3A3A3C] rounded transition-colors"
              title="Show sidebar"
            >
              <Menu className="w-5 h-5 text-[#888888] dark:text-[#C5C7CA]" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="pt-12 pb-6 border-b border-[#F0F0F0] dark:border-[#3A3A3C] w-full max-w-[800px]">
          <div className="px-10">
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-xl font-bold dark:text-[#ECECEC]">Today</h1>
            </div>
            <p className="text-xs text-[#888888] dark:text-[#C5C7CA]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Today · {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin w-full max-w-[800px]">
          <div className="py-4 px-10">
            {/* Upcoming Meeting Section */}
            {tasks.filter(t => t.taskType === 'meeting_prep').length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <h2 className="text-sm font-semibold text-[#202020] dark:text-[#ECECEC]">
                    Upcoming Meeting
                  </h2>
                  <span className="text-xs text-[#888888] dark:text-[#C5C7CA] ml-1">
                    {tasks.filter(t => t.taskType === 'meeting_prep').length}
                  </span>
                </div>
                <div className="mt-2">
                  <TaskList
                    tasks={tasks.filter(t => t.taskType === 'meeting_prep')}
                    selectedTaskId={selectedTask?.id}
                    onSelectTask={setSelectedTask}
                    onDeleteTask={deleteTask}
                  />
                </div>
              </div>
            )}

            {/* Regular tasks - simple list without section header */}
            <div>
              <TaskList
                tasks={tasks.filter(t => t.taskType !== 'meeting_prep')}
                selectedTaskId={selectedTask?.id}
                onSelectTask={setSelectedTask}
                onDeleteTask={deleteTask}
              />
            </div>

            {/* Add Task - Inline Input */}
            <div className="mt-4">
              {showTaskInput ? (
                <div className="flex items-start gap-2.5 px-2 py-2">
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-[#D1D1D1] dark:border-[#3A3A3C] flex-shrink-0 mt-0.5" />
                  <input
                    type="text"
                    value={taskInputValue}
                    onChange={(e) => setTaskInputValue(e.target.value)}
                    onKeyDown={handleTaskInputKeyPress}
                    onBlur={() => {
                      // Small delay to allow Enter handler to run first
                      setTimeout(() => {
                        if (!isCreatingTask && !taskInputValue.trim()) {
                          setShowTaskInput(false);
                        }
                      }, 100);
                    }}
                    placeholder="Task name"
                    autoFocus
                    disabled={isCreatingTask}
                    className="flex-1 text-sm text-[#202020] dark:text-[#ECECEC] bg-transparent outline-none placeholder:text-[#888888] dark:placeholder:text-[#C5C7CA]"
                  />
                </div>
              ) : (
                <div
                  className="flex items-start gap-2.5 px-2 py-2 group cursor-pointer rounded hover:bg-[#F9F9F9] dark:hover:bg-[#2D2D2D] transition-colors"
                  onClick={() => setShowTaskInput(true)}
                >
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-[#D1D1D1] dark:border-[#3A3A3C] flex-shrink-0 mt-0.5 group-hover:border-[#808080] dark:group-hover:border-[#10A37F] transition-colors" />
                  <div className="flex-1 text-sm text-[#888888] dark:text-[#C5C7CA]">
                    Add task
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mt-8 mb-8 border-t border-gray-200 dark:border-gray-700" />

            {/* Meetings Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Meetings
              </h2>

              {meetingsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : meetingsError ? (
                <div className="text-red-500 text-sm">{meetingsError}</div>
              ) : (
                <MeetingList
                  meetings={meetings}
                  onMeetingClick={(meeting) => setSelectedMeeting(meeting)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Prep Modal View - Only show when completed */}
      {(selectedTask || selectedMeeting) && isMeetingPrep && researchResult && !isResearchInProgress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setSelectedTask(null);
            setSelectedMeeting(null);
          }}
        >
          <div
            className="relative w-[90vw] max-w-[1400px] h-[90vh] overflow-y-auto bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSelectedTask(null);
                setSelectedMeeting(null);
              }}
              className="sticky top-4 right-4 float-right z-10 p-2 bg-gray-100 dark:bg-[#2D2D2D] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <MeetingPrepView research={researchResult} />
          </div>
        </div>
      )}

      {/* Task Detail Modal (for general research or in-progress meeting prep) */}
      {selectedTask && !isMeetingPrep && !isResearchInProgress && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setSelectedMeeting(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
