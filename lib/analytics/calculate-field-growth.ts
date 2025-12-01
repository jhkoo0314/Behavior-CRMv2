/**
 * 필드 성장률(Field Growth Rate) 계산 함수
 * 
 * 필드별 성장률을 계산합니다.
 * 
 * 알고리즘:
 * - 전년 대비, 전월 대비 비교
 * - 처방량 또는 매출 기반 성장률
 * - (현재 기간 값 - 비교 기간 값) / 비교 기간 값 * 100
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';

export type ComparisonPeriod = 'previous_month' | 'previous_year' | 'custom';

export interface CalculateFieldGrowthInput {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  comparisonPeriod?: ComparisonPeriod;
  customComparisonStart?: Date;
  customComparisonEnd?: Date;
  accountId?: string;
}

/**
 * 특정 기간의 Prescription을 조회하고 총 처방량과 매출을 계산합니다.
 */
async function getPrescriptionMetrics(
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<{ totalQuantity: number; totalRevenue: number }> {
  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from('prescriptions')
    .select('quantity, price')
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

  const prescriptions = (data || []) as Prescription[];

  const totalQuantity = prescriptions.reduce(
    (sum, p) => sum + p.quantity,
    0
  );
  const totalRevenue = prescriptions.reduce((sum, p) => sum + p.price, 0);

  return { totalQuantity, totalRevenue };
}

/**
 * 비교 기간을 계산합니다.
 */
function calculateComparisonPeriod(
  periodStart: Date,
  periodEnd: Date,
  comparisonPeriod: ComparisonPeriod,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } {
  const periodLength = periodEnd.getTime() - periodStart.getTime();

  if (comparisonPeriod === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  if (comparisonPeriod === 'previous_month') {
    // 전월 동일 기간
    const start = new Date(periodStart);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(start.getTime() + periodLength);
    return { start, end };
  }

  if (comparisonPeriod === 'previous_year') {
    // 전년 동일 기간
    const start = new Date(periodStart);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(start.getTime() + periodLength);
    return { start, end };
  }

  // 기본값: 이전 기간 (동일 길이)
  const start = new Date(periodStart.getTime() - periodLength);
  const end = periodStart;
  return { start, end };
}

/**
 * 필드 성장률(Field Growth Rate)을 계산합니다.
 * 
 * @param input 계산 입력 파라미터
 * @returns 필드 성장률 (%, -100 ~ +무한대)
 */
export async function calculateFieldGrowth(
  input: CalculateFieldGrowthInput
): Promise<number> {
  console.group('calculateFieldGrowth: 시작');
  console.log('사용자 ID:', input.userId);
  console.log('기간:', input.periodStart, '~', input.periodEnd);
  console.log('비교 기간:', input.comparisonPeriod || 'previous_period');
  if (input.accountId) {
    console.log('병원 ID:', input.accountId);
  }

  try {
    // 현재 기간의 처방량과 매출 조회
    const currentMetrics = await getPrescriptionMetrics(
      input.periodStart,
      input.periodEnd,
      input.accountId
    );

    console.log('현재 기간 처방량:', currentMetrics.totalQuantity);
    console.log('현재 기간 매출:', currentMetrics.totalRevenue);

    // 비교 기간 계산
    const comparisonPeriod = input.comparisonPeriod || 'previous_month';
    const { start: compStart, end: compEnd } = calculateComparisonPeriod(
      input.periodStart,
      input.periodEnd,
      comparisonPeriod,
      input.customComparisonStart,
      input.customComparisonEnd
    );

    console.log('비교 기간:', compStart, '~', compEnd);

    // 비교 기간의 처방량과 매출 조회
    const comparisonMetrics = await getPrescriptionMetrics(
      compStart,
      compEnd,
      input.accountId
    );

    console.log('비교 기간 처방량:', comparisonMetrics.totalQuantity);
    console.log('비교 기간 매출:', comparisonMetrics.totalRevenue);

    // 성장률 계산 (처방량과 매출의 가중 평균)
    let quantityGrowthRate = 0;
    let revenueGrowthRate = 0;

    if (comparisonMetrics.totalQuantity > 0) {
      quantityGrowthRate =
        ((currentMetrics.totalQuantity - comparisonMetrics.totalQuantity) /
          comparisonMetrics.totalQuantity) *
        100;
    } else if (currentMetrics.totalQuantity > 0) {
      // 비교 기간이 0이지만 현재 기간에 처방이 있으면 100% 증가로 간주
      quantityGrowthRate = 100;
    }

    if (comparisonMetrics.totalRevenue > 0) {
      revenueGrowthRate =
        ((currentMetrics.totalRevenue - comparisonMetrics.totalRevenue) /
          comparisonMetrics.totalRevenue) *
        100;
    } else if (currentMetrics.totalRevenue > 0) {
      revenueGrowthRate = 100;
    }

    console.log('처방량 성장률:', quantityGrowthRate);
    console.log('매출 성장률:', revenueGrowthRate);

    // 가중 평균 (처방량 60%, 매출 40%)
    const fieldGrowthRate =
      quantityGrowthRate * 0.6 + revenueGrowthRate * 0.4;

    // -100 ~ +무한대 범위 (음수도 가능)
    const normalizedRate = Math.round(fieldGrowthRate * 100) / 100;

    console.log('최종 필드 성장률:', normalizedRate);
    console.groupEnd();

    return normalizedRate;
  } catch (error) {
    console.error('calculateFieldGrowth 에러:', error);
    console.groupEnd();
    throw error;
  }
}

