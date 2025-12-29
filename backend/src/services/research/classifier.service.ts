/**
 * Research Classifier Service
 *
 * Determines if a task requires research.
 * Lightweight, rule-based, with optional LLM fallback.
 */

import type { Task } from '@personal-research-os/shared/types';

// Research keywords (English + Korean)
const RESEARCH_KEYWORDS = [
  // English
  'research', 'analysis', 'analyze', 'market', 'competitive', 'report',
  'investigate', 'study', 'survey', 'review', 'compare', 'comparison',
  'explore', 'evaluate', 'assess', 'benchmark', 'trend', 'forecast',
  'insight', 'overview', 'summary', 'brief', 'landscape', 'strategy',
  'find out', 'look into', 'gather information',

  // Korean
  '조사', '분석', '리서치', '연구', '정리', '비교', '검토', '전략',
  '시장', '경쟁', '보고서', '트렌드', '동향', '현황', '파악',
];

// Non-research keywords (operational tasks)
const OPERATIONAL_KEYWORDS = [
  // English
  'fix', 'bug', 'deploy', 'update password', 'reset', 'configure',
  'install', 'uninstall', 'reboot', 'restart', 'backup', 'restore',
  'delete', 'remove', 'cancel', 'send email', 'call', 'meeting',
  'buy', 'order', 'pay', 'invoice', 'receipt', 'delivery',

  // Korean
  '처리', '수정', '버그', '배포', '비밀번호', '재부팅', '설치',
  '삭제', '제거', '취소', '이메일', '전화', '회의', '미팅',
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
