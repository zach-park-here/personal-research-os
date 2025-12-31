/**
 * Research Classifier Service
 *
 * Determines if a task requires research and what type.
 * Lightweight, rule-based, with optional LLM fallback.
 */

import type { Task, UserProfile } from '@personal-research-os/shared/types';
import type { TaskType } from '@personal-research-os/shared/types/research';

// Research keywords (English + Korean)
const RESEARCH_KEYWORDS = [
  // English
  'research', 'analysis', 'analyze', 'market', 'competitive', 'report',
  'investigate', 'study', 'survey', 'review', 'compare', 'comparison',
  'explore', 'evaluate', 'assess', 'benchmark', 'trend', 'forecast',
  'insight', 'overview', 'summary', 'brief', 'landscape', 'strategy',
  'find out', 'look into', 'gather information',
  'preparing for', 'prep for', 'prepare for', 'meeting', 'interview', 'pitch',

  // Korean
  '조사', '분석', '리서치', '연구', '정리', '비교', '검토', '전략',
  '시장', '경쟁', '보고서', '트렌드', '동향', '현황', '파악',
  '미팅', '회의', '준비',
];

// Non-research keywords (operational tasks)
const OPERATIONAL_KEYWORDS = [
  // English
  'fix', 'bug', 'deploy', 'update password', 'reset', 'configure',
  'install', 'uninstall', 'reboot', 'restart', 'backup', 'restore',
  'delete', 'remove', 'cancel', 'send email', 'call',
  'buy', 'order', 'pay', 'invoice', 'receipt', 'delivery',

  // Korean
  '처리', '수정', '버그', '배포', '비밀번호', '재부팅', '설치',
  '삭제', '제거', '취소', '이메일', '전화',
  '구매', '주문', '결제', '배송', '택배', '영수증',
];

/**
 * Check if a task requires research
 */
export function isResearchTask(task: Task): boolean {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();

  // Check for operational keywords first (higher priority)
  const hasOperationalKeyword = OPERATIONAL_KEYWORDS.some(keyword =>
    text.includes(keyword.toLowerCase())
  );

  if (hasOperationalKeyword) {
    console.log(`[Classifier] Task "${task.title}" - Operational task detected`);
    return false;
  }

  // Check for research keywords
  const hasResearchKeyword = RESEARCH_KEYWORDS.some(keyword =>
    text.includes(keyword.toLowerCase())
  );

  if (hasResearchKeyword) {
    console.log(`[Classifier] Task "${task.title}" - Research task detected`);
    return true;
  }

  // Default: if unclear, treat as non-research
  console.log(`[Classifier] Task "${task.title}" - No clear signal, defaulting to non-research`);
  return false;
}

/**
 * Get classification confidence
 */
export function getClassificationConfidence(task: Task): number {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();

  const researchMatches = RESEARCH_KEYWORDS.filter(keyword =>
    text.includes(keyword.toLowerCase())
  ).length;

  const operationalMatches = OPERATIONAL_KEYWORDS.filter(keyword =>
    text.includes(keyword.toLowerCase())
  ).length;

  // More matches = higher confidence
  const totalMatches = researchMatches + operationalMatches;

  if (totalMatches === 0) {
    return 0.3; // Low confidence
  }

  if (researchMatches > operationalMatches) {
    return Math.min(0.5 + (researchMatches * 0.1), 0.95);
  }

  if (operationalMatches > researchMatches) {
    return Math.min(0.5 + (operationalMatches * 0.1), 0.95);
  }

  return 0.5; // Mixed signals
}

/**
 * Classify task type for specialized agent routing
 */
