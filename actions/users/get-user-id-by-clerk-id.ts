'use server';

/**
 * Clerk ID로 User UUID 조회 Server Action
 * 
 * 클라이언트 컴포넌트에서 사용할 수 있는 Server Action입니다.
 * 특정 clerk_id로 users 테이블의 UUID를 조회합니다.
 */

import { getUserIdByClerkId as getUserIdByClerkIdInternal } from '@/lib/supabase/get-user-id';

export interface GetUserIdByClerkIdInput {
  clerkId: string;
}

export async function getUserIdByClerkId(
  input: GetUserIdByClerkIdInput
): Promise<{ data: string | null; error: string | null }> {
  try {
    const userId = await getUserIdByClerkIdInternal(input.clerkId);
    return {
      data: userId,
      error: null,
    };
  } catch (error) {
    console.error('getUserIdByClerkId 에러:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get user ID',
    };
  }
}

