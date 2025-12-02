/**
 * PHR (Proactive Health Rate) 계산 함수
 * 
 * Activity의 next_action_date를 기반으로 선제적 관리 점수를 계산합니다.
 * 
 * 알고리즘:
 * - 최근 30일 Activity의 next_action_date 설정 비율
 * - next_action_date가 지난 경우 (Dead Lead) 감점
 * - next_action_date가 적절히 설정된 경우 가점
 * - 0-100 스케일로 정규화
 */

'use server';

import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { getActivities } from '@/actions/activities/get-activities';

/**
 * PHR (Proactive Health Rate)를 계산합니다.
 * 
 * @param userId 사용자 UUID (선택사항, 없으면 현재 사용자)
 * @param periodStart 기간 시작일 (선택사항, 기본값: 30일 전)
 * @param periodEnd 기간 종료일 (선택사항, 기본값: 오늘)
 * @returns PHR 점수 (0-100)
 */
export async function calculatePHR(
  userId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<number> {
  console.group('calculatePHR: 시작');
  
  try {
    // 사용자 ID 확인
    let userUuid = userId;
    if (!userUuid) {
      userUuid = await getCurrentUserId();
      if (!userUuid) {
        console.log('사용자 ID를 찾을 수 없어 PHR을 0으로 반환');
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
      console.log('Activity가 없어 PHR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    const now = new Date();
    let totalScore = 0;
    let validActivities = 0;

    for (const activity of activities) {
      if (!activity.next_action_date) {
        // next_action_date가 없으면 감점 (Dead Lead)
        totalScore += 0;
        validActivities++;
        continue;
      }

      validActivities++;
      const nextActionDate = new Date(activity.next_action_date);
      const daysUntilNextAction = Math.ceil(
        (nextActionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      // 점수 계산 로직:
      // - 다음 활동 예정일이 지났으면 (Dead Lead) 0점
      // - 0-7일 이내: 100점 (적극적 관리)
      // - 8-14일: 80점
      // - 15-30일: 60점
      // - 30일 이상: 40점
      let activityScore = 0;
      if (daysUntilNextAction < 0) {
        // Dead Lead - 감점
        activityScore = 0;
      } else if (daysUntilNextAction <= 7) {
        activityScore = 100;
      } else if (daysUntilNextAction <= 14) {
        activityScore = 80;
      } else if (daysUntilNextAction <= 30) {
        activityScore = 60;
      } else {
        activityScore = 40;
      }

      totalScore += activityScore;
    }

    if (validActivities === 0) {
      console.log('유효한 Activity가 없어 PHR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 평균 계산
    const avgScore = totalScore / validActivities;

    // 0-100 스케일로 정규화
    const phrScore = Math.round(Math.min(100, Math.max(0, avgScore)));

    console.log('유효한 Activity 수:', validActivities);
    console.log('평균 점수:', avgScore);
    console.log('PHR 점수:', phrScore);
    console.groupEnd();

    return phrScore;
  } catch (error) {
    console.error('calculatePHR 에러:', error);
    console.groupEnd();
    throw error;
  }
}

