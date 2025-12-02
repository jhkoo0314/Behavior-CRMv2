'use server';

/**
 * Next Best Action 조회 Server Action
 * 
 * 사용자별 추천 행동을 조회합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { recommendNextActions } from '@/lib/analytics/recommend-next-action';
import type { NextBestAction } from '@/lib/analytics/recommend-next-action';

export interface GetNextBestActionsInput {
  limit?: number;
}

/**
 * Next Best Action을 조회합니다.
 */
export async function getNextBestActions(
  input: GetNextBestActionsInput = {}
): Promise<NextBestAction[]> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const limit = input.limit || 5;

    return await recommendNextActions(userUuid, limit);
  } catch (error) {
    console.error('getNextBestActions 에러:', error);
    throw error;
  }
}



