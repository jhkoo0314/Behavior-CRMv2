/**
 * @file cache-invalidation.ts
 * @description 캐시 무효화 유틸리티
 *
 * Activity 생성, Outcome 계산 등 데이터 변경 시 관련 캐시를 무효화합니다.
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { logger } from './logger';

/**
 * Activity 생성 시 관련 캐시를 무효화합니다.
 */
export async function invalidateActivityCache(userId: string): Promise<void> {
  const supabase = await createClerkSupabaseClient();

  // Activity 관련 캐시 키 패턴
  const patterns = [
    'behavior-scores',
    'behavior-quality',
    'activities',
    'dashboard',
  ];

  for (const pattern of patterns) {
    const { error } = await supabase
      .from('analytics_cache')
      .delete()
      .eq('user_id', userId)
      .like('cache_key', `%${pattern}%`);

    if (error) {
      logger.warn('캐시 무효화 실패', {
        pattern,
        error: error.message,
      });
    } else {
      logger.debug('캐시 무효화 완료', { pattern });
    }
  }
}

/**
 * Outcome 계산 시 관련 캐시를 무효화합니다.
 */
export async function invalidateOutcomeCache(
  userId: string,
  accountId?: string
): Promise<void> {
  const supabase = await createClerkSupabaseClient();

  // Outcome 관련 캐시 키 패턴
  const patterns = [
    'outcomes',
    'hir',
    'conversion-rate',
    'field-growth',
    'prescription-index',
    'dashboard',
    'analysis',
  ];

  for (const pattern of patterns) {
    let query = supabase
      .from('analytics_cache')
      .delete()
      .eq('user_id', userId)
      .like('cache_key', `%${pattern}%`);

    // accountId가 있으면 해당 계정 관련 캐시만 무효화
    if (accountId) {
      query = query.like('cache_key', `%account:${accountId}%`);
    }

    const { error } = await query;

    if (error) {
      logger.warn('캐시 무효화 실패', {
        pattern,
        error: error.message,
      });
    } else {
      logger.debug('캐시 무효화 완료', { pattern, account_id: accountId });
    }
  }
}

/**
 * 모든 사용자 캐시를 무효화합니다 (관리자용).
 */
export async function invalidateAllUserCache(userId: string): Promise<void> {
  const supabase = await createClerkSupabaseClient();

  const { error } = await supabase
    .from('analytics_cache')
    .delete()
    .eq('user_id', userId);

  if (error) {
    logger.error('전체 캐시 무효화 실패', error as Error, { user_id: userId });
    throw error;
  }

  logger.info('전체 캐시 무효화 완료', { user_id: userId });
}

