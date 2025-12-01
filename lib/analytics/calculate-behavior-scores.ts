/**
 * Behavior Score 계산 함수
 * 
 * Activity 데이터를 기반으로 Behavior Score를 계산합니다.
 * 
 * 계산 알고리즘:
 * - 행동 강도(Intensity): 방문*3 + 콜*2 + 메시지*1 + 자료전달*2 → 0-100 스케일
 * - 행동 다양성(Diversity): 고유한 behavior_type 개수 / 8 → 0-100 스케일
 * - 행동 질(Quality): 평균 quality_score * 0.4 + 평균 quantity_score * 0.3 + follow_up 비율 * 0.3 → 0-100 스케일
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Activity } from '@/types/database.types';
import type { BehaviorType } from '@/constants/behavior-types';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';
import { ACTIVITY_TYPES } from '@/constants/activity-types';

export interface BehaviorScoreResult {
  behaviorType: BehaviorType;
  intensityScore: number; // 0-100
  diversityScore: number; // 0-100
  qualityScore: number; // 0-100
  periodStart: Date;
  periodEnd: Date;
}

/**
 * 특정 기간의 Activity 데이터를 조회합니다.
 */
async function getActivitiesForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Activity[]> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', periodStart.toISOString())
    .lte('performed_at', periodEnd.toISOString());

  if (error) {
    console.error('Activity 조회 실패:', error);
    throw new Error(`Failed to get activities: ${error.message}`);
  }

  return (data || []) as Activity[];
}

/**
 * 행동 강도(Intensity) 점수를 계산합니다.
 * 
 * 가중치:
 * - 방문(visit): 3
 * - 전화(call): 2
 * - 메시지(message): 1
 * - 프레젠테이션(presentation): 2
 * - 후속 관리(follow_up): 1
 */
function calculateIntensityScore(activities: Activity[]): number {
  console.group('calculateIntensityScore: 시작');
  console.log('활동 수:', activities.length);

  let weightedSum = 0;

  activities.forEach((activity) => {
    let weight = 1; // 기본 가중치

    switch (activity.type) {
      case ACTIVITY_TYPES.VISIT:
        weight = 3;
        break;
      case ACTIVITY_TYPES.CALL:
        weight = 2;
        break;
      case ACTIVITY_TYPES.MESSAGE:
        weight = 1;
        break;
      case ACTIVITY_TYPES.PRESENTATION:
        weight = 2;
        break;
      case ACTIVITY_TYPES.FOLLOW_UP:
        weight = 1;
        break;
    }

    weightedSum += weight;
  });

  // 최대값 기준 정규화 (예: 하루 최대 10개 활동 * 가중치 3 = 30)
  // 실제로는 사용자별 평균을 기준으로 정규화하는 것이 좋지만,
  // 일단 간단하게 최대값 100으로 가정
  const maxPossibleScore = 100; // 임시 값, 실제로는 통계 기반으로 조정 필요
  const intensityScore = Math.min(
    100,
    Math.round((weightedSum / maxPossibleScore) * 100)
  );

  console.log('가중 합계:', weightedSum);
  console.log('강도 점수:', intensityScore);
  console.groupEnd();

  return intensityScore;
}

/**
 * 행동 다양성(Diversity) 점수를 계산합니다.
 * 
 * 고유한 behavior_type 개수를 8로 나누어 0-100 스케일로 변환합니다.
 */
function calculateDiversityScore(activities: Activity[]): number {
  console.group('calculateDiversityScore: 시작');
  console.log('활동 수:', activities.length);

  const uniqueBehaviors = new Set(activities.map((act) => act.behavior));
  const diversityCount = uniqueBehaviors.size;
  const totalBehaviorTypes = BEHAVIOR_TYPE_LIST.length; // 8

  const diversityScore = Math.round(
    (diversityCount / totalBehaviorTypes) * 100
  );

  console.log('고유 행동 타입 수:', diversityCount);
  console.log('다양성 점수:', diversityScore);
  console.groupEnd();

  return diversityScore;
}

/**
 * 행동 질(Quality) 점수를 계산합니다.
 * 
 * 공식:
 * - 평균 quality_score * 0.4
 * - 평균 quantity_score * 0.3
 * - follow_up 비율 * 0.3
 */
function calculateQualityScore(activities: Activity[]): number {
  console.group('calculateQualityScore: 시작');
  console.log('활동 수:', activities.length);

  if (activities.length === 0) {
    console.groupEnd();
    return 0;
  }

  // 평균 quality_score
  const avgQualityScore =
    activities.reduce((sum, act) => sum + act.quality_score, 0) /
    activities.length;

  // 평균 quantity_score
  const avgQuantityScore =
    activities.reduce((sum, act) => sum + act.quantity_score, 0) /
    activities.length;

  // follow_up 비율
  const followUpCount = activities.filter(
    (act) => act.behavior === 'follow_up'
  ).length;
  const followUpRatio = followUpCount / activities.length;

  // 가중 평균
  const qualityScore = Math.round(
    avgQualityScore * 0.4 + avgQuantityScore * 0.3 + followUpRatio * 100 * 0.3
  );

  console.log('평균 품질 점수:', avgQualityScore);
  console.log('평균 양 점수:', avgQuantityScore);
  console.log('후속 관리 비율:', followUpRatio);
  console.log('질 점수:', qualityScore);
  console.groupEnd();

  return Math.min(100, Math.max(0, qualityScore));
}

/**
 * 특정 Behavior 타입에 대한 점수를 계산합니다.
 */
function calculateBehaviorTypeScore(
  activities: Activity[],
  behaviorType: BehaviorType
): {
  intensityScore: number;
  diversityScore: number;
  qualityScore: number;
} {
  // 해당 behavior_type의 활동만 필터링
  const filteredActivities = activities.filter(
    (act) => act.behavior === behaviorType
  );

  const intensityScore = calculateIntensityScore(filteredActivities);
  const diversityScore = calculateDiversityScore(filteredActivities);
  const qualityScore = calculateQualityScore(filteredActivities);

  return {
    intensityScore,
    diversityScore,
    qualityScore,
  };
}

/**
 * Behavior Score를 계산합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @returns Behavior Score 결과 배열 (각 Behavior 타입별)
 */
export async function calculateBehaviorScores(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<BehaviorScoreResult[]> {
  console.group('calculateBehaviorScores: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);

  // Activity 데이터 조회
  const activities = await getActivitiesForPeriod(userId, periodStart, periodEnd);
  console.log('조회된 활동 수:', activities.length);

  // 각 Behavior 타입별로 점수 계산
  const results: BehaviorScoreResult[] = [];

  for (const behaviorType of BEHAVIOR_TYPE_LIST) {
    const scores = calculateBehaviorTypeScore(activities, behaviorType);

    results.push({
      behaviorType,
      intensityScore: scores.intensityScore,
      diversityScore: scores.diversityScore,
      qualityScore: scores.qualityScore,
      periodStart,
      periodEnd,
    });
  }

  console.log('계산 완료:', results);
  console.groupEnd();

  return results;
}

