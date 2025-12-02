/**
 * 최근 방문일 계산 유틸리티 함수
 * 
 * activities 테이블에서 account별 최근 방문일을 조회합니다.
 */

'use server';

import { getActivities } from '@/actions/activities/get-activities';

/**
 * 특정 Account의 최근 방문일을 조회합니다.
 * 
 * @param accountId Account UUID
 * @param userId 사용자 UUID (선택사항, 없으면 현재 사용자)
 * @returns 최근 방문일 (ISO string) 또는 null (방문 기록이 없는 경우)
 */
export async function getLastVisitDate(
  accountId: string,
  userId?: string
): Promise<string | null> {
  console.group('getLastVisitDate: 시작');
  console.log('Account ID:', accountId);
  
  try {
    // 최근 방문 활동 조회 (최대 1개)
    const { data: activities } = await getActivities({
      accountId,
      limit: 1,
    });

    if (activities.length === 0) {
      console.log('방문 기록이 없음');
      console.groupEnd();
      return null;
    }

    const lastVisitDate = activities[0].performed_at;
    console.log('최근 방문일:', lastVisitDate);
    console.groupEnd();

    return lastVisitDate;
  } catch (error) {
    console.error('getLastVisitDate 에러:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 최근 방문일로부터 경과 일수를 계산합니다.
 * 
 * @param lastVisitDate 최근 방문일 (ISO string) 또는 null
 * @returns 경과 일수 또는 null (방문 기록이 없는 경우)
 */
export function getDaysSinceLastVisit(lastVisitDate: string | null): number | null {
  if (!lastVisitDate) return null;

  const lastVisit = new Date(lastVisitDate);
  const now = new Date();
  const diffTime = now.getTime() - lastVisit.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

