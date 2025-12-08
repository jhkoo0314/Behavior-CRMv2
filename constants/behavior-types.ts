/**
 * Behavior Layer 8개 지표 상수 정의
 * PRD 3.1 참고: Behavior Layer 지표
 */

export const BEHAVIOR_TYPES = {
  APPROACH: 'approach',
  CONTACT: 'contact',
  VISIT: 'visit',
  PRESENTATION: 'presentation',
  QUESTION: 'question',
  NEED_CREATION: 'need_creation',
  DEMONSTRATION: 'demonstration',
  FOLLOW_UP: 'follow_up',
} as const;

export type BehaviorType = (typeof BEHAVIOR_TYPES)[keyof typeof BEHAVIOR_TYPES];

export const BEHAVIOR_TYPE_LABELS: Record<BehaviorType, string> = {
  [BEHAVIOR_TYPES.APPROACH]: '접근',
  [BEHAVIOR_TYPES.CONTACT]: '컨택',
  [BEHAVIOR_TYPES.VISIT]: '대면',
  [BEHAVIOR_TYPES.PRESENTATION]: '프레젠테이션',
  [BEHAVIOR_TYPES.QUESTION]: '질문/탐색',
  [BEHAVIOR_TYPES.NEED_CREATION]: '필요성 자극',
  [BEHAVIOR_TYPES.DEMONSTRATION]: '시연/자료제공',
  [BEHAVIOR_TYPES.FOLLOW_UP]: '후속관리',
};

export const BEHAVIOR_TYPE_LIST = Object.values(BEHAVIOR_TYPES);






