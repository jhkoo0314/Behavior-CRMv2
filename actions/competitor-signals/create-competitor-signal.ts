'use server';

/**
 * 경쟁사 신호 수동 입력 Server Action
 * 
 * 영업사원이 현장에서 직접 경쟁사 신호를 입력합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { CompetitorSignal } from '@/types/database.types';

export interface CreateCompetitorSignalInput {
  account_id: string;
  contact_id?: string | null;
  competitor_name: string;
  type: string;
  description: string;
  detected_at?: Date | string;
}

export async function createCompetitorSignal(
  input: CreateCompetitorSignalInput
): Promise<CompetitorSignal> {
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

    const detectedAt =
      input.detected_at instanceof Date
        ? input.detected_at.toISOString()
        : input.detected_at || new Date().toISOString();

    const { data, error } = await supabase
      .from('competitor_signals')
      .insert({
        account_id: input.account_id,
        contact_id: input.contact_id || null,
        competitor_name: input.competitor_name,
        type: input.type,
        description: input.description,
        detected_at: detectedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Competitor Signal 생성 실패:', error);
      throw new Error(`Failed to create competitor signal: ${error.message}`);
    }

    console.log('Competitor Signal 생성 완료:', data);
    return data as CompetitorSignal;
  } catch (error) {
    console.error('createCompetitorSignal 에러:', error);
    throw error;
  }
}

