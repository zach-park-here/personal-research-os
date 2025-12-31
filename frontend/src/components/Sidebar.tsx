import { Inbox, Calendar, Grid3x3, CheckCircle2, Plus, Bell, ChevronDown, Palette, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  onToggle: () => void;
  completedCount?: number;
  onAddTask?: () => void;
}

function Sidebar({ onToggle, onAddTask }: SidebarProps) {
  return (
    <div className="w-[280px] bg-[#FAFAFA] dark:bg-[#202123] border-r border-[#F0F0F0] dark:border-[#3A3A3C] flex flex-col h-full flex-shrink-0">
      {/* User Profile */}
      <div className="px-4 py-3 border-b border-[#F0F0F0] dark:border-[#3A3A3C]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-300 dark:to-pink-300 flex items-center justify-center">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-900">ZP</span>
            </div>
            <span className="text-sm font-medium text-[#202020] dark:text-[#ECECEC]">Zach Park</span>
            <ChevronDown className="w-4 h-4 text-[#888888] dark:text-[#C5C7CA]" />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#3A3A3C] rounded transition-colors">
              <Bell className="w-4 h-4 text-[#888888] dark:text-[#C5C7CA]" />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#3A3A3C] rounded transition-colors"
              title="Hide sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-[#888888] dark:text-[#C5C7CA]" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-3 py-3">
        <button
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#DD4B39] dark:text-white hover:bg-white dark:hover:bg-[#3A3A3C] rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add task</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <NavItem icon={Inbox} label="Inbox" count={6} />
        <NavItem icon={Calendar} label="Today" count={6} active />
        <NavItem icon={Grid3x3} label="Upcoming" />
        <NavItem icon={Palette} label="Canvas" />
        <NavItem icon={CheckCircle2} label="Completed tasks" />
      </nav>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  count,
  active = false,
}: {
  icon: any;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      className={`
        w-full flex items-center justify-between px-3 py-2 text-sm
        transition-colors rounded-lg
        ${active ? 'bg-[#FFEFEB] dark:bg-[#10A37F]/20 text-[#202020] dark:text-[#ECECEC] font-medium' : 'text-[#202020] dark:text-[#ECECEC] hover:bg-white dark:hover:bg-[#3A3A3C]'}
      `}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs text-[#888888] dark:text-[#C5C7CA]">{count}</span>
      )}
    </button>
  );
}

export default Sidebar;
