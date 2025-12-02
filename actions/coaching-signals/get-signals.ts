'use server';

/**
 * Coaching Signals 조회 Server Action
 * 
 * 사용자별 또는 팀 전체의 코칭 신호를 조회합니다.
 * - 일반 사용자: 자신의 신호만 조회 가능
 * - 관리자: 팀 전체 신호 조회 가능
 * 
 * 시연용: 모든 사용자가 팀 전체 신호를 조회할 수 있습니다.
 * 프로덕션 전환 시 역할 체크를 다시 활성화해야 합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
// import { checkAnyRole } from '@/lib/auth/check-role'; // 시연용: 주석 처리
// import { USER_ROLES } from '@/constants/user-roles'; // 시연용: 주석 처리
import type { CoachingSignal } from '@/types/database.types';

export interface GetCoachingSignalsInput {
  userId?: string; // 특정 사용자만 조회 (관리자만 사용 가능)
  priority?: 'high' | 'medium' | 'low';
  isResolved?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCoachingSignals(
  input: GetCoachingSignalsInput = {}
): Promise<{ data: CoachingSignal[]; totalCount: number }> {
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
    // 시연용: 역할 체크 비활성화 - 모든 사용자가 관리자처럼 동작
    // 프로덕션 전환 시 아래 주석을 해제하세요:
    // const isManager = await checkAnyRole([USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER]);
    const isManager = true; // 시연용: 항상 true로 설정

    let query = supabase
      .from('coaching_signals')
      .select('*', { count: 'exact' });

    // 사용자 필터링
    if (input.userId) {
      // 시연용: 모든 사용자가 다른 사용자의 신호 조회 가능
      // 프로덕션 전환 시 아래 주석을 해제하세요:
      // if (!isManager) {
      //   throw new Error('Only managers can view other users\' signals');
      // }
      query = query.eq('user_id', input.userId);
    } else {
      // 시연용: 모든 사용자가 팀 전체 조회 가능
      // 프로덕션 전환 시 아래 주석을 해제하세요:
      // if (!isManager) {
      //   query = query.eq('user_id', userUuid);
      // }
      // 관리자는 팀 전체 조회 (필터 없음)
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

