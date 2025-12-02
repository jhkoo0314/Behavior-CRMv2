'use server';

/**
 * Activity 통계 데이터 조회 Server Action
 * 
 * 이번 주 활동 수, 평균 HIR, 재방문 요망 수를 조회합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { getActivities } from './get-activities';
import { getBehaviorMetrics } from '@/actions/analytics/get-behavior-metrics';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export interface ActivityStats {
  weeklyActivityCount: number;
  averageHIR: number;
  revisitNeededCount: number;
}

/**
 * Activity 통계 데이터를 조회합니다.
 */
export async function getActivityStats(): Promise<ActivityStats> {
  console.group('getActivityStats: 시작');

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    // 이번 주 기간 계산 (월요일 ~ 일요일)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (일요일) ~ 6 (토요일)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 이동
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log('이번 주 기간:', weekStart, '~', weekEnd);

    // 병렬로 데이터 조회
    const [activitiesResult, behaviorMetrics] = await Promise.all([
      getActivities({
        startDate: weekStart,
        endDate: weekEnd,
      }),
      getBehaviorMetrics({
        periodStart: weekStart,
        periodEnd: weekEnd,
      }),
    ]);

    // 재방문 요망 수 계산: next_action_date가 지난 활동 수
    const supabase = await createClerkSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: revisitActivities, error: revisitError } = await supabase
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('user_id', userUuid)
      .not('next_action_date', 'is', null)
      .lt('next_action_date', today.toISOString().split('T')[0]);

    if (revisitError) {
      console.error('재방문 요망 활동 조회 실패:', revisitError);
      throw new Error(`Failed to get revisit activities: ${revisitError.message}`);
    }

    const stats: ActivityStats = {
      weeklyActivityCount: activitiesResult.totalCount,
      averageHIR: behaviorMetrics.hir,
      revisitNeededCount: revisitActivities?.length || 0,
    };

    console.log('통계 데이터:', stats);
    console.groupEnd();

    return stats;
  } catch (error) {
    console.error('getActivityStats 에러:', error);
    console.groupEnd();
    throw error;
  }
}

