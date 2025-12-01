/**
 * 전환률(Conversion Rate) 계산 함수
 * 
 * 행동 → 성과 전환율을 계산합니다.
 * 
 * 알고리즘:
 * - 처방 증가율 기반 계산
 * - (현재 기간 처방량 - 이전 기간 처방량) / 이전 기간 처방량 * 100
 * - 또는 Activity → Prescription 연결 비율
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';
import type { Activity } from '@/types/database.types';

/**
 * 특정 기간의 Prescription을 조회합니다.
 */
async function getPrescriptionsForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<Prescription[]> {
  const supabase = await createClerkSupabaseClient();

  // Prescription은 user_id가 없으므로, activities를 통해 간접적으로 필터링
  // 또는 account_id로만 필터링
  let query = supabase
    .from('prescriptions')
    .select('*')
    .gte('prescription_date', periodStart.toISOString())
    .lte('prescription_date', periodEnd.toISOString());

  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Prescription 조회 실패:', error);
    throw new Error(`Failed to get prescriptions: ${error.message}`);
  }

  return (data || []) as Prescription[];
}

/**
 * 특정 기간의 Activity를 조회합니다.
 */
async function getActivitiesForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<Activity[]> {
  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', periodStart.toISOString())
    .lte('performed_at', periodEnd.toISOString());

  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Activity 조회 실패:', error);
    throw new Error(`Failed to get activities: ${error.message}`);
  }

  return (data || []) as Activity[];
}

/**
 * 전환률(Conversion Rate)을 계산합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @param accountId 병원 ID (선택사항)
 * @returns 전환률 (%, 0-100)
 */
export async function calculateConversionRate(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<number> {
  console.group('calculateConversionRate: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);
  if (accountId) {
    console.log('병원 ID:', accountId);
  }

  try {
    // 현재 기간의 처방량 조회
    const currentPrescriptions = await getPrescriptionsForPeriod(
      userId,
      periodStart,
      periodEnd,
      accountId
    );

    // 이전 기간 계산 (동일한 기간 길이)
    const periodLength =
      periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(
      periodStart.getTime() - periodLength
    );
    const previousPeriodEnd = periodStart;

    const previousPrescriptions = await getPrescriptionsForPeriod(
      userId,
      previousPeriodStart,
      previousPeriodEnd,
      accountId
    );

    console.log('현재 기간 처방 수:', currentPrescriptions.length);
    console.log('이전 기간 처방 수:', previousPrescriptions.length);

    // 처방량 합계 계산
    const currentQuantity = currentPrescriptions.reduce(
      (sum, p) => sum + p.quantity,
      0
    );
    const previousQuantity = previousPrescriptions.reduce(
      (sum, p) => sum + p.quantity,
      0
    );

    console.log('현재 기간 처방량:', currentQuantity);
    console.log('이전 기간 처방량:', previousQuantity);

    // 전환률 계산
    let conversionRate = 0;

    if (previousQuantity > 0) {
      // 증가율 계산
      conversionRate =
        ((currentQuantity - previousQuantity) / previousQuantity) * 100;
    } else if (currentQuantity > 0) {
      // 이전 기간이 0이지만 현재 기간에 처방이 있으면 100% 증가로 간주
      conversionRate = 100;
    }

    // Activity → Prescription 연결 비율도 고려
    const currentActivities = await getActivitiesForPeriod(
      userId,
      periodStart,
      periodEnd,
      accountId
    );

    const activitiesWithPrescriptions = currentActivities.filter(
      (activity) =>
        currentPrescriptions.some(
          (p) => p.related_activity_id === activity.id
        )
    );

    const activityConversionRatio =
      currentActivities.length > 0
        ? (activitiesWithPrescriptions.length / currentActivities.length) * 100
        : 0;

    console.log('Activity → Prescription 연결 비율:', activityConversionRatio);

    // 두 지표의 가중 평균 (처방 증가율 70%, 연결 비율 30%)
    const finalConversionRate =
      conversionRate * 0.7 + activityConversionRatio * 0.3;

    // 0-100 범위로 제한
    const normalizedRate = Math.round(
      Math.min(100, Math.max(-100, finalConversionRate))
    );

    console.log('최종 전환률:', normalizedRate);
    console.groupEnd();

    return normalizedRate;
  } catch (error) {
    console.error('calculateConversionRate 에러:', error);
    console.groupEnd();
    throw error;
  }
}

