'use server';

/**
 * Outcome 계산 및 저장 Server Action
 * 
 * 주기별 Outcome를 계산하고 outcomes 테이블에 저장합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { calculateConversionRate } from '@/lib/analytics/calculate-conversion-rate';
import { calculateFieldGrowth } from '@/lib/analytics/calculate-field-growth';
import { calculatePrescriptionIndex } from '@/lib/analytics/calculate-prescription-index';
import type { Outcome } from '@/types/database.types';
import type { PeriodType } from '@/types/outcome.types';

export interface CalculateAndSaveOutcomeInput {
  periodStart: Date | string;
  periodEnd: Date | string;
  periodType: PeriodType;
  accountId?: string;
}

/**
 * Outcome를 계산하고 저장합니다.
 */
export async function calculateAndSaveOutcome(
  input: CalculateAndSaveOutcomeInput
): Promise<Outcome> {
  console.group('calculateAndSaveOutcome: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const periodStart =
      input.periodStart instanceof Date
        ? input.periodStart
        : new Date(input.periodStart);
    const periodEnd =
      input.periodEnd instanceof Date
        ? input.periodEnd
        : new Date(input.periodEnd);

    console.log('기간:', periodStart, '~', periodEnd);
    console.log('기간 타입:', input.periodType);

    // 4개 지표 각각 계산
    console.log('HIR 계산 시작...');
    const hirScore = await calculateHIR(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    console.log('HIR 계산 완료:', hirScore);

    console.log('전환률 계산 시작...');
    const conversionRate = await calculateConversionRate(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    console.log('전환률 계산 완료:', conversionRate);

    console.log('필드 성장률 계산 시작...');
    const fieldGrowthRate = await calculateFieldGrowth({
      userId: userUuid,
      periodStart,
      periodEnd,
      comparisonPeriod: 'previous_month',
      accountId: input.accountId,
    });
    console.log('필드 성장률 계산 완료:', fieldGrowthRate);

    console.log('처방 기반 성과지수 계산 시작...');
    const prescriptionIndex = await calculatePrescriptionIndex(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    console.log('처방 기반 성과지수 계산 완료:', prescriptionIndex);

    // Supabase에 저장
    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 삭제 (중복 방지)
    let deleteQuery = supabase
      .from('outcomes')
      .delete()
      .eq('user_id', userUuid)
      .eq('period_type', input.periodType)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (input.accountId) {
      deleteQuery = deleteQuery.eq('account_id', input.accountId);
    } else {
      deleteQuery = deleteQuery.is('account_id', null);
    }

    await deleteQuery;

    // 새 데이터 삽입
    const insertData = {
      user_id: userUuid,
      account_id: input.accountId || null,
      hir_score: Math.round(hirScore),
      conversion_rate: Math.round(conversionRate),
      field_growth_rate: Math.round(fieldGrowthRate),
      prescription_index: Math.round(prescriptionIndex),
      period_type: input.periodType,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    };

    console.log('저장할 데이터:', insertData);

    const { data, error } = await supabase
      .from('outcomes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Outcome 저장 실패:', error);
      throw new Error(`Failed to save outcome: ${error.message}`);
    }

    console.log('저장 완료:', data);
    console.groupEnd();
    return data as Outcome;
  } catch (error) {
    console.error('calculateAndSaveOutcome 에러:', error);
    console.groupEnd();
    throw error;
  }
}

