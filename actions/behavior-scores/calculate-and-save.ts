'use server';

/**
 * Behavior Score 계산 및 저장 Server Action
 * 
 * 주기별 Behavior Score를 계산하고 behavior_scores 테이블에 저장합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { logger } from '@/lib/utils/logger';
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
  const startTime = Date.now();
  const actionName = 'calculateAndSaveBehaviorScores';

  logger.action.start(actionName);

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

    logger.debug('Behavior Score 계산 기간', {
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    // Behavior Score 계산
    logger.info('Behavior Score 계산 시작');
    const scores = await calculateBehaviorScores(
      userUuid,
      periodStart,
      periodEnd
    );

    logger.info('Behavior Score 계산 완료', {
      score_count: scores.length,
      behaviors: scores.map((s) => s.behaviorType),
    });

    // Supabase에 저장
    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 삭제 (중복 방지)
    logger.db.query('DELETE FROM behavior_scores', {
      user_id: userUuid,
    });

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

    logger.db.query('INSERT INTO behavior_scores', {
      record_count: insertData.length,
    });

    const { data, error } = await supabase
      .from('behavior_scores')
      .insert(insertData)
      .select();

    if (error) {
      logger.db.error('INSERT INTO behavior_scores', error as Error);
      throw new Error(`Failed to save behavior scores: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    logger.action.end(actionName, duration, {
      saved_count: data?.length || 0,
    });

    return scores;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

