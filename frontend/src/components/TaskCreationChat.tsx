import { useState } from 'react';
import { ArrowUp, ChevronDown, RotateCcw, Check, Loader2, Search, User, Bot, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Subtask {
  id: string;
  title: string;
  assignedTo: 'user' | 'ai';
  isResearch: boolean;
  searchKeywords?: string[];
  sources?: Array<{ icon: string; name: string }>;
  status?: 'pending' | 'researching' | 'completed';
}

interface TaskCreationChatProps {
  onClose: () => void;
  onTaskCreated: (title: string, subtasksData?: Array<{ title: string; assignedTo: 'user' | 'ai'; isResearch: boolean; reasoning?: string }>) => void;
}

const MODELS = [
  { id: 'opus-4.5', name: 'Opus 4.5 · Extended' },
  { id: 'sonnet-4.5', name: 'Sonnet 4.5' },
  { id: 'haiku-4', name: 'Haiku 4' },
];

function TaskCreationChat({ onClose, onTaskCreated }: TaskCreationChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [mainTask, setMainTask] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [phase, setPhase] = useState<'input' | 'breakdown' | 'research' | 'confirmed'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('opus-4.5');
  const [showModelDropdown, setShowModelDropdown] = useState(false);


  const generateSubtasksFromTitle = (title: string): Array<{ title: string; assignedTo: 'user' | 'ai'; isResearch: boolean }> => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('research') || lowerTitle.includes('analyze')) {
      return [
        { title: 'Background research and current state analysis', assignedTo: 'ai', isResearch: true },
        { title: 'Key players and competitive analysis', assignedTo: 'ai', isResearch: true },
        { title: 'Use cases and best practices collection', assignedTo: 'ai', isResearch: true },
        { title: 'Action plan and next steps summary', assignedTo: 'user', isResearch: false },
      ];
    }

    return [
      { title: 'Define goals and requirements', assignedTo: 'user', isResearch: false },
      { title: 'Execute main work', assignedTo: 'user', isResearch: false },
      { title: 'Review and refine', assignedTo: 'user', isResearch: false },
    ];
  };

  const generateSearchKeywords = (): string[] => {
    // Mock keywords based on task
    return ['AI agents', 'content marketing', 'automation tools'];
  };

  const generateMockSources = (): Array<{ icon: string; name: string }> => {
    const sources = [
      { icon: '🌐', name: 'Wikipedia' },
      { icon: '📰', name: 'TechCrunch' },
      { icon: '📊', name: 'Statista' },
      { icon: '🔬', name: 'Research Gate' },
      { icon: '📘', name: 'Medium' },
    ];
    const count = Math.floor(Math.random() * 2) + 2;
    return sources.slice(0, count);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Phase: Break down into subtasks
    setMainTask(userMessage);
    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const breakdown = generateSubtasksFromTitle(userMessage);
    const newSubtasks = breakdown.map((subtask, index) => ({
      id: `subtask-${index}`,
      title: subtask.title,
      assignedTo: subtask.assignedTo,
      isResearch: subtask.isResearch,
    }));

    setSubtasks(newSubtasks);

    const aiMessage = `I've broken down your task into ${newSubtasks.length} smaller tasks:`;
    setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
    setIsGenerating(false);
    setPhase('breakdown');
  };

  const handleConfirm = async () => {
    // Prepare keywords for research tasks
    const researchTasks = subtasks.filter(st => st.isResearch);
    if (researchTasks.length > 0) {
      const keywords = generateSearchKeywords();
      const updatedSubtasks = subtasks.map(st =>
        st.isResearch ? { ...st, searchKeywords: keywords } : st
      );
      setSubtasks(updatedSubtasks);
    }

    // Move to confirmed phase
    setPhase('confirmed');

    // Start research visualization
    const aiTasks = subtasks.filter(st => st.assignedTo === 'ai');

    for (let i = 0; i < aiTasks.length; i++) {
      const taskId = aiTasks[i].id;

      setSubtasks(prev => prev.map(st =>
        st.id === taskId ? { ...st, status: 'researching' as const } : st
      ));

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const sources = generateMockSources();
      setSubtasks(prev => prev.map(st =>
        st.id === taskId ? { ...st, status: 'completed' as const, sources } : st
      ));
    }

    // After all research complete, save task with subtasks data
    setTimeout(() => {
      const subtasksData = subtasks.map(st => ({
        title: st.title,
        assignedTo: st.assignedTo,
        isResearch: st.isResearch,
        reasoning: st.isResearch ? `Researching ${st.title.toLowerCase()} to gather comprehensive information and insights.` : undefined,
      }));
      onTaskCreated(mainTask, subtasksData);
      onClose();
    }, 500);
  };

  const handleSubtaskEdit = (id: string, newTitle: string) => {
    setSubtasks(prev => prev.map(st =>
      st.id === id ? { ...st, title: newTitle } : st
    ));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleAddSubtask = () => {
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: '',
      assignedTo: 'user',
      isResearch: false,
    };
    setSubtasks(prev => [...prev, newSubtask]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModelName = MODELS.find(m => m.id === selectedModel)?.name || 'Opus 4.5 · Extended';

  return (
    <div className="mb-6 border border-[#D1D1D1] rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Main Task Title */}
      {mainTask && (
        <div className="px-4 py-3 border-b border-[#E8E8E8]">
          <h3 className="text-base font-medium text-[#202020]">{mainTask}</h3>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && phase === 'input' && (
        <div className="px-4 py-3 max-h-[300px] overflow-y-auto space-y-3 border-b border-[#E8E8E8]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#F4F4F4] text-[#202020]'
                    : 'bg-[#F9F9F9] text-[#202020] border border-[#E8E8E8]'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-[#F9F9F9] px-4 py-2.5 rounded-2xl border border-[#E8E8E8]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#888888] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editable Subtasks List - Breakdown Phase */}
      {phase === 'breakdown' && subtasks.length > 0 && (
        <div className="px-4 py-3 border-b border-[#E8E8E8]">
          {/* AI Message */}
          {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
            <div className="mb-3">
              <div className="bg-[#F9F9F9] px-4 py-2.5 rounded-2xl border border-[#E8E8E8] inline-block">
                <p className="text-sm leading-relaxed">{messages[messages.length - 1].content}</p>
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <SubtaskEditItem
                key={subtask.id}
                subtask={subtask}
                onEdit={handleSubtaskEdit}
                onDelete={handleDeleteSubtask}
              />
            ))}
          </div>

          {/* Add Subtask Button */}
          <button
            onClick={handleAddSubtask}
            className="mt-2 text-xs text-[#888888] hover:text-[#202020] transition-colors flex items-center gap-1"
          >
            <span>+ Add subtask</span>
          </button>
        </div>
      )}

      {/* Subtasks Research Progress (Phase: confirmed) */}
      {phase === 'confirmed' && subtasks.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto">
          {/* AI Tasks */}
          {subtasks.filter(st => st.assignedTo === 'ai').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-semibold text-[#888888] uppercase">AI Tasks</h4>
              </div>
              {subtasks.filter(st => st.assignedTo === 'ai').map((subtask) => (
                <div key={subtask.id} className="py-2 ml-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {subtask.status === 'completed' && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                      {subtask.status === 'researching' && (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {!subtask.status && (
                        <div className="w-5 h-5 rounded-full border-2 border-[#D1D1D1]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${subtask.status === 'researching' ? 'text-blue-600 font-medium' : subtask.status === 'completed' ? 'text-[#666666]' : 'text-[#202020]'}`}>
                          {subtask.title}
                        </p>
                        {subtask.isResearch && subtask.status === 'researching' && (
                          <Search className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      {subtask.status === 'researching' && (
                        <p className="text-xs text-[#888888] mt-0.5">Researching...</p>
                      )}
                      {subtask.searchKeywords && !subtask.status && (
                        <div className="mt-1 text-xs text-[#888888]">
                          Keywords: {subtask.searchKeywords.join(', ')}
                        </div>
                      )}
                      {subtask.status === 'completed' && subtask.sources && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="px-2 py-1 bg-[#F0F0F0] rounded-md flex items-center gap-1.5 flex-wrap">
                            {subtask.sources.map((source, idx) => (
                              <span key={idx} className="text-xs flex items-center gap-0.5">
                                <span>{source.icon}</span>
                                <span className="text-[#666666]">{source.name}</span>
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-[#888888]">Sources</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User Tasks */}
          {subtasks.filter(st => st.assignedTo === 'user').length > 0 && (
            <div className="pt-3 border-t border-[#E8E8E8]">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#DD4B39]" />
                <h4 className="text-xs font-semibold text-[#888888] uppercase">Your Tasks</h4>
              </div>
              {subtasks.filter(st => st.assignedTo === 'user').map((subtask) => (
                <div key={subtask.id} className="py-2 ml-6">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#D1D1D1] flex-shrink-0" />
                    <p className="text-sm text-[#202020]">{subtask.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subtasks.filter(st => st.assignedTo === 'ai').every(st => st.status === 'completed') && (
            <div className="pt-3 border-t border-[#E8E8E8]">
              <p className="text-sm text-green-600 font-medium">✓ All AI research tasks completed!</p>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[#F9F9F9] border-t border-[#E8E8E8]">
        {phase === 'input' ? (
          <>
            <div className="relative bg-white rounded-xl border border-[#D1D1D1] focus-within:border-[#888888] transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Set your task"
                className="w-full px-4 py-3 pr-12 resize-none outline-none text-sm bg-transparent"
                rows={1}
                autoFocus
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating}
                  className="p-1.5 bg-[#202020] text-white rounded-lg hover:bg-[#333333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#202020] transition-colors"
                >
                  <span>{selectedModelName}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#D1D1D1] rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                    {MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4] transition-colors ${
                          selectedModel === model.id ? 'text-[#202020] font-medium' : 'text-[#666666]'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#202020] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Close</span>
              </button>
            </div>
          </>
        ) : phase === 'breakdown' ? (
          <button
            onClick={handleConfirm}
            disabled={subtasks.length === 0}
            className="w-full px-4 py-2 bg-[#DD4B39] text-white text-sm rounded-lg hover:bg-[#C43D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Confirm & Start Research
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface SubtaskEditItemProps {
  subtask: Subtask;
  onEdit: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

function SubtaskEditItem({ subtask, onEdit, onDelete }: SubtaskEditItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(subtask.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#D1D1D1] mt-0.5" />

      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-[#888888] rounded outline-none"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#202020] cursor-text hover:bg-[#F4F4F4] px-2 py-1 rounded transition-colors"
          >
            {subtask.title || 'Click to edit...'}
          </div>
        )}
        <div className="px-2 mt-0.5 text-xs text-[#888888]">
          {subtask.assignedTo === 'ai' ? 'AI' : 'You'}
          {subtask.isResearch && ' · Research'}
        </div>
      </div>

      <button
        onClick={() => onDelete(subtask.id)}
        className="flex-shrink-0 p-1 hover:bg-[#F4F4F4] rounded transition-colors mt-0.5"
        title="Delete subtask"
      >
        <X className="w-4 h-4 text-[#888888]" />
      </button>
    </div>
  );
}

export default TaskCreationChat;
