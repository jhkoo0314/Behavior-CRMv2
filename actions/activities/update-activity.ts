'use server';

/**
 * Activity 수정 Server Action
 * 
 * Activity를 수정합니다. 본인만 수정 가능합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Activity } from '@/types/database.types';
import type { ActivityType } from '@/constants/activity-types';
import type { BehaviorType } from '@/constants/behavior-types';

export interface UpdateActivityInput {
  id: string;
  account_id?: string;
  contact_id?: string | null;
  // 기존 필드 (하위 호환성)
  type?: ActivityType;
  behavior?: BehaviorType;
  description?: string;
  quality_score?: number;
  quantity_score?: number;
  duration_minutes?: number;
  performed_at?: Date | string;
  // 새 필드 (Behavior-Driven Activity Form)
  outcome?: 'won' | 'ongoing' | 'lost';
  tags?: string[]; // 태그 배열
  sentiment_score?: number; // 관계 온도 (0-100)
  next_action_date?: Date | string; // 다음 활동 예정일
  dwell_time_seconds?: number; // HIR 측정용 체류 시간 (초)
}

export async function updateActivity(
  input: UpdateActivityInput
): Promise<Activity> {
  console.group('updateActivity: 시작');
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

    // 기존 데이터 조회 및 권한 체크
    const { data: existing, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', input.id)
      .single();

    if (fetchError || !existing) {
      throw new Error('Activity not found');
    }

    // 권한 체크: 본인만 수정 가능
    if (existing.user_id !== userUuid) {
      throw new Error('Forbidden: You can only update your own activities');
    }

    console.log('수정 전 데이터:', existing);

    // 업데이트할 필드만 추출
    const updateData: Record<string, unknown> = {};
    if (input.account_id !== undefined) updateData.account_id = input.account_id;
    if (input.contact_id !== undefined)
      updateData.contact_id = input.contact_id || null;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.behavior !== undefined) updateData.behavior = input.behavior;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.quality_score !== undefined)
      updateData.quality_score = input.quality_score;
    if (input.quantity_score !== undefined)
      updateData.quantity_score = input.quantity_score;
    if (input.duration_minutes !== undefined)
      updateData.duration_minutes = input.duration_minutes;
    if (input.performed_at !== undefined) {
      updateData.performed_at =
        input.performed_at instanceof Date
          ? input.performed_at.toISOString()
          : input.performed_at;
    }
    // 새 필드
    if (input.outcome !== undefined) updateData.outcome = input.outcome;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.sentiment_score !== undefined) updateData.sentiment_score = input.sentiment_score;
    if (input.next_action_date !== undefined) {
      updateData.next_action_date =
        input.next_action_date instanceof Date
          ? input.next_action_date.toISOString().split('T')[0]
          : new Date(input.next_action_date).toISOString().split('T')[0];
    }
    if (input.dwell_time_seconds !== undefined) updateData.dwell_time_seconds = input.dwell_time_seconds;

    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Activity 수정 실패:', error);
      throw new Error(`Failed to update activity: ${error.message}`);
    }

    console.log('수정 후 데이터:', data);
    console.groupEnd();
    return data as Activity;
  } catch (error) {
    console.error('updateActivity 에러:', error);
    console.groupEnd();
    throw error;
  }
}

