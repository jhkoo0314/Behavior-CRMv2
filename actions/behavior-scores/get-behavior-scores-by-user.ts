'use server';

/**
 * 특정 사용자의 Behavior Score 조회 Server Action
 * 
 * 관리자가 팀원의 Behavior Score를 조회할 때 사용합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { requireManager } from '@/lib/auth/check-role';
import type { BehaviorScore } from '@/types/database.types';
import type { BehaviorType } from '@/constants/behavior-types';

export interface GetBehaviorScoresByUserInput {
  userId: string; // UUID
  periodStart?: Date | string;
  periodEnd?: Date | string;
  behaviorType?: BehaviorType;
}

export async function getBehaviorScoresByUser(
  input: GetBehaviorScoresByUserInput
): Promise<BehaviorScore[]> {
  try {
    // 관리자 권한 확인
    await requireManager();

    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('behavior_scores')
      .select('*')
      .eq('user_id', input.userId);

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

    // Behavior 타입 필터링
    if (input.behaviorType) {
      query = query.eq('behavior', input.behaviorType);
    }

    // 정렬: period_start DESC
    query = query.order('period_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Behavior Score 조회 실패:', error);
      throw new Error(`Failed to get behavior scores: ${error.message}`);
    }

    return (data || []) as BehaviorScore[];
  } catch (error) {
    console.error('getBehaviorScoresByUser 에러:', error);
    throw error;
  }
}

