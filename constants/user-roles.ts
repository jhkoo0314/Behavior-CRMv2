/**
 * 사용자 역할 상수 정의
 * 기획안 2장 참고: 영업사원, 팀장/관리자, 본부 관리자
 */

export const USER_ROLES = {
  SALESPERSON: 'salesperson',
  MANAGER: 'manager',
  HEAD_MANAGER: 'head_manager',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.SALESPERSON]: '영업사원',
  [USER_ROLES.MANAGER]: '팀장/관리자',
  [USER_ROLES.HEAD_MANAGER]: '본부 관리자',
};

export const USER_ROLE_LIST = Object.values(USER_ROLES);

