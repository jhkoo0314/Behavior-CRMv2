/**
 * Activity 태그 상수 정의
 * 
 * Behavior-Driven Activity Form에서 사용하는 핵심 내용 태그 목록
 * 서버가 상황을 분석할 수 있도록 키워드를 선택 (HIR, RTR 검증용)
 */

export type ActivityTagId =
  | 'decision_maker'
  | 'need_identified'
  | 'proposal_sent'
  | 'demo_success'
  | 'competitor_active'
  | 'price_resistance'
  | 'budget_issue'
  | 'simple_visit'
  | 'material_delivery';

export type ActivityTagType = 'pos' | 'neg' | 'neu';

export interface ActivityTag {
  id: ActivityTagId;
  label: string;
  type: ActivityTagType;
}

/**
 * 태그 목록
 */
export const ACTIVITY_TAGS: ActivityTag[] = [
  { id: 'decision_maker', label: '결정권자 미팅', type: 'pos' },
  { id: 'need_identified', label: '니즈 파악', type: 'pos' },
  { id: 'proposal_sent', label: '견적 제출', type: 'pos' },
  { id: 'demo_success', label: '데모 성공', type: 'pos' },
  { id: 'competitor_active', label: '경쟁사 활동', type: 'neg' },
  { id: 'price_resistance', label: '가격 저항', type: 'neg' },
  { id: 'budget_issue', label: '예산 부족', type: 'neg' },
  { id: 'simple_visit', label: '단순 방문', type: 'neu' },
  { id: 'material_delivery', label: '자료 전달', type: 'neu' },
];

/**
 * 태그 ID 배열
 */
export const ACTIVITY_TAG_IDS = ACTIVITY_TAGS.map((tag) => tag.id);

/**
 * 태그 라벨 맵
 */
export const ACTIVITY_TAG_LABELS: Record<ActivityTagId, string> = {
  decision_maker: '결정권자 미팅',
  need_identified: '니즈 파악',
  proposal_sent: '견적 제출',
  demo_success: '데모 성공',
  competitor_active: '경쟁사 활동',
  price_resistance: '가격 저항',
  budget_issue: '예산 부족',
  simple_visit: '단순 방문',
  material_delivery: '자료 전달',
};

/**
 * 태그 타입별 필터링
 */
export function getTagsByType(type: ActivityTagType): ActivityTag[] {
  return ACTIVITY_TAGS.filter((tag) => tag.type === type);
}

/**
 * 긍정 태그만 반환
 */
export function getPositiveTags(): ActivityTag[] {
  return getTagsByType('pos');
}

/**
 * 부정 태그만 반환
 */
export function getNegativeTags(): ActivityTag[] {
  return getTagsByType('neg');
}

/**
 * 중립 태그만 반환
 */
export function getNeutralTags(): ActivityTag[] {
  return getTagsByType('neu');
}

