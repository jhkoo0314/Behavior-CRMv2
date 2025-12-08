/**
 * Activity 타입 상수 정의
 * 활동 타입: 방문, 전화, 메시지, 프레젠테이션, 후속 관리
 */

export const ACTIVITY_TYPES = {
  VISIT: 'visit',
  CALL: 'call',
  MESSAGE: 'message',
  PRESENTATION: 'presentation',
  FOLLOW_UP: 'follow_up',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.VISIT]: '방문',
  [ACTIVITY_TYPES.CALL]: '전화',
  [ACTIVITY_TYPES.MESSAGE]: '메시지',
  [ACTIVITY_TYPES.PRESENTATION]: '프레젠테이션',
  [ACTIVITY_TYPES.FOLLOW_UP]: '후속 관리',
};

export const ACTIVITY_TYPE_LIST = Object.values(ACTIVITY_TYPES);






