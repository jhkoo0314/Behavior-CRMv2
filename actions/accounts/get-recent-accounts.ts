'use server';

/**
 * 최근 방문 병원 조회 Server Action
 * 
 * 사용자별 최근 30일 활동 기준으로 방문한 병원 목록을 조회합니다.
 * Combobox에서 최근 방문 병원을 상단에 노출하기 위해 사용됩니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Account } from '@/types/database.types';

export async function getRecentAccounts(): Promise<Account[]> {
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

    // 최근 30일 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 최근 30일 활동에서 병원 ID 추출 (중복 제거)
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('account_id')
      .eq('user_id', userUuid)
      .gte('performed_at', thirtyDaysAgo.toISOString())
      .order('performed_at', { ascending: false })
      .limit(100); // 최대 100개 활동 조회

    if (activitiesError) {
      console.error('최근 활동 조회 실패:', activitiesError);
      throw new Error(`Failed to get recent activities: ${activitiesError.message}`);
    }

    if (!activities || activities.length === 0) {
      return [];
    }

    // 중복 제거된 병원 ID 목록
    const uniqueAccountIds = Array.from(
      new Set(activities.map((act) => act.account_id).filter(Boolean))
    );

    if (uniqueAccountIds.length === 0) {
      return [];
    }

    // 병원 정보 조회
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .in('id', uniqueAccountIds);

    if (accountsError) {
      console.error('병원 정보 조회 실패:', accountsError);
      throw new Error(`Failed to get accounts: ${accountsError.message}`);
    }

    // 활동 순서대로 정렬 (최근 방문한 병원이 먼저)
    const accountMap = new Map(
      (accounts || []).map((acc) => [acc.id, acc])
    );

    const sortedAccounts = uniqueAccountIds
      .map((id) => accountMap.get(id))
      .filter((acc): acc is Account => acc !== undefined);

    return sortedAccounts as Account[];
  } catch (error) {
    console.error('getRecentAccounts 에러:', error);
    throw error;
  }
}

