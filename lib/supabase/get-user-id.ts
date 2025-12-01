/**
 * Supabase 클라이언트 헬퍼
 * 
 * Clerk clerk_id로 users 테이블에서 UUID id를 조회합니다.
 * 캐싱을 고려하여 구현합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from './server';

// 간단한 메모리 캐시 (서버 컴포넌트에서만 사용)
const userCache = new Map<string, { id: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * 현재 사용자의 Supabase UUID를 조회합니다.
 * 
 * @returns users 테이블의 UUID id 또는 null
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // 캐시 확인
    const cached = userCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.id;
    }

    // Supabase에서 조회
    const supabase = await createClerkSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (error || !user) {
      console.error('Failed to get user ID:', error);
      return null;
    }

    // 캐시에 저장
    userCache.set(userId, {
      id: user.id,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return user.id;
  } catch (error) {
    console.error('Error in getCurrentUserId:', error);
    return null;
  }
}

/**
 * 특정 clerk_id로 users 테이블의 UUID를 조회합니다.
 * 
 * @param clerkId Clerk 사용자 ID
 * @returns users 테이블의 UUID id 또는 null
 */
export async function getUserIdByClerkId(clerkId: string): Promise<string | null> {
  try {
    // 캐시 확인
    const cached = userCache.get(clerkId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.id;
    }

    // Supabase에서 조회 (service role 사용 - 다른 사용자 조회 가능)
    const { getServiceRoleClient } = await import('./service-role');
    const supabase = getServiceRoleClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      console.error('Failed to get user ID by clerk_id:', error);
      return null;
    }

    // 캐시에 저장
    userCache.set(clerkId, {
      id: user.id,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return user.id;
  } catch (error) {
    console.error('Error in getUserIdByClerkId:', error);
    return null;
  }
}

