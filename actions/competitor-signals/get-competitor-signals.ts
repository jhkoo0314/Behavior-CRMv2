'use server';

/**
 * 경쟁사 신호 조회 Server Action
 * 
 * 경쟁사 활동 신호를 조회합니다.
 * 
 * 시연용: 모든 사용자가 접근 가능합니다.
 * 프로덕션 전환 시 requireManager() 호출을 다시 활성화해야 합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
// import { requireManager } from '@/lib/auth/check-role'; // 시연용: 주석 처리
import type { CompetitorSignal } from '@/types/database.types';

export interface GetCompetitorSignalsInput {
  accountId?: string;
  competitorName?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}

export async function getCompetitorSignals(
  input: GetCompetitorSignalsInput = {}
): Promise<{ data: CompetitorSignal[]; totalCount: number }> {
  try {
    // 시연용: 관리자 권한 확인 비활성화
    // 프로덕션 전환 시 아래 주석을 해제하세요:
    // await requireManager();

    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('competitor_signals')
      .select('*', { count: 'exact' });

    // 병원 필터링
    if (input.accountId) {
      query = query.eq('account_id', input.accountId);
    }

    // 경쟁사 이름 필터링
    if (input.competitorName) {
      query = query.ilike('competitor_name', `%${input.competitorName}%`);
    }

    // 날짜 범위 필터링
    if (input.startDate) {
      const startDateStr =
        input.startDate instanceof Date
          ? input.startDate.toISOString()
          : input.startDate;
      query = query.gte('detected_at', startDateStr);
    }
    if (input.endDate) {
      const endDateStr =
        input.endDate instanceof Date
          ? input.endDate.toISOString()
          : input.endDate;
      query = query.lte('detected_at', endDateStr);
    }

    // 정렬: 탐지일시 최신 순
    query = query.order('detected_at', { ascending: false });

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
      console.error('Competitor Signals 조회 실패:', error);
      throw new Error(`Failed to get competitor signals: ${error.message}`);
    }

    return {
      data: (data || []) as CompetitorSignal[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getCompetitorSignals 에러:', error);
    throw error;
  }
}



