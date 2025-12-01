/**
 * 처방 기반 성과지수 계산 함수
 * 
 * 처방량 기반 성과지수를 계산합니다.
 * 
 * 알고리즘:
 * - 처방량 * 가중치 (제품별, 병원별)
 * - 또는 처방량 증가율 + 처방 품질 점수
 * - 0-100 스케일로 정규화
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';
import type { Account } from '@/types/database.types';

/**
 * 특정 기간의 Prescription을 조회합니다.
 */
async function getPrescriptionsForPeriod(
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<Prescription[]> {
  const supabase = await createClerkSupabaseClient();

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
 * 병원 정보를 조회합니다.
 */
async function getAccount(accountId: string): Promise<Account | null> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error) {
    console.error('Account 조회 실패:', error);
    return null;
  }

  return data as Account;
}

/**
 * 병원 타입별 가중치를 계산합니다.
 */
function getAccountTypeWeight(accountType: string): number {
  const weights: Record<string, number> = {
    general_hospital: 1.5, // 종합병원: 높은 가중치
    hospital: 1.2, // 병원: 중간 가중치
    clinic: 1.0, // 의원: 기본 가중치
    pharmacy: 0.8, // 약국: 낮은 가중치
  };

  return weights[accountType] || 1.0;
}

/**
 * 처방 기반 성과지수를 계산합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @param accountId 병원 ID (선택사항)
 * @returns 처방 기반 성과지수 (0-100)
 */
export async function calculatePrescriptionIndex(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<number> {
  console.group('calculatePrescriptionIndex: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);
  if (accountId) {
    console.log('병원 ID:', accountId);
  }

  try {
    // 현재 기간의 처방 조회
    const prescriptions = await getPrescriptionsForPeriod(
      periodStart,
      periodEnd,
      accountId
    );

    console.log('조회된 처방 수:', prescriptions.length);

    if (prescriptions.length === 0) {
      console.log('처방이 없어 성과지수를 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 이전 기간 계산 (동일한 기간 길이)
    const periodLength = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodLength);
    const previousPeriodEnd = periodStart;

    const previousPrescriptions = await getPrescriptionsForPeriod(
      previousPeriodStart,
      previousPeriodEnd,
      accountId
    );

    console.log('이전 기간 처방 수:', previousPrescriptions.length);

    // 가중 처방량 계산
    let weightedQuantity = 0;
    let totalQuantity = 0;

    for (const prescription of prescriptions) {
      // 병원 타입별 가중치 적용
      const account = accountId
        ? await getAccount(prescription.account_id)
        : null;
      const accountWeight = account
        ? getAccountTypeWeight(account.type)
        : 1.0;

      // 가격도 고려 (높은 가격일수록 더 높은 가중치)
      const priceWeight = prescription.price > 0 ? Math.log10(prescription.price + 1) / 10 : 1.0;

      // 최종 가중치: 병원 타입 가중치 * 가격 가중치
      const finalWeight = accountWeight * priceWeight;

      weightedQuantity += prescription.quantity * finalWeight;
      totalQuantity += prescription.quantity;
    }

    console.log('가중 처방량:', weightedQuantity);
    console.log('총 처방량:', totalQuantity);

    // 처방량 증가율 계산
    const previousTotalQuantity = previousPrescriptions.reduce(
      (sum, p) => sum + p.quantity,
      0
    );

    let growthRate = 0;
    if (previousTotalQuantity > 0) {
      growthRate =
        ((totalQuantity - previousTotalQuantity) / previousTotalQuantity) *
        100;
    } else if (totalQuantity > 0) {
      growthRate = 100; // 이전 기간이 0이지만 현재 기간에 처방이 있으면 100% 증가
    }

    console.log('처방량 증가율:', growthRate);

    // 성과지수 계산: 가중 처방량 점수 (70%) + 증가율 점수 (30%)
    // 가중 처방량을 0-100 스케일로 정규화
    // 최대값 기준 정규화 (임시로 평균 처방량의 2배를 최대값으로 가정)
    const avgPrescriptionQuantity = totalQuantity / prescriptions.length;
    const maxExpectedQuantity = avgPrescriptionQuantity * 2 * prescriptions.length;
    const normalizedWeightedQuantity =
      maxExpectedQuantity > 0
        ? Math.min(100, (weightedQuantity / maxExpectedQuantity) * 100)
        : 0;

    // 증가율을 0-100 스케일로 정규화 (-100 ~ +무한대를 0-100으로)
    const normalizedGrowthRate = Math.min(100, Math.max(0, growthRate + 50));

    const prescriptionIndex =
      normalizedWeightedQuantity * 0.7 + normalizedGrowthRate * 0.3;

    const finalIndex = Math.round(Math.min(100, Math.max(0, prescriptionIndex)));

    console.log('정규화된 가중 처방량 점수:', normalizedWeightedQuantity);
    console.log('정규화된 증가율 점수:', normalizedGrowthRate);
    console.log('최종 처방 기반 성과지수:', finalIndex);
    console.groupEnd();

    return finalIndex;
  } catch (error) {
    console.error('calculatePrescriptionIndex 에러:', error);
    console.groupEnd();
    throw error;
  }
}

