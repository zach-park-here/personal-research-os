import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

function TasksPanel() {
  const { allTasks } = useTasks();

  const activeTasks = allTasks.filter((task) => task.status === 'active');
  const completedTasks = allTasks.filter((task) => task.status === 'completed');

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="px-4 py-4 space-y-4">
        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2 flex items-center gap-2">
              <Circle className="w-3.5 h-3.5" />
              Active Tasks ({activeTasks.length})
            </h3>
            <div className="space-y-1">
              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed Tasks ({completedTasks.length})
            </h3>
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {allTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[#888888]">
            <Clock className="w-8 h-8 mb-2" />
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority?: string;
    parentId?: string;
  };
}

function TaskRow({ task }: TaskRowProps) {
  const isCompleted = task.status === 'completed';
  const isSubtask = !!task.parentId;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#F8F9FA] transition-colors ${
        isSubtask ? 'ml-6' : ''
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
          isCompleted ? 'bg-[#808080] border-[#808080]' : 'border-[#D1D1D1]'
        }`}
      >
        {isCompleted && (
          <svg
            className="w-full h-full text-white"
            fill="none"
            strokeWidth="2.5"
            stroke="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M3 8l3 3 7-7" />
          </svg>
        )}
      </div>

      <span
        className={`flex-1 text-sm ${
          isCompleted
            ? 'line-through text-[#888888]'
            : isSubtask
            ? 'text-[#666666]'
            : 'text-[#202020]'
        }`}
      >
        {task.title}
      </span>

      {task.priority === 'high' && !isCompleted && (
        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded">
          High
        </span>
      )}
    </div>
  );
}

export default TasksPanel;
