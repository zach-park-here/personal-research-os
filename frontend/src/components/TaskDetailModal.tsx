import { useState } from 'react';
import { X, ChevronDown, MessageCircle, Sparkles, Send, Loader2, ExternalLink } from 'lucide-react';
import { Task } from '../types';
import { useResearch } from '../hooks/useResearch';
import { useConversation } from '../hooks/useConversation';
import type { Message } from '../hooks/useConversation';
import type { ResearchReport, RecommendedPage } from '@personal-research-os/shared/types/research';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { researchResult, isLoading, error } = useResearch(task.id);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Get subtasks from backend research results
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
  })) || [];

  // Use conversation hook for chat
  const {
    messages,
    sendMessage,
    isLoading: chatLoading,
  } = useConversation({
    userId: 'demo-user',
    context: task.id,
    contextType: 'research',
    autoSave: true,
  });

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    await sendMessage(userMessage, 'user');

    // Simulate AI response (in production, this would call your AI service)
    setTimeout(async () => {
      const aiResponse = generateAIResponse(userMessage, researchResult?.report);
      await sendMessage(aiResponse, 'assistant');
    }, 1000);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setChatInput(suggestion);
    // Auto-send
    await sendMessage(suggestion, 'user');

    setTimeout(async () => {
      const aiResponse = generateAIResponse(suggestion, researchResult?.report);
      await sendMessage(aiResponse, 'assistant');
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-[1100px] h-[90vh] flex flex-col overflow-hidden transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-[#C5C7CA]" />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#ECECEC]">{task.title}</h2>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-[#C5C7CA]" />
                </button>
              </div>
            </div>

            {/* Header Buttons */}
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm text-gray-700 dark:text-[#ECECEC] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-[#ECECEC] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Suggestions</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Subtasks */}
            <div className="w-80 border-r border-gray-200 dark:border-[#3A3A3C] flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#3A3A3C]">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-[#ECECEC]">Subtasks</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Main Task */}
                <button
                  onClick={() => setSelectedSubtaskId(null)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#2D2D2D] transition-colors border-l-2 ${
                    !selectedSubtaskId ? 'border-blue-500 dark:border-[#10A37F] bg-blue-50 dark:bg-[#10A37F]/20' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-[#3A3A3C] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-[#ECECEC] truncate">Overview</p>
                      <p className="text-xs text-gray-500 dark:text-[#C5C7CA] mt-0.5">Main research summary</p>
                    </div>
                  </div>
                </button>

                {/* Subtasks List */}
                {subtasks.map((subtask) => (
                  <button
                    key={subtask.id}
                    onClick={() => setSelectedSubtaskId(subtask.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#2D2D2D] transition-colors border-l-2 ${
                      selectedSubtaskId === subtask.id ? 'border-blue-500 dark:border-[#10A37F] bg-blue-50 dark:bg-[#10A37F]/20' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        subtask.status === 'completed'
                          ? 'border-green-500 bg-green-500 dark:border-[#10A37F] dark:bg-[#10A37F]'
                          : 'border-gray-300 dark:border-[#3A3A3C]'
                      }`}>
                        {subtask.status === 'completed' && (
                          <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-[#ECECEC] truncate">{subtask.title}</p>
                        {subtask.researchStatus === 'completed' && (
                          <p className="text-xs text-green-600 dark:text-[#10A37F] mt-0.5">Research completed</p>
                        )}
                        {subtask.researchStatus === 'executing' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Researching...</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {subtasks.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-[#C5C7CA] text-sm">
                    No subtasks yet
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Research Results */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 dark:text-[#10A37F] animate-spin" />
                    <span className="ml-3 text-gray-600 dark:text-[#ECECEC]">Loading research results...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {!isLoading && !error && researchResult && (
                  <div className="space-y-8 max-w-4xl">
                    {/* Show main overview when no subtask is selected */}
                    {!selectedSubtaskId && (
                      <>
                        {/* Brief Section */}
                        <section>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">Brief</h3>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-[#C5C7CA] leading-relaxed whitespace-pre-line">
                              {researchResult.report.overview}
                            </p>
                          </div>
                        </section>

                        {/* Key Findings */}
                        {researchResult.report.key_findings && researchResult.report.key_findings.length > 0 && (
                          <section>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">Key findings</h3>
                            <ul className="space-y-3">
                              {researchResult.report.key_findings.map((finding, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-blue-500 dark:bg-[#10A37F] rounded-full mt-2 flex-shrink-0" />
                                  <p className="text-gray-700 dark:text-[#C5C7CA] leading-relaxed flex-1">{finding}</p>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Recommendations */}
                        {researchResult.report.recommendations && researchResult.report.recommendations.length > 0 && (
                          <section>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">Recommendations</h3>
                            <ul className="space-y-3">
                              {researchResult.report.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-green-500 dark:bg-[#10A37F] rounded-full mt-2 flex-shrink-0" />
                                  <p className="text-gray-700 dark:text-[#C5C7CA] leading-relaxed flex-1">{rec}</p>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Fallback message when no key findings or recommendations */}
                        {!('key_findings' in researchResult.report) &&
                         !('recommendations' in researchResult.report) && (
                          <div className="text-center py-8 text-gray-500 dark:text-[#C5C7CA]">
                            <p className="text-sm">
                              Research analysis complete. Review recommended pages below for detailed insights.
                            </p>
                          </div>
                        )}

                        {/* Pages Recommended */}
                        {researchResult.recommended_pages && researchResult.recommended_pages.length > 0 && (
                          <section>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">Pages recommended</h3>
                            <div className="space-y-3">
                              {researchResult.recommended_pages.map((page, idx) => (
                                <RecommendedPageCard key={idx} page={page} />
                              ))}
                            </div>
                          </section>
                        )}
                      </>
                    )}

                    {/* Show subtask details when a subtask is selected */}
                    {selectedSubtaskId && (() => {
                      const selectedSubtask = researchResult.subtask_results?.find(
                        (sr) => sr.subtask_id === selectedSubtaskId
                      );

                      if (!selectedSubtask) return null;

                      return (
                        <>
                          {/* Subtask Query */}
                          <section>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">
                              {selectedSubtask.subtask_title}
                            </h3>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Search query:</p>
                              <p className="text-sm text-blue-700 dark:text-blue-400">{selectedSubtask.query}</p>
                            </div>
                          </section>

                          {/* Sources */}
                          {selectedSubtask.sources && selectedSubtask.sources.length > 0 && (
                            <section>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-[#ECECEC] mb-4">
                                Sources ({selectedSubtask.sources.length})
                              </h3>
                              <div className="space-y-3">
                                {selectedSubtask.sources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-5 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-xl hover:border-blue-500 dark:hover:border-[#10A37F] hover:shadow-md transition-all group"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <h4 className="font-semibold text-gray-900 dark:text-[#ECECEC] group-hover:text-blue-600 dark:group-hover:text-[#10A37F] transition-colors">
                                            {source.title}
                                          </h4>
                                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-[#C5C7CA] group-hover:text-blue-500 dark:group-hover:text-[#10A37F] flex-shrink-0" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-[#C5C7CA] mb-3">
                                          {source.url ? new URL(source.url).hostname : ''}
                                        </p>
                                        {source.snippet && (
                                          <p className="text-sm text-gray-600 dark:text-[#C5C7CA] leading-relaxed">
                                            {source.snippet}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </section>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {!isLoading && !error && !researchResult && (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-[#C5C7CA]">
                    <p>No research results available yet</p>
                  </div>
                )}
              </div>

              {/* Chat Interface at Bottom */}
              <div className="border-t border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#2A2A2C]">
                {/* AI Suggestions */}
                {showSuggestions && (
                  <div className="px-8 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-500 dark:text-[#10A37F]" />
                      <span className="text-sm font-medium text-gray-700 dark:text-[#ECECEC]">Suggested next steps</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generateSuggestions(researchResult?.report).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-[#2D2D2D] border border-gray-300 dark:border-[#3A3A3C] rounded-lg hover:border-purple-500 dark:hover:border-[#10A37F] hover:bg-purple-50 dark:hover:bg-[#10A37F]/20 transition-colors text-gray-900 dark:text-[#ECECEC]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {messages.length > 0 && (
                  <div className="px-8 py-4 max-h-48 overflow-y-auto space-y-3">
                    {messages.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 dark:bg-[#10A37F] text-white'
                              : 'bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] text-gray-900 dark:text-[#ECECEC]'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] px-4 py-2 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-[#C5C7CA] rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 dark:bg-[#C5C7CA] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-2 h-2 bg-gray-400 dark:bg-[#C5C7CA] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Input */}
                <div className="px-8 py-4">
                  <div className="flex items-center gap-3 bg-white dark:bg-[#2D2D2D] rounded-lg border border-gray-300 dark:border-[#3A3A3C] focus-within:border-blue-500 dark:focus-within:border-[#10A37F] transition-colors">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask questions about the research..."
                      className="flex-1 px-4 py-3 outline-none text-sm bg-transparent text-gray-900 dark:text-[#ECECEC] placeholder:text-gray-400 dark:placeholder:text-[#C5C7CA]"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className="mr-2 p-2 bg-blue-500 dark:bg-[#10A37F] text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#0E926F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Recommended Page Card Component
function RecommendedPageCard({ page }: { page: RecommendedPage }) {
  const domain = page.url ? new URL(page.url).hostname : '';

  return (
    <a
      href={page.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-xl hover:border-blue-500 dark:hover:border-[#10A37F] hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-[#ECECEC] group-hover:text-blue-600 dark:group-hover:text-[#10A37F] transition-colors">
              {page.title}
            </h4>
            <ExternalLink className="w-4 h-4 text-gray-400 dark:text-[#C5C7CA] group-hover:text-blue-500 dark:group-hover:text-[#10A37F] flex-shrink-0" />
          </div>

          <p className="text-sm text-gray-500 dark:text-[#C5C7CA] mb-3">{domain}</p>

          {page.why_read && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-[#ECECEC] mb-1">Why read:</p>
              <p className="text-sm text-gray-600 dark:text-[#C5C7CA]">{page.why_read}</p>
            </div>
          )}

          {page.highlights && page.highlights.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-[#ECECEC] mb-1">Key highlights:</p>
              <ul className="space-y-1">
                {page.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-[#C5C7CA] flex items-start gap-2">
                    <span className="text-blue-500 dark:text-[#10A37F] mt-1">•</span>
                    <span className="flex-1">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// Helper: Generate AI suggestions based on research
function generateSuggestions(report?: ResearchReport): string[] {
  if (!report) {
    return [
      'Summarize key findings',
      'Create action plan',
      'Export to PDF',
    ];
  }

  return [
    'Create action plan from these findings',
    'Compare with our current approach',
    'Generate presentation slides',
    'Draft email summary for team',
  ];
}

// Helper: Generate AI response (mock - in production, call your AI service)
function generateAIResponse(question: string, report?: ResearchReport): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('summarize') || lowerQuestion.includes('summary')) {
    return report?.overview || 'I can help you summarize the research findings. The main points cover competitive analysis, market trends, and actionable recommendations.';
  }

  if (lowerQuestion.includes('action plan') || lowerQuestion.includes('next steps')) {
    return 'Based on the research, here are suggested next steps:\n\n1. Review competitor features and pricing\n2. Identify gaps in our current offering\n3. Prioritize features based on market demand\n4. Create implementation timeline';
  }

  if (lowerQuestion.includes('compare') || lowerQuestion.includes('vs')) {
    return 'I can help you compare findings. The research shows several key differentiators among competitors, particularly in pricing models, feature sets, and target markets.';
  }

  return 'I can help you understand the research better. What specific aspect would you like to explore?';
}
