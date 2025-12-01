'use server';

/**
 * 캐시된 분석 데이터 조회 Server Action
 * 
 * cache_key로 캐시된 분석 데이터를 조회합니다.
 * 만료 시간을 체크하여 만료된 경우 null을 반환합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { AnalyticsCache } from '@/types/database.types';

export interface GetCachedAnalyticsInput {
  cacheKey: string;
}

/**
 * 캐시된 분석 데이터를 조회합니다.
 * 
 * @param input 캐시 키
 * @returns 캐시 데이터 또는 null (만료된 경우)
 */
export async function getCachedAnalytics(
  input: GetCachedAnalyticsInput
): Promise<AnalyticsCache | null> {
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

    // 캐시 조회
    const { data, error } = await supabase
      .from('analytics_cache')
      .select('*')
      .eq('cache_key', input.cacheKey)
      .eq('user_id', userUuid)
      .single();

    if (error) {
      // 캐시가 없는 경우
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('캐시 조회 실패:', error);
      throw new Error(`Failed to get cached analytics: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const cache = data as AnalyticsCache;

    // 만료 시간 체크
    const expiresAt = new Date(cache.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      console.log('캐시가 만료되었습니다:', cache.cache_key);
      // 만료된 캐시는 삭제
      await supabase
        .from('analytics_cache')
        .delete()
        .eq('id', cache.id);
      return null;
    }

    console.log('캐시 조회 성공:', cache.cache_key);
    return cache;
  } catch (error) {
    console.error('getCachedAnalytics 에러:', error);
    throw error;
  }
}

