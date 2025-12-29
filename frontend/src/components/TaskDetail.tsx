import { X, Calendar, Flag, Quote } from 'lucide-react';
import { Task } from '../types';
import ResearchProgress from './ResearchProgress';
import ResearchResults from './ResearchResults';
import { useResearch } from '../hooks/useResearch';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { researchResult, researchSteps } = useResearch(task.id);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Todoist style */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
        <h3 className="text-sm font-semibold">관리함</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#F3F3F3] rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task Title */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-[18px] h-[18px] rounded-full border-2 border-[#D1D1D1] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-normal">{task.title}</h2>
              {task.isResearchEligible && (
                <div
                  className="flex items-center justify-center w-5 h-5 rounded bg-[#F3F3F3] hover:bg-[#E8E8E8] transition-colors cursor-pointer"
                  title="리서치 작업"
                >
                  <Quote className="w-3 h-3 text-[#666666]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="px-5 pb-4 space-y-2">
        {task.dueDate && (
          <button className="flex items-center gap-2 text-xs text-[#666666] hover:bg-[#F3F3F3] px-2 py-1 rounded transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </button>
        )}
        <button className="flex items-center gap-2 text-xs text-[#666666] hover:bg-[#F3F3F3] px-2 py-1 rounded transition-colors">
          <Flag className="w-3.5 h-3.5" />
          <span>우선순위: {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '중간' : '낮음'}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F0F0F0]" />

      {/* Research Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
        {/* Show research progress if researching */}
        {task.researchStatus === 'executing' && researchSteps && (
          <ResearchProgress steps={researchSteps} />
        )}

        {/* Show results if completed */}
        {task.researchStatus === 'completed' && researchResult && (
          <ResearchResults result={researchResult} />
        )}

        {/* Default state */}
        {!task.isResearchEligible && (
          <div className="text-xs text-[#888888]">
            <p>일반 작업입니다. 리서치가 필요하지 않습니다.</p>
          </div>
        )}

        {task.isResearchEligible && task.researchStatus === 'not_started' && (
          <div className="text-xs text-[#888888]">
            <p>리서치가 곧 시작됩니다...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail;
