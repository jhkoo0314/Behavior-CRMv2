/**
 * 코칭 추천 액션 생성
 * 
 * 신호 타입별 개인화된 코칭 메시지를 생성합니다.
 * PRD 5.2.2 참고: 코칭 추천 액션 생성
 */

import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import type { BehaviorType } from '@/constants/behavior-types';

/**
 * 코칭 추천 액션을 생성합니다.
 * 
 * @param signalType 신호 타입
 * @param behaviorType 관련 Behavior 타입 (선택적)
 * @param accountName 병원 이름 (선택적)
 * @returns 추천 액션 메시지
 */
export function generateCoachingAction(
  signalType: string,
  behaviorType?: BehaviorType,
  accountName?: string
): string {
  const behaviorLabel = behaviorType ? BEHAVIOR_TYPE_LABELS[behaviorType] : '';

  switch (signalType) {
    case 'behavior_lack':
      if (behaviorType) {
        return `지난 기간 동안 ${behaviorLabel} 활동이 부족합니다. 주요 병원에 ${behaviorLabel} 활동을 늘려보세요.`;
      }
      return '특정 행동 활동이 부족합니다. 활동 빈도를 늘려보세요.';

    case 'relationship_decline':
      if (accountName) {
        return `${accountName}과의 관계가 악화되고 있습니다. 연락 빈도를 늘리고 관계를 재점검하세요.`;
      }
      return '특정 병원과의 관계가 악화되고 있습니다. 관계를 재점검하고 연락 빈도를 늘려보세요.';

    case 'competitor_activity':
      if (accountName) {
        return `${accountName}에서 경쟁사 활동이 감지되었습니다. 경쟁사 대응 전략을 수립하고 고객과의 관계를 강화하세요.`;
      }
      return '경쟁사 활동이 감지되었습니다. 경쟁사 대응 전략을 수립하고 고객과의 관계를 강화하세요.';

    case 'conversion_lack':
      if (behaviorType) {
        return `${behaviorLabel} 행동이 전환률에 매우 중요합니다. 고객의 니즈를 더 깊이 파악하는 ${behaviorLabel} 활동을 우선적으로 늘려보세요.`;
      }
      return '전환률에 중요한 행동이 부족합니다. Behavior-Outcome 상관관계를 확인하고 중요한 행동을 우선적으로 늘려보세요.';

    case 'interest_drop':
      if (accountName) {
        return `${accountName}의 관심도가 급하락했습니다. 접근 방식을 개선하고 고객의 니즈를 다시 파악해보세요.`;
      }
      return '특정 병원의 관심도가 급하락했습니다. 관계를 재점검하고 접근 방식을 개선하세요.';

    case 'weak_behavior':
      if (behaviorType) {
        return `${behaviorLabel} 행동의 품질이 개인 평균 대비 낮습니다. ${behaviorLabel} 활동의 품질을 개선하기 위한 교육이나 코칭을 받아보세요.`;
      }
      return '특정 행동의 품질이 개인 평균 대비 낮습니다. 해당 행동의 품질을 개선하기 위한 교육이나 코칭을 받아보세요.';

    default:
      return '행동 패턴을 분석하여 개선할 점을 찾아보세요.';
  }
}



