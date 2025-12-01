/**
 * Outcome Layer 4개 지표 상수 정의
 * PRD 3.2 참고: Outcome Layer 핵심 4대 지표
 */

export const OUTCOME_TYPES = {
  HIR: 'hir',
  CONVERSION_RATE: 'conversion_rate',
  FIELD_GROWTH_RATE: 'field_growth_rate',
  PRESCRIPTION_INDEX: 'prescription_index',
} as const;

export type OutcomeType = (typeof OUTCOME_TYPES)[keyof typeof OUTCOME_TYPES];

export const OUTCOME_TYPE_LABELS: Record<OutcomeType, string> = {
  [OUTCOME_TYPES.HIR]: 'HIR (High-Impact Rate)',
  [OUTCOME_TYPES.CONVERSION_RATE]: '전환률',
  [OUTCOME_TYPES.FIELD_GROWTH_RATE]: '필드 성장률',
  [OUTCOME_TYPES.PRESCRIPTION_INDEX]: '처방 기반 성과지수',
};

export const OUTCOME_TYPE_LIST = Object.values(OUTCOME_TYPES);

