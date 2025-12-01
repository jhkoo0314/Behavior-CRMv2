'use server';

/**
 * Activity 조회 Server Action
 * 
 * 사용자별 Activity를 조회합니다. 필터링 및 페이지네이션을 지원합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Activity } from '@/types/database.types';
import type { ActivityType } from '@/constants/activity-types';
import type { BehaviorType } from '@/constants/behavior-types';

export interface GetActivitiesInput {
  startDate?: Date | string;
  endDate?: Date | string;
  activity_type?: ActivityType;
  behavior_type?: BehaviorType;
  account_id?: string;
  limit?: number;
  offset?: number;
}

export async function getActivities(
  input: GetActivitiesInput = {}
): Promise<{ data: Activity[]; totalCount: number }> {
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
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('user_id', userUuid);

    // 날짜 범위 필터링
    if (input.startDate) {
      const startDateStr =
        input.startDate instanceof Date
          ? input.startDate.toISOString()
          : input.startDate;
      query = query.gte('performed_at', startDateStr);
    }
    if (input.endDate) {
      const endDateStr =
        input.endDate instanceof Date
          ? input.endDate.toISOString()
          : input.endDate;
      query = query.lte('performed_at', endDateStr);
    }

    // 활동 타입 필터링
    if (input.activity_type) {
      query = query.eq('type', input.activity_type);
    }

    // Behavior 타입 필터링
    if (input.behavior_type) {
      query = query.eq('behavior', input.behavior_type);
    }

    // 병원 필터링
    if (input.account_id) {
      query = query.eq('account_id', input.account_id);
    }

    // 정렬: performed_at DESC (기본)
    query = query.order('performed_at', { ascending: false });

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
      console.error('Activity 조회 실패:', error);
      throw new Error(`Failed to get activities: ${error.message}`);
    }

    return {
      data: (data || []) as Activity[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getActivities 에러:', error);
    throw error;
  }
}

