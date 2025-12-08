/**
 * 역할별 접근 권한 매트릭스 및 데이터 접근 권한 체크
 * 
 * 기획안 9장 참고: 권한 구조(RLS)
 * - 영업사원: 자신의 병원/활동만 조회
 * - 팀장: 팀원 병원/활동 전체 조회
 * - 본부장: 조직 전체 조회
 */

import { UserRole, USER_ROLES } from '@/constants/user-roles';
import { getCurrentUserRole } from './check-role';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

/**
 * 역할별 데이터 접근 권한 매트릭스
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SALESPERSON]: {
    canViewOwnData: true,
    canViewTeamData: false,
    canViewAllData: false,
    canManageAccounts: true, // 자신의 계정만
    canManageTeam: false,
  },
  [USER_ROLES.MANAGER]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewAllData: false,
    canManageAccounts: true,
    canManageTeam: true,
  },
  [USER_ROLES.HEAD_MANAGER]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewAllData: true,
    canManageAccounts: true,
    canManageTeam: true,
  },
} as const;

/**
 * 현재 사용자가 특정 데이터에 접근할 수 있는지 확인합니다.
 * 
 * @param targetUserId 데이터 소유자 ID (clerk_id)
 * @returns 접근 가능하면 true, 아니면 false
 */
export async function canAccessUserData(targetUserId: string): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  // 자신의 데이터는 항상 접근 가능
  if (userId === targetUserId) {
    return true;
  }

  const currentRole = await getCurrentUserRole();

  if (!currentRole) {
    return false;
  }

  // 관리자는 팀원 데이터 접근 가능
  if (currentRole === USER_ROLES.MANAGER || currentRole === USER_ROLES.HEAD_MANAGER) {
    // TODO: team_id 기반 팀원 확인 로직 추가
    // 현재는 본부장만 모든 데이터 접근 가능
    return currentRole === USER_ROLES.HEAD_MANAGER;
  }

  return false;
}

/**
 * 현재 사용자가 특정 계정(병원)에 접근할 수 있는지 확인합니다.
 * 
 * @param accountId 계정 ID
 * @returns 접근 가능하면 true, 아니면 false
 */
export async function canAccessAccount(accountId: string): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const currentRole = await getCurrentUserRole();

  if (!currentRole) {
    return false;
  }

  // 본부장은 모든 계정 접근 가능
  if (currentRole === USER_ROLES.HEAD_MANAGER) {
    return true;
  }

  // 영업사원과 팀장은 자신이 활동한 계정만 접근 가능
  const supabase = await createClerkSupabaseClient();

  // users 테이블에서 UUID 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return false;
  }

  // activities 테이블에서 해당 계정에 대한 활동이 있는지 확인
  const { data: activity } = await supabase
    .from('activities')
    .select('id')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .limit(1)
    .single();

  // 활동이 있으면 접근 가능
  if (activity) {
    return true;
  }

  // 팀장은 팀원이 활동한 계정도 접근 가능
  if (currentRole === USER_ROLES.MANAGER) {
    // TODO: team_id 기반 팀원 확인 로직 추가
    return false;
  }

  return false;
}

/**
 * 역할별 권한 정보를 가져옵니다.
 * 
 * @param role 사용자 역할
 * @returns 권한 정보
 */
export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role];
}






