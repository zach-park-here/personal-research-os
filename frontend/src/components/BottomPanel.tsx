import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MessageSquare, ListTodo, Clock } from 'lucide-react';
import ChatPanel from './ChatPanel';
import TasksPanel from './TasksPanel';

interface BottomPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

type PanelTab = 'chat' | 'tasks' | 'history';

function BottomPanel({ isOpen, onToggle }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [height, setHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.min(
        Math.max(startHeightRef.current + deltaY, 200),
        window.innerHeight - 200
      );
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className="bg-white flex flex-col h-full"
    >
      {/* Resize Handle - only show when open */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className={`h-1 bg-[#E8EAED] hover:bg-[#D2D4D8] cursor-ns-resize transition-colors ${
            isDragging ? 'bg-[#5F6368]' : ''
          }`}
        />
      )}

      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E8EAED] bg-[#FAFAFA]">
        <div className="flex items-center gap-1">
          <TabButton
            icon={MessageSquare}
            label="Chat"
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <TabButton
            icon={ListTodo}
            label="Tasks"
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          />
          <TabButton
            icon={Clock}
            label="History"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
        </div>

        <button
          onClick={onToggle}
          className="p-1 hover:bg-[#E8EAED] rounded transition-colors"
          title="Close panel"
        >
          <ChevronDown className="w-4 h-4 text-[#5F6368]" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'tasks' && <TasksPanel />}
        {activeTab === 'history' && (
          <div className="flex items-center justify-center h-full text-[#888888]">
            <p className="text-sm">Chat history coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon: Icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-white text-[#202020] shadow-sm'
          : 'text-[#5F6368] hover:bg-[#E8EAED]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default BottomPanel;
