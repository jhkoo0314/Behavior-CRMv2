/**
 * BCR (Behavior Consistency Rate) 계산 함수
 * 
 * Behavior Score의 일관성을 기반으로 루틴 점수를 계산합니다.
 * 
 * 알고리즘:
 * - 최근 30일 동안의 Behavior Score 일관성 측정
 * - 주기적으로 활동이 이루어졌는지 확인 (일관성)
 * - 활동 빈도와 규칙성을 종합하여 점수 계산
 * - 0-100 스케일로 정규화
 */

'use server';

import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { getBehaviorScores } from '@/actions/behavior-scores/get-behavior-scores';
import { getActivities } from '@/actions/activities/get-activities';

/**
 * BCR (Behavior Consistency Rate)를 계산합니다.
 * 
 * @param userId 사용자 UUID (선택사항, 없으면 현재 사용자)
 * @param periodStart 기간 시작일 (선택사항, 기본값: 30일 전)
 * @param periodEnd 기간 종료일 (선택사항, 기본값: 오늘)
 * @returns BCR 점수 (0-100)
 */
export async function calculateBCR(
  userId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<number> {
  console.group('calculateBCR: 시작');
  
  try {
    // 사용자 ID 확인
    let userUuid = userId;
    if (!userUuid) {
      userUuid = await getCurrentUserId();
      if (!userUuid) {
        console.log('사용자 ID를 찾을 수 없어 BCR을 0으로 반환');
        console.groupEnd();
        return 0;
      }
    }

    // 기간 설정 (기본값: 최근 30일)
    const endDate = periodEnd || new Date();
    const startDate = periodStart || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('사용자 ID:', userUuid);
    console.log('기간:', startDate, '~', endDate);

    // Activity 조회 (일관성 측정용)
    const { data: activities } = await getActivities({
      startDate,
      endDate,
    });

    console.log('조회된 Activity 수:', activities.length);

    if (activities.length === 0) {
      console.log('Activity가 없어 BCR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 1. 활동 빈도 점수 (0-40점)
    // 최근 30일 동안 활동한 일수 계산
    const activityDates = new Set(
      activities.map((act) => {
        const date = new Date(act.performed_at);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    const activeDays = activityDates.size;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const frequencyScore = Math.min(40, (activeDays / totalDays) * 40);

    console.log('활동 일수:', activeDays, '/', totalDays);
    console.log('빈도 점수:', frequencyScore);

    // 2. 활동 규칙성 점수 (0-30점)
    // 활동 간격의 표준편차가 낮을수록 규칙적
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
    );
    
    if (sortedActivities.length < 2) {
      // 활동이 1개 이하면 규칙성 점수 0
      const consistencyScore = 0;
      const bcrScore = Math.round(frequencyScore + consistencyScore);
      console.log('활동이 부족하여 규칙성 점수 0');
      console.log('BCR 점수:', bcrScore);
      console.groupEnd();
      return Math.min(100, Math.max(0, bcrScore));
    }

    // 활동 간격 계산 (시간 단위)
    const intervals: number[] = [];
    for (let i = 1; i < sortedActivities.length; i++) {
      const prevTime = new Date(sortedActivities[i - 1].performed_at).getTime();
      const currTime = new Date(sortedActivities[i].performed_at).getTime();
      const intervalHours = (currTime - prevTime) / (1000 * 60 * 60);
      intervals.push(intervalHours);
    }

    // 평균 간격
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // 표준편차 계산
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // 표준편차가 낮을수록 규칙적 (계수화)
    // 평균 간격이 24시간(1일)이고 표준편차가 낮으면 높은 점수
    const consistencyRatio = avgInterval > 0 ? Math.min(1, 24 / avgInterval) : 0;
    const regularityRatio = stdDev > 0 ? Math.min(1, 24 / stdDev) : 1;
    const consistencyScore = consistencyRatio * regularityRatio * 30;

    console.log('평균 간격:', avgInterval, '시간');
    console.log('표준편차:', stdDev);
    console.log('규칙성 점수:', consistencyScore);

    // 3. Behavior Score 일관성 점수 (0-30점)
    // Behavior Score의 quality_score 일관성 측정
    const behaviorScores = await getBehaviorScores({
      periodStart: startDate,
      periodEnd: endDate,
    });

    let qualityConsistencyScore = 0;
    if (behaviorScores.length > 0) {
      const qualityScores = behaviorScores.map((bs) => bs.quality_score);
      const avgQuality = qualityScores.reduce((sum, val) => sum + val, 0) / qualityScores.length;
      
      // 표준편차가 낮을수록 일관적
      const qualityVariance = qualityScores.reduce(
        (sum, val) => sum + Math.pow(val - avgQuality, 2),
        0
      ) / qualityScores.length;
      const qualityStdDev = Math.sqrt(qualityVariance);

      // 표준편차가 낮으면 높은 점수 (최대 30점)
      qualityConsistencyScore = Math.max(0, 30 - qualityStdDev);
    }

    console.log('품질 일관성 점수:', qualityConsistencyScore);

    // 총점 계산
    const bcrScore = Math.round(frequencyScore + consistencyScore + qualityConsistencyScore);

    console.log('BCR 점수:', bcrScore);
    console.groupEnd();

    return Math.min(100, Math.max(0, bcrScore));
  } catch (error) {
    console.error('calculateBCR 에러:', error);
    console.groupEnd();
    throw error;
  }
}

