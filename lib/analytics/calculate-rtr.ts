/**
 * RTR (Relationship Temperature Rate) 계산 함수
 * 
 * Activity의 sentiment_score를 기반으로 관계 온도를 계산합니다.
 * 
 * 알고리즘:
 * - 최근 30일 Activity의 sentiment_score 평균
 * - sentiment_score가 null인 경우 제외
 * - 0-100 스케일로 정규화
 */

'use server';

import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { getActivities } from '@/actions/activities/get-activities';

/**
 * RTR (Relationship Temperature Rate)를 계산합니다.
 * 
 * @param userId 사용자 UUID (선택사항, 없으면 현재 사용자)
 * @param periodStart 기간 시작일 (선택사항, 기본값: 30일 전)
 * @param periodEnd 기간 종료일 (선택사항, 기본값: 오늘)
 * @returns RTR 점수 (0-100)
 */
export async function calculateRTR(
  userId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<number> {
  console.group('calculateRTR: 시작');
  
  try {
    // 사용자 ID 확인
    let userUuid = userId;
    if (!userUuid) {
      userUuid = await getCurrentUserId();
      if (!userUuid) {
        console.log('사용자 ID를 찾을 수 없어 RTR을 0으로 반환');
        console.groupEnd();
        return 0;
      }
    }

    // 기간 설정 (기본값: 최근 30일)
    const endDate = periodEnd || new Date();
    const startDate = periodStart || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('사용자 ID:', userUuid);
    console.log('기간:', startDate, '~', endDate);

    // Activity 조회
    const { data: activities } = await getActivities({
      startDate,
      endDate,
    });

    console.log('조회된 Activity 수:', activities.length);

    if (activities.length === 0) {
      console.log('Activity가 없어 RTR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // sentiment_score가 있는 Activity만 필터링
    const activitiesWithSentiment = activities.filter(
      (act) => act.sentiment_score !== null && act.sentiment_score !== undefined
    );

    console.log('sentiment_score가 있는 Activity 수:', activitiesWithSentiment.length);

    if (activitiesWithSentiment.length === 0) {
      console.log('sentiment_score가 있는 Activity가 없어 RTR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 평균 계산
    const sum = activitiesWithSentiment.reduce(
      (acc, act) => acc + (act.sentiment_score || 0),
      0
    );
    const avgSentiment = sum / activitiesWithSentiment.length;

    // 0-100 스케일로 정규화 (이미 0-100 범위이므로 그대로 사용)
    const rtrScore = Math.round(Math.min(100, Math.max(0, avgSentiment)));

    console.log('평균 sentiment_score:', avgSentiment);
    console.log('RTR 점수:', rtrScore);
    console.groupEnd();

    return rtrScore;
  } catch (error) {
    console.error('calculateRTR 에러:', error);
    console.groupEnd();
    throw error;
  }
}

