/**
 * 대시보드 공통 Mock 데이터
 * 
 * 모든 대시보드 컴포넌트가 동일한 데이터를 사용하도록 공유 Mock 데이터를 제공합니다.
 * 시연용으로 고정된 값을 사용하여 일관성을 유지합니다.
 */

export interface BehaviorMetrics {
  hir: number;
  rtr: number;
  bcr: number;
  phr: number;
  totalScore: number;
}

/**
 * 현재 사용자의 행동 지표 (고정값)
 * 모든 대시보드 컴포넌트에서 동일한 값을 사용합니다.
 */
export const mockCurrentMetrics: BehaviorMetrics = {
  hir: 75,
  rtr: 68,
  bcr: 72,
  phr: 70,
  totalScore: 71, // (75 + 68 + 72 + 70) / 4 = 71.25 → 71
};

/**
 * 이전 기간의 행동 지표 (고정값)
 * 변화량 계산에 사용됩니다.
 */
export const mockPreviousMetrics: BehaviorMetrics = {
  hir: 72, // -3
  rtr: 65, // -3
  bcr: 69, // -3
  phr: 67, // -3
  totalScore: 68, // (72 + 65 + 69 + 67) / 4 = 68.25 → 68
};

/**
 * 스캐터 차트용 현재 사용자 데이터
 * mockCurrentMetrics의 totalScore와 일치합니다.
 */
export const mockCurrentUserScatterData = {
  userId: 'mock-current-user',
  userName: '나',
  totalScore: mockCurrentMetrics.totalScore, // 71
  conversionRate: 62.5, // totalScore * 0.88 (약간의 변동 포함)
  isCurrentUser: true,
};

/**
 * 스캐터 차트용 팀원 데이터
 * 행동 점수와 매출 달성률의 양의 상관관계를 보여줍니다.
 */
export const mockTeamMembersScatterData = [
  { userId: 'mock-user-1', userName: '김영수', totalScore: 85, conversionRate: 78.2, isCurrentUser: false },
  { userId: 'mock-user-2', userName: '이지은', totalScore: 82, conversionRate: 75.5, isCurrentUser: false },
  { userId: 'mock-user-3', userName: '박민준', totalScore: 78, conversionRate: 71.3, isCurrentUser: false },
  { userId: 'mock-user-4', userName: '최수진', totalScore: 75, conversionRate: 68.5, isCurrentUser: false },
  { userId: 'mock-user-5', userName: '정호영', totalScore: 73, conversionRate: 66.2, isCurrentUser: false },
  { userId: 'mock-user-6', userName: '강미영', totalScore: 71, conversionRate: 64.0, isCurrentUser: false },
  { userId: 'mock-user-7', userName: '윤태현', totalScore: 68, conversionRate: 61.5, isCurrentUser: false },
  { userId: 'mock-user-8', userName: '임서연', totalScore: 65, conversionRate: 58.8, isCurrentUser: false },
  { userId: 'mock-user-9', userName: '한동욱', totalScore: 62, conversionRate: 56.2, isCurrentUser: false },
  { userId: 'mock-user-10', userName: '오지혜', totalScore: 58, conversionRate: 53.5, isCurrentUser: false },
  { userId: 'mock-user-11', userName: '신준호', totalScore: 55, conversionRate: 51.0, isCurrentUser: false },
  { userId: 'mock-user-12', userName: '배수아', totalScore: 52, conversionRate: 48.5, isCurrentUser: false },
];

/**
 * 액션 큐용 추천 행동 데이터
 */
import type { NextBestAction } from '@/lib/analytics/recommend-next-action';

export const mockNextBestActions: NextBestAction[] = [
  {
    account_id: 'mock-account-1',
    account_name: '서울대학교병원',
    contact_id: 'mock-contact-1',
    contact_name: '김과장',
    recommended_behavior: 'visit',
    reason: 'PHR 점수가 낮습니다. 최근 접촉이 없어 관계가 소원해질 위험이 있습니다.',
    priority: 95,
  },
  {
    account_id: 'mock-account-2',
    account_name: '세브란스병원',
    contact_id: 'mock-contact-2',
    contact_name: '이부장',
    recommended_behavior: 'contact',
    reason: 'RTR 점수가 하락했습니다. 긍정적인 태그 활동을 늘려 관계를 개선하세요.',
    priority: 85,
  },
  {
    account_id: 'mock-account-3',
    account_name: '아산병원',
    contact_id: 'mock-contact-3',
    contact_name: '박팀장',
    recommended_behavior: 'presentation',
    reason: 'BCR 루틴 점수가 낮습니다. 규칙적인 활동 패턴을 유지해보세요.',
    priority: 75,
  },
  {
    account_id: 'mock-account-4',
    account_name: '삼성서울병원',
    contact_id: 'mock-contact-4',
    contact_name: '최대리',
    recommended_behavior: 'visit',
    reason: 'HIR 정직입력 점수를 높이기 위해 활동 기록을 정확히 입력하세요.',
    priority: 70,
  },
  {
    account_id: 'mock-account-5',
    account_name: '가톨릭의대',
    contact_id: 'mock-contact-5',
    contact_name: '정과장',
    recommended_behavior: 'contact',
    reason: 'PHR 관리 점수가 낮습니다. 다음 활동 예정일을 설정하여 관리하세요.',
    priority: 65,
  },
];

