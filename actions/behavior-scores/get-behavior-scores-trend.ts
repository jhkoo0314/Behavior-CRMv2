'use server';

/**
 * Behavior Score 트렌드 데이터 조회 Server Action
 * 
 * 기간별 Behavior Score를 일별로 집계하여 트렌드 데이터를 반환합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { BehaviorScore } from '@/types/database.types';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';

export interface BehaviorTrendData {
  date: string; // YYYY-MM-DD 형식
  approach: number;
  contact: number;
  visit: number;
  presentation: number;
  question: number;
  need_creation: number;
  demonstration: number;
  follow_up: number;
}

export interface GetBehaviorScoresTrendInput {
  periodStart: Date | string;
  periodEnd: Date | string;
  groupBy?: 'day' | 'week'; // 일별 또는 주별 집계
}

/**
 * Behavior Score 트렌드 데이터를 조회합니다.
 */
export async function getBehaviorScoresTrend(
  input: GetBehaviorScoresTrendInput
): Promise<BehaviorTrendData[]> {
  console.group('getBehaviorScoresTrend: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const periodStart =
      input.periodStart instanceof Date
        ? input.periodStart
        : new Date(input.periodStart);
    const periodEnd =
      input.periodEnd instanceof Date
        ? input.periodEnd
        : new Date(input.periodEnd);

    const supabase = await createClerkSupabaseClient();

    // Behavior Score 조회
    const { data, error } = await supabase
      .from('behavior_scores')
      .select('*')
      .eq('user_id', userUuid)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .order('period_start', { ascending: true });

    if (error) {
      console.error('Behavior Score 조회 실패:', error);
      throw new Error(`Failed to get behavior scores: ${error.message}`);
    }

    const scores = (data || []) as BehaviorScore[];
    console.log('조회된 Behavior Score 수:', scores.length);

    // 일별로 집계
    const groupBy = input.groupBy || 'day';
    const trendMap = new Map<string, Map<string, number>>();

    for (const score of scores) {
      const periodStartDate = new Date(score.period_start);
      let dateKey: string;

      if (groupBy === 'week') {
        // 주별 집계: 해당 주의 월요일 날짜를 키로 사용
        const dayOfWeek = periodStartDate.getDay();
        const monday = new Date(periodStartDate);
        monday.setDate(periodStartDate.getDate() - dayOfWeek + 1);
        dateKey = monday.toISOString().split('T')[0];
      } else {
        // 일별 집계
        dateKey = periodStartDate.toISOString().split('T')[0];
      }

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, new Map());
        // 모든 Behavior 타입을 0으로 초기화
        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          trendMap.get(dateKey)!.set(behaviorType, 0);
        }
      }

      const behaviorMap = trendMap.get(dateKey)!;
      // quality_score를 사용 (또는 intensity_score, diversity_score의 평균)
      const currentValue = behaviorMap.get(score.behavior) || 0;
      behaviorMap.set(score.behavior, currentValue + score.quality_score);
    }

    // 날짜별로 평균 계산 및 데이터 변환
    const trendData: BehaviorTrendData[] = [];

    for (const [dateKey, behaviorMap] of trendMap.entries()) {
      // 같은 날짜에 여러 개의 score가 있을 수 있으므로 평균 계산
      // 하지만 현재 구조상 period_start와 period_end가 같은 날짜에 여러 개 있을 수 있음
      // 일단 합계를 사용하고, 필요시 카운트로 나누기

      trendData.push({
        date: dateKey,
        approach: behaviorMap.get('approach') || 0,
        contact: behaviorMap.get('contact') || 0,
        visit: behaviorMap.get('visit') || 0,
        presentation: behaviorMap.get('presentation') || 0,
        question: behaviorMap.get('question') || 0,
        need_creation: behaviorMap.get('need_creation') || 0,
        demonstration: behaviorMap.get('demonstration') || 0,
        follow_up: behaviorMap.get('follow_up') || 0,
      });
    }

    // 날짜순으로 정렬
    trendData.sort((a, b) => a.date.localeCompare(b.date));

    console.log('트렌드 데이터 생성 완료:', trendData.length, '개');
    console.groupEnd();

    return trendData;
  } catch (error) {
    console.error('getBehaviorScoresTrend 에러:', error);
    console.groupEnd();
    throw error;
  }
}



