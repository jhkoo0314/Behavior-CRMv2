/**
 * 코칭 신호 생성 로직
 * 
 * 6가지 코칭 신호 타입을 감지하고 우선순위를 계산합니다.
 * PRD 5.2 참고: AI 기반 코칭 추천
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getActivities } from '@/actions/activities/get-activities';
import { getBehaviorScores } from '@/actions/behavior-scores/get-behavior-scores';
import { analyzeBehaviorOutcomeCorrelation } from '@/lib/analytics/analyze-behavior-outcome-correlation';
import { BEHAVIOR_TYPE_LIST, BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import type { BehaviorType } from '@/constants/behavior-types';
import type { Activity } from '@/types/database.types';

export interface CoachingSignal {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  recommended_action: string;
  account_id?: string;
  contact_id?: string;
  behavior_type?: BehaviorType; // 관련 Behavior 타입
}

/**
 * 코칭 신호를 생성합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 분석 기간 시작일
 * @param periodEnd 분석 기간 종료일
 * @returns 생성된 코칭 신호 배열
 */
export async function generateCoachingSignals(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.group('generateCoachingSignals: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);

  const signals: CoachingSignal[] = [];

  try {
    // 1. 행동 부족 경보 (behavior_lack)
    const behaviorLackSignals = await detectBehaviorLack(userId, periodStart, periodEnd);
    signals.push(...behaviorLackSignals);

    // 2. 관계 악화 경보 (relationship_decline)
    const relationshipDeclineSignals = await detectRelationshipDecline(
      userId,
      periodStart,
      periodEnd
    );
    signals.push(...relationshipDeclineSignals);

    // 3. 경쟁사 등장 경보 (competitor_activity)
    const competitorSignals = await detectCompetitorActivity(userId, periodStart, periodEnd);
    signals.push(...competitorSignals);

    // 4. 전환 행동 부족 경보 (conversion_lack)
    const conversionLackSignals = await detectConversionLack(userId, periodStart, periodEnd);
    signals.push(...conversionLackSignals);

    // 5. 병원 관심도 급하락 경보 (interest_drop)
    const interestDropSignals = await detectInterestDrop(userId, periodStart, periodEnd);
    signals.push(...interestDropSignals);

    // 6. 사원별 취약 행동 경보 (weak_behavior)
    const weakBehaviorSignals = await detectWeakBehavior(userId, periodStart, periodEnd);
    signals.push(...weakBehaviorSignals);

    console.log('생성된 코칭 신호 수:', signals.length);
    console.groupEnd();

    return signals;
  } catch (error) {
    console.error('generateCoachingSignals 에러:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 1. 행동 부족 경보 감지
 * 특정 Behavior 지표가 일정 기간 동안 기준치 이하
 */
async function detectBehaviorLack(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('행동 부족 경보 감지 시작');

  const signals: CoachingSignal[] = [];
  const { data: activities } = await getActivities({
    startDate: periodStart,
    endDate: periodEnd,
  });

  // 각 Behavior 타입별로 활동 횟수 확인
  for (const behaviorType of BEHAVIOR_TYPE_LIST) {
    const behaviorActivities = activities.filter((a) => a.behavior === behaviorType);
    const count = behaviorActivities.length;

    // 기준: 7일 기간이면 최소 1회, 30일 기간이면 최소 3회
    const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const threshold = days <= 7 ? 1 : days <= 30 ? 3 : 5;

    if (count < threshold) {
      signals.push({
        type: 'behavior_lack',
        priority: 'medium',
        message: `지난 ${days}일간 ${BEHAVIOR_TYPE_LABELS[behaviorType]} 활동이 부족합니다. (${count}회, 기준: ${threshold}회)`,
        recommended_action: `${BEHAVIOR_TYPE_LABELS[behaviorType]} 활동을 늘려보세요.`,
        behavior_type: behaviorType,
      });
    }
  }

  console.log('행동 부족 경보:', signals.length, '개');
  return signals;
}

/**
 * 2. 관계 악화 경보 감지
 * 특정 병원/담당자와의 활동 빈도 급감
 */
async function detectRelationshipDecline(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('관계 악화 경보 감지 시작');

  const signals: CoachingSignal[] = [];
  const { data: currentActivities } = await getActivities({
    startDate: periodStart,
    endDate: periodEnd,
  });

  // 이전 기간 계산
  const duration = periodEnd.getTime() - periodStart.getTime();
  const previousPeriodEnd = new Date(periodStart);
  previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);
  const previousPeriodStart = new Date(previousPeriodEnd);
  previousPeriodStart.setTime(previousPeriodStart.getTime() - duration);

  const { data: previousActivities } = await getActivities({
    startDate: previousPeriodStart,
    endDate: previousPeriodEnd,
  });

  // 병원별 활동 빈도 비교
  const currentAccountMap = new Map<string, number>();
  const previousAccountMap = new Map<string, number>();

  for (const activity of currentActivities) {
    const count = currentAccountMap.get(activity.account_id) || 0;
    currentAccountMap.set(activity.account_id, count + 1);
  }

  for (const activity of previousActivities) {
    const count = previousAccountMap.get(activity.account_id) || 0;
    previousAccountMap.set(activity.account_id, count + 1);
  }

  // 활동 빈도가 50% 이상 감소한 병원 찾기
  for (const [accountId, currentCount] of currentAccountMap.entries()) {
    const previousCount = previousAccountMap.get(accountId) || 0;

    if (previousCount > 0 && currentCount < previousCount * 0.5) {
      signals.push({
        type: 'relationship_decline',
        priority: 'high',
        message: `특정 병원과의 활동 빈도가 전 기간 대비 ${Math.round((1 - currentCount / previousCount) * 100)}% 감소했습니다.`,
        recommended_action: '병원과의 관계를 재점검하고 연락 빈도를 늘려보세요.',
        account_id: accountId,
      });
    }
  }

  console.log('관계 악화 경보:', signals.length, '개');
  return signals;
}

/**
 * 3. 경쟁사 등장 경보 감지
 * competitor_signals 테이블에서 최근 감지된 신호 확인
 */
async function detectCompetitorActivity(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('경쟁사 등장 경보 감지 시작');

  const signals: CoachingSignal[] = [];
  const supabase = await createClerkSupabaseClient();

  // 사용자의 병원들에 대한 경쟁사 신호 조회
  const { data: activities } = await getActivities({
    startDate: periodStart,
    endDate: periodEnd,
  });

  const accountIds = [...new Set(activities.map((a) => a.account_id))];

  if (accountIds.length === 0) {
    return signals;
  }

  const { data: competitorSignals } = await supabase
    .from('competitor_signals')
    .select('*')
    .in('account_id', accountIds)
    .gte('detected_at', periodStart.toISOString())
    .lte('detected_at', periodEnd.toISOString());

  if (competitorSignals && competitorSignals.length > 0) {
    // 병원별로 그룹화
    const accountMap = new Map<string, string[]>();

    for (const signal of competitorSignals) {
      if (!accountMap.has(signal.account_id)) {
        accountMap.set(signal.account_id, []);
      }
      accountMap.get(signal.account_id)!.push(signal.competitor_name);
    }

    for (const [accountId, competitors] of accountMap.entries()) {
      signals.push({
        type: 'competitor_activity',
        priority: 'high',
        message: `경쟁사 활동이 감지되었습니다: ${competitors.join(', ')}`,
        recommended_action: '경쟁사 대응 전략을 수립하고 고객과의 관계를 강화하세요.',
        account_id: accountId,
      });
    }
  }

  console.log('경쟁사 등장 경보:', signals.length, '개');
  return signals;
}

/**
 * 4. 전환 행동 부족 경보 감지
 * Behavior-Outcome 상관관계 분석 결과, 전환률에 중요한 행동이 부족
 */
async function detectConversionLack(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('전환 행동 부족 경보 감지 시작');

  const signals: CoachingSignal[] = [];

  try {
    // Behavior-Outcome 상관관계 분석
    const correlation = await analyzeBehaviorOutcomeCorrelation(
      userId,
      periodStart,
      periodEnd
    );

    // 전환률에 가장 중요한 Behavior 확인
    const topBehaviorsForConversion = correlation.summary.topBehaviorsForConversion;

    if (topBehaviorsForConversion.length === 0) {
      return signals;
    }

    // 해당 Behavior들의 최근 활동 확인
    const { data: activities } = await getActivities({
      startDate: periodStart,
      endDate: periodEnd,
    });

    for (const behaviorType of topBehaviorsForConversion) {
      const behaviorActivities = activities.filter((a) => a.behavior === behaviorType);
      const count = behaviorActivities.length;

      // 전환률에 중요한 행동이 부족하면 경보
      if (count < 2) {
        signals.push({
          type: 'conversion_lack',
          priority: 'high',
          message: `${BEHAVIOR_TYPE_LABELS[behaviorType]} 행동이 전환률에 매우 중요하지만 최근 활동이 부족합니다. (${count}회)`,
          recommended_action: `${BEHAVIOR_TYPE_LABELS[behaviorType]} 활동을 우선적으로 늘려보세요.`,
          behavior_type: behaviorType as BehaviorType,
        });
      }
    }
  } catch (error) {
    console.error('전환 행동 부족 경보 감지 중 에러:', error);
  }

  console.log('전환 행동 부족 경보:', signals.length, '개');
  return signals;
}

/**
 * 5. 병원 관심도 급하락 경보 감지
 * 특정 병원의 Activity 품질 점수 평균이 급락
 */
async function detectInterestDrop(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('병원 관심도 급하락 경보 감지 시작');

  const signals: CoachingSignal[] = [];
  const { data: currentActivities } = await getActivities({
    startDate: periodStart,
    endDate: periodEnd,
  });

  // 이전 기간 계산
  const duration = periodEnd.getTime() - periodStart.getTime();
  const previousPeriodEnd = new Date(periodStart);
  previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);
  const previousPeriodStart = new Date(previousPeriodEnd);
  previousPeriodStart.setTime(previousPeriodStart.getTime() - duration);

  const { data: previousActivities } = await getActivities({
    startDate: previousPeriodStart,
    endDate: previousPeriodEnd,
  });

  // 병원별 품질 점수 평균 계산
  const currentAccountMap = new Map<string, { sum: number; count: number }>();
  const previousAccountMap = new Map<string, { sum: number; count: number }>();

  for (const activity of currentActivities) {
    const existing = currentAccountMap.get(activity.account_id) || { sum: 0, count: 0 };
    existing.sum += activity.quality_score;
    existing.count += 1;
    currentAccountMap.set(activity.account_id, existing);
  }

  for (const activity of previousActivities) {
    const existing = previousAccountMap.get(activity.account_id) || { sum: 0, count: 0 };
    existing.sum += activity.quality_score;
    existing.count += 1;
    previousAccountMap.set(activity.account_id, existing);
  }

  // 품질 점수가 30 이하이거나 전 기간 대비 30% 이상 감소한 병원 찾기
  for (const [accountId, current] of currentAccountMap.entries()) {
    const currentAvg = current.count > 0 ? current.sum / current.count : 0;
    const previous = previousAccountMap.get(accountId);
    const previousAvg = previous && previous.count > 0 ? previous.sum / previous.count : 100;

    if (currentAvg <= 30 || (previousAvg > 0 && currentAvg < previousAvg * 0.7)) {
      signals.push({
        type: 'interest_drop',
        priority: 'medium',
        message: `특정 병원의 관심도가 급하락했습니다. (현재 평균 품질 점수: ${Math.round(currentAvg)})`,
        recommended_action: '병원과의 관계를 재점검하고 접근 방식을 개선하세요.',
        account_id: accountId,
      });
    }
  }

  console.log('병원 관심도 급하락 경보:', signals.length, '개');
  return signals;
}

/**
 * 6. 사원별 취약 행동 경보 감지
 * 개인 평균 대비 특정 Behavior 지표가 현저히 낮음
 */
async function detectWeakBehavior(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CoachingSignal[]> {
  console.log('사원별 취약 행동 경보 감지 시작');

  const signals: CoachingSignal[] = [];
  const behaviorScores = await getBehaviorScores({
    periodStart,
    periodEnd,
  });

  if (behaviorScores.length === 0) {
    return signals;
  }

  // 각 Behavior 타입별 평균 quality_score 계산
  const behaviorMap = new Map<string, number[]>();

  for (const score of behaviorScores) {
    if (!behaviorMap.has(score.behavior)) {
      behaviorMap.set(score.behavior, []);
    }
    behaviorMap.get(score.behavior)!.push(score.quality_score);
  }

  // 전체 평균 계산
  const allScores: number[] = [];
  for (const scores of behaviorMap.values()) {
    allScores.push(...scores);
  }

  const overallAvg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  // 개인 평균 대비 50% 이상 낮은 Behavior 찾기
  for (const [behaviorType, scores] of behaviorMap.entries()) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (overallAvg > 0 && avg < overallAvg * 0.5) {
      signals.push({
        type: 'weak_behavior',
        priority: 'low',
        message: `${BEHAVIOR_TYPE_LABELS[behaviorType as BehaviorType]} 행동이 개인 평균 대비 현저히 낮습니다. (평균: ${Math.round(avg)}, 전체 평균: ${Math.round(overallAvg)})`,
        recommended_action: `${BEHAVIOR_TYPE_LABELS[behaviorType as BehaviorType]} 행동의 품질을 개선하기 위한 교육이나 코칭을 받아보세요.`,
        behavior_type: behaviorType as BehaviorType,
      });
    }
  }

  console.log('사원별 취약 행동 경보:', signals.length, '개');
  return signals;
}

