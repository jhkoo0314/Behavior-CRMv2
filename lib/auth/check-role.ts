/**
 * 사용자 역할 확인 및 권한 체크 유틸리티
 * 
 * Clerk 인증과 Supabase users 테이블의 role 컬럼을 연동하여
 * 역할 기반 접근 제어를 제공합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { UserRole, USER_ROLES } from '@/constants/user-roles';

/**
 * 현재 사용자의 역할을 조회합니다.
 * 
 * @returns 사용자 역할 또는 null (인증되지 않은 경우)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const supabase = await createClerkSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (error || !user) {
      console.error('Failed to get user role:', error);
      return null;
    }

    return user.role as UserRole;
  } catch (error) {
    console.error('Error in getCurrentUserRole:', error);
    return null;
  }
}

/**
 * 현재 사용자가 특정 역할을 가지고 있는지 확인합니다.
 * 
 * @param role 확인할 역할
 * @returns 역할을 가지고 있으면 true, 아니면 false
 */
export async function checkRole(role: UserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole();
  return currentRole === role;
}

/**
 * 현재 사용자가 특정 역할 중 하나를 가지고 있는지 확인합니다.
 * 
 * @param roles 확인할 역할 배열
 * @returns 역할 중 하나를 가지고 있으면 true, 아니면 false
 */
export async function checkAnyRole(roles: UserRole[]): Promise<boolean> {
  const currentRole = await getCurrentUserRole();
  return currentRole !== null && roles.includes(currentRole);
}

/**
 * 현재 사용자가 특정 역할을 가지고 있어야 합니다.
 * 역할이 없으면 에러를 throw합니다.
 * 
 * @param role 필수 역할
 * @throws Error 역할이 없거나 인증되지 않은 경우
 */
export async function requireRole(role: UserRole): Promise<void> {
  const currentRole = await getCurrentUserRole();

  if (!currentRole) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (currentRole !== role) {
    throw new Error(`Forbidden: Required role is ${role}, but user has ${currentRole}`);
  }
}

/**
 * 현재 사용자가 특정 역할 중 하나를 가지고 있어야 합니다.
 * 역할이 없으면 에러를 throw합니다.
 * 
 * @param roles 필수 역할 배열
 * @throws Error 역할이 없거나 인증되지 않은 경우
 */
export async function requireAnyRole(roles: UserRole[]): Promise<void> {
  const currentRole = await getCurrentUserRole();

  if (!currentRole) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!roles.includes(currentRole)) {
    throw new Error(
      `Forbidden: Required one of roles [${roles.join(', ')}], but user has ${currentRole}`
    );
  }
}

/**
 * 관리자 역할인지 확인합니다 (manager 또는 head_manager).
 * 
 * @returns 관리자이면 true, 아니면 false
 */
export async function isManager(): Promise<boolean> {
  return checkAnyRole([USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER]);
}

/**
 * 관리자 역할이어야 합니다.
 * 
 * @throws Error 관리자가 아닌 경우
 */
export async function requireManager(): Promise<void> {
  return requireAnyRole([USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER]);
}






