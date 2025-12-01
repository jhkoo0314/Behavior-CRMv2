'use server';

/**
 * Behavior Score 계산 및 저장 Server Action
 * 
 * 주기별 Behavior Score를 계산하고 behavior_scores 테이블에 저장합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { calculateBehaviorScores } from '@/lib/analytics/calculate-behavior-scores';
import type { BehaviorScoreResult } from '@/lib/analytics/calculate-behavior-scores';

export interface CalculateAndSaveInput {
  periodStart: Date | string;
  periodEnd: Date | string;
}

/**
 * Behavior Score를 계산하고 저장합니다.
 */
export async function calculateAndSaveBehaviorScores(
  input: CalculateAndSaveInput
): Promise<BehaviorScoreResult[]> {
  console.group('calculateAndSaveBehaviorScores: 시작');
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

    // Behavior Score 계산
    const scores = await calculateBehaviorScores(
      userUuid,
      periodStart,
      periodEnd
    );

    console.log('계산된 점수:', scores);

    // Supabase에 저장
    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 삭제 (중복 방지)
    await supabase
      .from('behavior_scores')
      .delete()
      .eq('user_id', userUuid)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    // 새 데이터 삽입
    const insertData = scores.map((score) => ({
      user_id: userUuid,
      behavior: score.behaviorType,
      intensity_score: score.intensityScore,
      diversity_score: score.diversityScore,
      quality_score: score.qualityScore,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    }));

    const { data, error } = await supabase
      .from('behavior_scores')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Behavior Score 저장 실패:', error);
      throw new Error(`Failed to save behavior scores: ${error.message}`);
    }

    console.log('저장 완료:', data);
    console.groupEnd();
    return scores;
  } catch (error) {
    console.error('calculateAndSaveBehaviorScores 에러:', error);
    console.groupEnd();
    throw error;
  }
}

