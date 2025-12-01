'use server';

/**
 * Activity 생성 Server Action
 * 
 * 영업사원의 행동 데이터를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Activity } from '@/types/database.types';
import type { ActivityType } from '@/constants/activity-types';
import type { BehaviorType } from '@/constants/behavior-types';

export interface CreateActivityInput {
  account_id: string;
  contact_id?: string | null;
  type: ActivityType;
  behavior: BehaviorType;
  description: string;
  quality_score: number; // 0-100
  quantity_score: number; // 0-100
  duration_minutes?: number;
  performed_at?: Date | string;
}

export async function createActivity(
  input: CreateActivityInput
): Promise<Activity> {
  console.group('createActivity: 시작');
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

    const supabase = await createClerkSupabaseClient();

    // Activity 생성
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userUuid,
        account_id: input.account_id,
        contact_id: input.contact_id || null,
        type: input.type,
        behavior: input.behavior,
        description: input.description,
        quality_score: input.quality_score,
        quantity_score: input.quantity_score,
        duration_minutes: input.duration_minutes || 0,
        performed_at: input.performed_at
          ? new Date(input.performed_at).toISOString()
          : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Activity 생성 실패:', error);
      throw new Error(`Failed to create activity: ${error.message}`);
    }

    console.log('Activity 생성 성공:', data);
    console.groupEnd();
    return data as Activity;
  } catch (error) {
    console.error('createActivity 에러:', error);
    console.groupEnd();
    throw error;
  }
}

