'use server';

/**
 * Outcome 계산 및 저장 Server Action
 * 
 * 주기별 Outcome를 계산하고 outcomes 테이블에 저장합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { logger } from '@/lib/utils/logger';
import { invalidateOutcomeCache } from '@/lib/utils/cache-invalidation';
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
  const startTime = Date.now();
  const actionName = 'calculateAndSaveOutcome';

  logger.action.start(actionName, {
    period_type: input.periodType,
    account_id: input.accountId,
  });

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

    logger.debug('Outcome 계산 기간', {
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      period_type: input.periodType,
    });

    // 4개 지표 각각 계산
    logger.info('HIR 계산 시작');
    const hirScore = await calculateHIR(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    logger.info('HIR 계산 완료', { hir_score: hirScore });

    logger.info('전환률 계산 시작');
    const conversionRate = await calculateConversionRate(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    logger.info('전환률 계산 완료', { conversion_rate: conversionRate });

    logger.info('필드 성장률 계산 시작');
    const fieldGrowthRate = await calculateFieldGrowth({
      userId: userUuid,
      periodStart,
      periodEnd,
      comparisonPeriod: 'previous_month',
      accountId: input.accountId,
    });
    logger.info('필드 성장률 계산 완료', { field_growth_rate: fieldGrowthRate });

    logger.info('처방 기반 성과지수 계산 시작');
    const prescriptionIndex = await calculatePrescriptionIndex(
      userUuid,
      periodStart,
      periodEnd,
      input.accountId
    );
    logger.info('처방 기반 성과지수 계산 완료', { prescription_index: prescriptionIndex });

    // Supabase에 저장
    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 삭제 (중복 방지)
    logger.db.query('DELETE FROM outcomes', {
      user_id: userUuid,
      period_type: input.periodType,
    });

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

    logger.db.query('INSERT INTO outcomes', {
      period_type: input.periodType,
      account_id: input.accountId,
    });

    const { data, error } = await supabase
      .from('outcomes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.db.error('INSERT INTO outcomes', error as Error, {
        period_type: input.periodType,
      });
      throw new Error(`Failed to save outcome: ${error.message}`);
    }

    // 관련 캐시 무효화
    try {
      await invalidateOutcomeCache(userUuid, input.accountId);
    } catch (cacheError) {
      logger.warn('캐시 무효화 실패 (무시)', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    const duration = Date.now() - startTime;
    logger.action.end(actionName, duration, {
      outcome_id: data.id,
      hir_score: Math.round(hirScore),
      conversion_rate: Math.round(conversionRate),
    });

    return data as Outcome;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

