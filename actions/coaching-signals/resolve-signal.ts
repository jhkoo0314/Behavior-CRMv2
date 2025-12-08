'use server';

/**
 * 코칭 신호 해결 처리 Server Action
 * 
 * 코칭 신호를 해결 처리합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { CoachingSignal } from '@/types/database.types';

export interface ResolveCoachingSignalInput {
  signalId: string;
  resolved?: boolean; // true: 해결, false: 미해결로 되돌리기
}

/**
 * 코칭 신호를 해결 처리합니다.
 */
export async function resolveCoachingSignal(
  input: ResolveCoachingSignalInput
): Promise<CoachingSignal> {
  console.group('resolveCoachingSignal: 시작');
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

    // 신호 조회 및 권한 확인
    const { data: signal, error: fetchError } = await supabase
      .from('coaching_signals')
      .select('*')
      .eq('id', input.signalId)
      .single();

    if (fetchError || !signal) {
      throw new Error('Signal not found');
    }

    // 본인의 신호만 해결 가능
    if (signal.user_id !== userUuid) {
      throw new Error('Unauthorized: Can only resolve own signals');
    }

    const resolved = input.resolved !== undefined ? input.resolved : true;

    // 신호 해결 처리
    const { data, error } = await supabase
      .from('coaching_signals')
      .update({
        is_resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.signalId)
      .select()
      .single();

    if (error) {
      console.error('코칭 신호 해결 처리 실패:', error);
      throw new Error(`Failed to resolve signal: ${error.message}`);
    }

    console.log('코칭 신호 해결 처리 완료:', data);
    console.groupEnd();

    return data as CoachingSignal;
  } catch (error) {
    console.error('resolveCoachingSignal 에러:', error);
    console.groupEnd();
    throw error;
  }
}






