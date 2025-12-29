import { Inbox, Calendar, Grid3x3, CheckCircle2, Plus, Bell, BarChart3, ChevronDown, Palette, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  onToggle: () => void;
  completedCount?: number;
  onAddTask?: () => void;
}

function Sidebar({ onToggle, onAddTask }: SidebarProps) {
  return (
    <div className="w-[280px] bg-[#FAFAFA] border-r border-[#F0F0F0] flex flex-col h-full flex-shrink-0">
      {/* User Profile */}
      <div className="px-4 py-3 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
              PJ
            </div>
            <span className="text-sm font-medium text-[#202020]">Park Jeong-ho</span>
            <ChevronDown className="w-4 h-4 text-[#888888]" />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-[#F0F0F0] rounded transition-colors">
              <Bell className="w-4 h-4 text-[#888888]" />
            </button>
            <button className="p-1.5 hover:bg-[#F0F0F0] rounded transition-colors">
              <BarChart3 className="w-4 h-4 text-[#888888]" />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-[#F0F0F0] rounded transition-colors"
              title="Hide sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-[#888888]" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-3 py-3">
        <button
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#DD4B39] hover:bg-white rounded-lg transition-colors font-medium"
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
        ${active ? 'bg-[#FFEFEB] text-[#202020] font-medium' : 'text-[#202020] hover:bg-white'}
      `}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs text-[#888888]">{count}</span>
      )}
    </button>
  );
}

export default Sidebar;
