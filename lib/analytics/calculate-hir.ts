/**
 * HIR (High-Impact Rate) 계산 함수
 * 
 * Behavior Score의 quality_score를 기반으로 HIR을 계산합니다.
 * 
 * 알고리즘:
 * - Behavior Score의 8개 지표별 quality_score 평균
 * - 또는 가중 평균 (중요 행동에 더 높은 가중치)
 * - 0-100 스케일로 정규화
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { BehaviorScore } from '@/types/database.types';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';

/**
 * 특정 기간의 Behavior Score를 조회합니다.
 */
async function getBehaviorScoresForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<BehaviorScore[]> {
  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from('behavior_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString());

  // account_id 필터링은 behavior_scores 테이블에 없으므로
  // activities를 통해 간접적으로 필터링해야 하지만,
  // 일단 전체 사용자 데이터로 계산

  const { data, error } = await query;

  if (error) {
    console.error('Behavior Score 조회 실패:', error);
    throw new Error(`Failed to get behavior scores: ${error.message}`);
  }

  return (data || []) as BehaviorScore[];
}

/**
 * HIR (High-Impact Rate)를 계산합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @param accountId 병원 ID (선택사항, 병원별 HIR 계산 시)
 * @returns HIR 점수 (0-100)
 */
export async function calculateHIR(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  accountId?: string
): Promise<number> {
  console.group('calculateHIR: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);
  if (accountId) {
    console.log('병원 ID:', accountId);
  }

  try {
    // Behavior Score 조회
    const behaviorScores = await getBehaviorScoresForPeriod(
      userId,
      periodStart,
      periodEnd,
      accountId
    );

    console.log('조회된 Behavior Score 수:', behaviorScores.length);

    if (behaviorScores.length === 0) {
      console.log('Behavior Score가 없어 HIR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 각 Behavior 타입별 quality_score 추출
    const qualityScores: number[] = [];

    for (const behaviorType of BEHAVIOR_TYPE_LIST) {
      // 해당 behavior_type의 가장 최근 quality_score 찾기
      const scoresForType = behaviorScores
        .filter((bs) => bs.behavior === behaviorType)
        .sort(
          (a, b) =>
            new Date(b.period_start).getTime() -
            new Date(a.period_start).getTime()
        );

      if (scoresForType.length > 0) {
        // 가장 최근 기간의 quality_score 사용
        qualityScores.push(scoresForType[0].quality_score);
      }
    }

    console.log('각 Behavior 타입별 quality_score:', qualityScores);

    if (qualityScores.length === 0) {
      console.log('quality_score가 없어 HIR을 0으로 반환');
      console.groupEnd();
      return 0;
    }

    // 평균 계산
    const avgQualityScore =
      qualityScores.reduce((sum, score) => sum + score, 0) /
      qualityScores.length;

    // 0-100 스케일로 정규화 (이미 0-100 범위이므로 그대로 사용)
    const hirScore = Math.round(Math.min(100, Math.max(0, avgQualityScore)));

    console.log('평균 quality_score:', avgQualityScore);
    console.log('HIR 점수:', hirScore);
    console.groupEnd();

    return hirScore;
  } catch (error) {
    console.error('calculateHIR 에러:', error);
    console.groupEnd();
    throw error;
  }
}

