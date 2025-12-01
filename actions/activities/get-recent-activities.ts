'use server';

/**
 * 최근 활동 조회 Server Action
 * 
 * 특정 병원의 최근 30일 활동만 조회합니다.
 * Prescription Form에서 관련 활동 선택 시 사용됩니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Activity } from '@/types/database.types';

export interface GetRecentActivitiesInput {
  account_id: string;
  limit?: number;
}

export async function getRecentActivities(
  input: GetRecentActivitiesInput
): Promise<Activity[]> {
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

    // 최근 30일 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userUuid)
      .eq('account_id', input.account_id)
      .gte('performed_at', thirtyDaysAgo.toISOString())
      .order('performed_at', { ascending: false });

    if (input.limit) {
      query = query.limit(input.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('최근 활동 조회 실패:', error);
      throw new Error(`Failed to get recent activities: ${error.message}`);
    }

    return (data || []) as Activity[];
  } catch (error) {
    console.error('getRecentActivities 에러:', error);
    throw error;
  }
}

