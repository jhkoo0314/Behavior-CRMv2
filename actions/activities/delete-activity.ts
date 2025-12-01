'use server';

/**
 * Activity 삭제 Server Action
 * 
 * Activity를 삭제합니다. 본인만 삭제 가능합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';

export async function deleteActivity(activityId: string): Promise<void> {
  console.group('deleteActivity: 시작');
  console.log('삭제할 Activity ID:', activityId);

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
      .select('user_id')
      .eq('id', activityId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Activity not found');
    }

    // 권한 체크: 본인만 삭제 가능
    if (existing.user_id !== userUuid) {
      throw new Error('Forbidden: You can only delete your own activities');
    }

    // Activity 삭제
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('Activity 삭제 실패:', error);
      throw new Error(`Failed to delete activity: ${error.message}`);
    }

    console.log('Activity 삭제 성공');
    console.groupEnd();
  } catch (error) {
    console.error('deleteActivity 에러:', error);
    console.groupEnd();
    throw error;
  }
}

