'use server';

/**
 * 팀원 조회 Server Action
 * 
 * 관리자(manager, head_manager)가 팀원 목록을 조회합니다.
 * manager는 team_id 기반으로, head_manager는 모든 사용자를 조회합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { requireManager } from '@/lib/auth/check-role';
import type { User } from '@/types/database.types';

export interface GetTeamMembersInput {
  limit?: number;
  offset?: number;
}

export async function getTeamMembers(
  input: GetTeamMembersInput = {}
): Promise<{ data: User[]; totalCount: number }> {
  try {
    // 관리자 권한 확인
    await requireManager();

    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const currentUserUuid = await getCurrentUserId();
    if (!currentUserUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    // 현재 사용자의 역할과 team_id 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', currentUserUuid)
      .single();

    if (currentUserError || !currentUser) {
      throw new Error('Failed to get current user');
    }

    let query = supabase.from('users').select('*', { count: 'exact' });

    // head_manager는 모든 사용자 조회
    // manager는 같은 team_id를 가진 사용자만 조회
    if (currentUser.role === 'manager' && currentUser.team_id) {
      query = query.eq('team_id', currentUser.team_id);
    }

    // 영업사원만 조회 (관리자 제외)
    query = query.eq('role', 'salesperson');

    // 정렬: 이름순
    query = query.order('name', { ascending: true });

    // 페이지네이션
    if (input.limit) {
      query = query.limit(input.limit);
    }
    if (input.offset !== undefined) {
      const end = input.offset + (input.limit || 10) - 1;
      query = query.range(input.offset, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('팀원 조회 실패:', error);
      throw new Error(`Failed to get team members: ${error.message}`);
    }

    return {
      data: (data || []) as User[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getTeamMembers 에러:', error);
    throw error;
  }
}
