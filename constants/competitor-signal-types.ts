/**
 * 경쟁사 신호 유형 상수 정의
 * 
 * 경쟁사 신호 수동 입력 시 사용할 신호 유형입니다.
 */

export const COMPETITOR_SIGNAL_TYPES = {
  MENTION: 'mention', // 언급
  PRICE_INQUIRY: 'price_inquiry', // 가격 문의
  PREFERENCE_CHANGE: 'preference_change', // 선호도 변화
  SAMPLE_REQUEST: 'sample_request', // 샘플 요청
  PRODUCT_COMPARISON: 'product_comparison', // 제품 비교
  SWITCHING_INTENT: 'switching_intent', // 전환 의도
  OTHER: 'other', // 기타
} as const;

export type CompetitorSignalType =
  (typeof COMPETITOR_SIGNAL_TYPES)[keyof typeof COMPETITOR_SIGNAL_TYPES];

export const COMPETITOR_SIGNAL_TYPE_LABELS: Record<
  CompetitorSignalType,
  string
> = {
  [COMPETITOR_SIGNAL_TYPES.MENTION]: '언급',
  [COMPETITOR_SIGNAL_TYPES.PRICE_INQUIRY]: '가격 문의',
  [COMPETITOR_SIGNAL_TYPES.PREFERENCE_CHANGE]: '선호도 변화',
  [COMPETITOR_SIGNAL_TYPES.SAMPLE_REQUEST]: '샘플 요청',
  [COMPETITOR_SIGNAL_TYPES.PRODUCT_COMPARISON]: '제품 비교',
  [COMPETITOR_SIGNAL_TYPES.SWITCHING_INTENT]: '전환 의도',
  [COMPETITOR_SIGNAL_TYPES.OTHER]: '기타',
};

export const COMPETITOR_SIGNAL_TYPE_LIST = Object.values(
  COMPETITOR_SIGNAL_TYPES
);

