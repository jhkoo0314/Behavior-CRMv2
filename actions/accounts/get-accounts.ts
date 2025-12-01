'use server';

/**
 * Account 조회 Server Action
 * 
 * 병원 목록을 조회합니다. 검색 및 필터링을 지원합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Account } from '@/types/database.types';

export interface GetAccountsInput {
  search?: string; // name, address로 검색
  type?: 'general_hospital' | 'hospital' | 'clinic' | 'pharmacy';
  limit?: number;
  offset?: number;
}

export async function getAccounts(
  input: GetAccountsInput = {}
): Promise<{ data: Account[]; totalCount: number }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase.from('accounts').select('*', { count: 'exact' });

    // 검색 (name 또는 address에 LIKE 검색)
    if (input.search) {
      query = query.or(`name.ilike.%${input.search}%,address.ilike.%${input.search}%`);
    }

    // 타입 필터링
    if (input.type) {
      query = query.eq('type', input.type);
    }

    // 정렬: 이름순
    query = query.order('name', { ascending: true });

    // 페이지네이션
    if (input.limit) {
      query = query.limit(input.limit);
    }
    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Account 조회 실패:', error);
      throw new Error(`Failed to get accounts: ${error.message}`);
    }

    return {
      data: (data || []) as Account[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getAccounts 에러:', error);
    throw error;
  }
}

