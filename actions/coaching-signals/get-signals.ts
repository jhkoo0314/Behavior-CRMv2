'use server';

/**
 * Coaching Signals 조회 Server Action
 * 
 * 사용자별 또는 팀 전체의 코칭 신호를 조회합니다.
 * 스프린트 5에서 신호 생성 로직이 구현되면 실제 데이터를 사용합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { requireManager } from '@/lib/auth/check-role';
import type { CoachingSignal } from '@/types/database.types';

export interface GetCoachingSignalsInput {
  userId?: string; // 특정 사용자만 조회 (없으면 팀 전체)
  priority?: 'high' | 'medium' | 'low';
  isResolved?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCoachingSignals(
  input: GetCoachingSignalsInput = {}
): Promise<{ data: CoachingSignal[]; totalCount: number }> {
  try {
    // 관리자 권한 확인
    await requireManager();

    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('coaching_signals')
      .select('*', { count: 'exact' });

    // 사용자 필터링
    if (input.userId) {
      const userUuid = await getCurrentUserId();
      // TODO: input.userId를 UUID로 변환 필요
      query = query.eq('user_id', input.userId);
    }

    // 우선순위 필터링
    if (input.priority) {
      query = query.eq('priority', input.priority);
    }

    // 해결 여부 필터링
    if (input.isResolved !== undefined) {
      query = query.eq('is_resolved', input.isResolved);
    }

    // 정렬: 우선순위 높은 순, 생성일 최신 순
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

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
      console.error('Coaching Signals 조회 실패:', error);
      throw new Error(`Failed to get coaching signals: ${error.message}`);
    }

    return {
      data: (data || []) as CoachingSignal[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getCoachingSignals 에러:', error);
    throw error;
  }
}

