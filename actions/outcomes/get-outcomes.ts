'use server';

/**
 * Outcome 조회 Server Action
 * 
 * 사용자별 Outcome를 조회합니다. 기간별, 병원별, 기간 타입별 필터링을 지원합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Outcome } from '@/types/database.types';
import type { PeriodType } from '@/types/outcome.types';

export interface GetOutcomesInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
  periodType?: PeriodType;
  accountId?: string;
  limit?: number;
  offset?: number;
}

export async function getOutcomes(
  input: GetOutcomesInput = {}
): Promise<{ data: Outcome[]; totalCount: number }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('outcomes')
      .select('*', { count: 'exact' })
      .eq('user_id', userUuid);

    // 기간 필터링
    if (input.periodStart) {
      const periodStartStr =
        input.periodStart instanceof Date
          ? input.periodStart.toISOString()
          : input.periodStart;
      query = query.gte('period_start', periodStartStr);
    }
    if (input.periodEnd) {
      const periodEndStr =
        input.periodEnd instanceof Date
          ? input.periodEnd.toISOString()
          : input.periodEnd;
      query = query.lte('period_end', periodEndStr);
    }

    // 기간 타입 필터링
    if (input.periodType) {
      query = query.eq('period_type', input.periodType);
    }

    // 병원 필터링
    if (input.accountId !== undefined) {
      if (input.accountId === null) {
        query = query.is('account_id', null);
      } else {
        query = query.eq('account_id', input.accountId);
      }
    }

    // 정렬: period_start DESC (기본)
    query = query.order('period_start', { ascending: false });

    // 페이지네이션
    if (input.limit) {
      query = query.limit(input.limit);
    }
    if (input.offset !== undefined) {
      const end = input.offset + (input.limit || 10) - 1;
      query = query.range(input.offset, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Outcome 조회 실패:', error);
      throw new Error(`Failed to get outcomes: ${error.message}`);
    }

    return {
      data: (data || []) as Outcome[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getOutcomes 에러:', error);
    throw error;
  }
}

