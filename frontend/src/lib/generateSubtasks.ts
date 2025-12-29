import { Task } from '../types';

/**
 * Generate subtasks using LLM (mocked for demo)
 * In production, this would call the backend API with LLM
 */
export async function generateSubtasks(mainTask: Task): Promise<string[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock subtask generation based on task title
  const lowerTitle = mainTask.title.toLowerCase();

  // Research tasks - generate research-related subtasks
  if (
    lowerTitle.includes('research') ||
    lowerTitle.includes('analyze') ||
    lowerTitle.includes('figure out') ||
    lowerTitle.includes('조사') ||
    lowerTitle.includes('분석')
  ) {
    return [
      '배경 조사 및 현황 파악',
      '주요 플레이어 및 경쟁사 분석',
      '사용 사례 및 베스트 프랙티스 수집',
      '실행 계획 및 next steps 정리',
    ];
  }

  // Market/competitive analysis
  if (
    lowerTitle.includes('market') ||
    lowerTitle.includes('competitive') ||
    lowerTitle.includes('competitor')
  ) {
    return [
      '시장 규모 및 트렌드 조사',
      '경쟁사 분석 및 포지셔닝',
      'SWOT 분석',
      '인사이트 및 권장사항 도출',
    ];
  }

  // Planning/strategy tasks
  if (
    lowerTitle.includes('plan') ||
    lowerTitle.includes('strategy') ||
    lowerTitle.includes('계획')
  ) {
    return [
      '목표 및 요구사항 정의',
      '옵션 검토 및 평가',
      '실행 계획 수립',
      '타임라인 및 마일스톤 설정',
    ];
  }

  // Default subtasks for general tasks
  return [
    '요구사항 확인',
    '실행',
    '검토 및 피드백',
    '완료',
  ];
}