export function classifyTaskType(task: Task, userProfile?: UserProfile | null): TaskType {
  const title = task.title.toLowerCase();
  const description = (task.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // Meeting prep signals
  const meetingKeywords = [
    'meeting',
    'call',
    'prepare for',
    'preparing for',
    'prep for',
    'upcoming',
    'tomorrow',
    'next week',
    'this morning',
    'this afternoon',
    'interview',
    'pitch',
    'demo',
    'sales call',
  ];

  const hasMeetingSignal = meetingKeywords.some((keyword) => combined.includes(keyword));

  // Check for person/company mentions (name patterns)
  const hasPersonMention =
    combined.includes('@') || // email or company mention
    combined.includes(' with ') || // "meeting with John"
    /[A-Z][a-z]+ [A-Z][a-z]+/.test(task.title); // Name pattern (e.g., "John Smith")

  // DEMO MODE: If task has "meeting" or "prep" keywords, classify as meeting_prep
  // This allows "Preparing for the next meeting" to trigger meeting prep flow
  if (hasMeetingSignal) {
    console.log('[Classifier] Detected MEETING_PREP task (demo mode: any meeting keyword)');
    return 'meeting_prep';
  }

  // Meeting prep: meeting keyword + person/company mention
  if (hasMeetingSignal && hasPersonMention) {
    console.log('[Classifier] Detected MEETING_PREP task');
    return 'meeting_prep';
  }

  // For sales people, be more aggressive about meeting detection
  if (userProfile?.jobTitle?.toLowerCase().includes('sales')) {
    if (hasMeetingSignal || hasPersonMention) {
      console.log('[Classifier] Detected MEETING_PREP task (sales context)');
      return 'meeting_prep';
    }
  }

  // Default: general research
  console.log('[Classifier] Detected GENERAL_RESEARCH task');
  return 'general_research';
}

/**
 * Extract meeting context from task
 */
export interface MeetingContext {
  prospectName?: string;
  prospectTitle?: string;
  prospectCompany?: string;
  prospectEmail?: string;
  meetingDate?: string;
}

export function extractMeetingContext(task: Task): MeetingContext {
  const title = task.title;
  const description = task.description || '';
  const combined = `${title} ${description}`;

  const context: MeetingContext = {};

  // Extract email
  const emailMatch = combined.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    context.prospectEmail = emailMatch[0];
  }

  // Extract company (after @ symbol or "at")
  const atMatch = title.match(/@\s*([A-Z][A-Za-z0-9\s&]+)/);
  if (atMatch) {
    context.prospectCompany = atMatch[1].trim();
  } else {
    const companyMatch = title.match(/\bat\s+([A-Z][A-Za-z0-9\s&]+)/i);
    if (companyMatch) {
      context.prospectCompany = companyMatch[1].trim();
    }
  }

  // Extract name (after "with" or at start)
  const withMatch = title.match(/with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (withMatch) {
    context.prospectName = withMatch[1].trim();
  }

  // Extract title/role (common patterns)
  const titlePatterns = [
    /\(([A-Z][A-Za-z\s]+)\)/,  // "(VP of Sales)"
    /, ([A-Z][A-Za-z\s]+) at/i, // ", VP of Sales at"
  ];

  for (const pattern of titlePatterns) {
    const match = combined.match(pattern);
    if (match) {
      context.prospectTitle = match[1].trim();
      break;
    }
  }

  // Extract date/time signals
  const timeKeywords = [
    'tomorrow',
    'next week',
    'this morning',
    'this afternoon',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  for (const keyword of timeKeywords) {
    if (combined.toLowerCase().includes(keyword)) {
      context.meetingDate = keyword;
      break;
    }
  }

  // If we have "morning meeting" or "afternoon call" but no specific attendees,
  // check description for additional context
  if (description && !context.prospectName) {
    const descNameMatch = description.match(/with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (descNameMatch) {
      context.prospectName = descNameMatch[1].trim();
    }

    // Check for company in description
    if (!context.prospectCompany) {
      const descCompanyMatch = description.match(/(?:from|at)\s+([A-Z][A-Za-z0-9\s&]+)/i);
      if (descCompanyMatch) {
        context.prospectCompany = descCompanyMatch[1].trim();
      }
    }
  }

  return context;
}
