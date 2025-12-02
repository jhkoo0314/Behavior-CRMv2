/**
 * Next Best Action 추천 알고리즘
 * 
 * 병원별, 담당자별 추천 행동을 계산합니다.
 * PRD 5.4 참고: Next Best Action 추천
 */

import { getActivities } from '@/actions/activities/get-activities';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { getContacts } from '@/actions/contacts/get-contacts';
import { analyzeBehaviorOutcomeCorrelation } from '@/lib/analytics/analyze-behavior-outcome-correlation';
import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import type { BehaviorType } from '@/constants/behavior-types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';

export interface NextBestAction {
  account_id: string;
  account_name: string;
  contact_id?: string;
  contact_name?: string;
  recommended_behavior: BehaviorType;
  reason: string;
  priority: number; // 0-100, 우선순위 점수
}

/**
 * 다음 행동을 추천합니다.
 * 
 * @param userId 사용자 UUID
 * @param limit 추천 개수 제한 (기본값: 5)
 * @returns 추천 행동 배열
 */
export async function recommendNextActions(
  userId: string,
  limit: number = 5
): Promise<NextBestAction[]> {
  console.group('recommendNextActions: 시작');
  console.log('사용자 ID:', userId);
  console.log('제한:', limit);

  try {
    // 최근 30일 데이터 분석
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Behavior-Outcome 상관관계 분석
    const correlation = await analyzeBehaviorOutcomeCorrelation(
      userId,
      periodStart,
      periodEnd
    );

    // 전환률에 가장 중요한 Behavior 확인
    const topBehaviorsForConversion = correlation.summary.topBehaviorsForConversion;
    console.log('전환률에 중요한 Behavior:', topBehaviorsForConversion);

    if (topBehaviorsForConversion.length === 0) {
      console.log('상관관계 데이터가 부족하여 추천 불가');
      console.groupEnd();
      return [];
    }

    // 2. 최근 활동 패턴 분석
    const { data: recentActivities } = await getActivities({
      startDate: periodStart,
      endDate: periodEnd,
    });

    // 3. 병원 목록 조회
    const { data: accounts } = await getAccounts();
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    // 4. 각 병원별로 추천 행동 계산
    const recommendations: NextBestAction[] = [];

    for (const account of accounts) {
      // 해당 병원의 최근 활동 확인
      const accountActivities = recentActivities.filter(
        (a) => a.account_id === account.id
      );

      // 각 Behavior 타입별 활동 횟수 계산
      const behaviorCounts = new Map<BehaviorType, number>();
      for (const behaviorType of topBehaviorsForConversion) {
        behaviorCounts.set(behaviorType as BehaviorType, 0);
      }

      for (const activity of accountActivities) {
        if (topBehaviorsForConversion.includes(activity.behavior as BehaviorType)) {
          const count = behaviorCounts.get(activity.behavior as BehaviorType) || 0;
          behaviorCounts.set(activity.behavior as BehaviorType, count + 1);
        }
      }

      // 가장 부족한 Behavior 찾기
      let minCount = Infinity;
      let recommendedBehavior: BehaviorType | null = null;

      for (const [behaviorType, count] of behaviorCounts.entries()) {
        if (count < minCount) {
          minCount = count;
          recommendedBehavior = behaviorType;
        }
      }

      if (recommendedBehavior) {
        // 담당자 정보 조회
        const contacts = await getContacts({ account_id: account.id });
        const primaryContact = contacts.length > 0 ? contacts[0] : undefined;

        // 우선순위 계산: 활동이 적을수록, 전환률에 중요할수록 높은 우선순위
        const behaviorIndex = topBehaviorsForConversion.indexOf(recommendedBehavior);
        const priority = (topBehaviorsForConversion.length - behaviorIndex) * 20 + (minCount === 0 ? 20 : 0);
        const cappedPriority = Math.min(priority, 100);

        recommendations.push({
          account_id: account.id,
          account_name: account.name,
          contact_id: primaryContact?.id,
          contact_name: primaryContact?.name,
          recommended_behavior: recommendedBehavior,
          reason: `${BEHAVIOR_TYPE_LABELS[recommendedBehavior]} 행동이 전환률에 매우 중요하지만, ${account.name}에서 최근 활동이 부족합니다. (${minCount}회)`,
          priority: cappedPriority,
        });
      }
    }

    // 우선순위별로 정렬하고 제한
    recommendations.sort((a, b) => b.priority - a.priority);
    const limitedRecommendations = recommendations.slice(0, limit);

    console.log('추천 행동 생성 완료:', limitedRecommendations.length, '개');
    console.groupEnd();

    return limitedRecommendations;
  } catch (error) {
    console.error('recommendNextActions 에러:', error);
    console.groupEnd();
    throw error;
  }
}

