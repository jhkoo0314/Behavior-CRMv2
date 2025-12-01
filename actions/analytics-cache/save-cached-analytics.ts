'use server';

/**
 * 분석 데이터 캐싱 Server Action
 * 
 * 계산된 분석 데이터를 캐싱합니다.
 * cache_key를 생성하고 JSONB 형식으로 저장하며 TTL을 설정합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { logger } from '@/lib/utils/logger';
import type { AnalyticsCache } from '@/types/database.types';

export interface SaveCachedAnalyticsInput {
  cacheKey: string;
  data: Record<string, unknown>;
  periodStart?: Date | string;
  periodEnd?: Date | string;
  ttlHours?: number; // TTL (기본 1시간)
}

/**
 * 분석 데이터를 캐싱합니다.
 * 
 * @param input 캐시 데이터
 * @returns 저장된 캐시 데이터
 */
export async function saveCachedAnalytics(
  input: SaveCachedAnalyticsInput
): Promise<AnalyticsCache> {
  console.group('saveCachedAnalytics: 시작');
  console.log('캐시 키:', input.cacheKey);

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

    // TTL 계산 (캐시 타입에 따라 다르게 설정)
    // 실시간 데이터: 5분, 일별 집계: 1시간, 주별/월별 집계: 24시간
    let defaultTtlHours = 1; // 기본값: 1시간
    if (input.cacheKey.includes('realtime') || input.cacheKey.includes('dashboard')) {
      defaultTtlHours = 5 / 60; // 5분
    } else if (input.cacheKey.includes('daily') || input.cacheKey.includes('day')) {
      defaultTtlHours = 1; // 1시간
    } else if (input.cacheKey.includes('weekly') || input.cacheKey.includes('monthly')) {
      defaultTtlHours = 24; // 24시간
    }

    const ttlHours = input.ttlHours || defaultTtlHours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    logger.debug('캐시 TTL 설정', {
      cache_key: input.cacheKey,
      ttl_hours: ttlHours,
      expires_at: expiresAt.toISOString(),
    });

    // 기존 캐시 삭제 (같은 키가 있으면)
    await supabase
      .from('analytics_cache')
      .delete()
      .eq('cache_key', input.cacheKey)
      .eq('user_id', userUuid);

    // 새 캐시 저장
    const insertData = {
      user_id: userUuid,
      cache_key: input.cacheKey,
      data: input.data,
      period_start: input.periodStart
        ? typeof input.periodStart === 'string'
          ? input.periodStart
          : input.periodStart.toISOString()
        : null,
      period_end: input.periodEnd
        ? typeof input.periodEnd === 'string'
          ? input.periodEnd
          : input.periodEnd.toISOString()
        : null,
      expires_at: expiresAt.toISOString(),
    };

    logger.db.query('INSERT INTO analytics_cache', {
      cache_key: insertData.cache_key,
    });

    const { data, error } = await supabase
      .from('analytics_cache')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.db.error('INSERT INTO analytics_cache', error as Error, {
        cache_key: input.cacheKey,
      });
      throw new Error(`Failed to save cached analytics: ${error.message}`);
    }

    logger.info('캐시 저장 성공', {
      cache_key: input.cacheKey,
      expires_at: expiresAt.toISOString(),
    });

    return data as AnalyticsCache;
  } catch (error) {
    console.error('saveCachedAnalytics 에러:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 캐시 키를 생성합니다.
 * 
 * @param prefix 접두사
 * @param userId 사용자 ID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @param additionalParams 추가 파라미터
 * @returns 캐시 키
 */
export function generateCacheKey(
  prefix: string,
  userId: string,
  periodStart: Date | string,
  periodEnd: Date | string,
  additionalParams?: Record<string, string | number>
): string {
  const startStr =
    periodStart instanceof Date
      ? periodStart.toISOString()
      : periodStart;
  const endStr =
    periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd;

  let key = `${prefix}-${userId}-${startStr}-${endStr}`;

  if (additionalParams) {
    const paramsStr = Object.entries(additionalParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('-');
    key = `${key}-${paramsStr}`;
  }

  return key;
}

