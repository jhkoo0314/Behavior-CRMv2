/**
 * Behavior-Outcome 상관관계 분석 함수
 * 
 * 어떤 행동이 성과에 가장 큰 영향을 미치는지 분석합니다.
 * 
 * 알고리즘:
 * - Behavior Score와 Outcome 지표 간 상관관계 계산
 * - 가중치 계산 (어떤 behavior가 어떤 outcome에 더 큰 영향)
 * - 통계적 상관관계 (Pearson correlation 또는 단순 선형 회귀)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { BehaviorScore } from '@/types/database.types';
import type { Outcome } from '@/types/database.types';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';

/**
 * 특정 기간의 Behavior Score를 조회합니다.
 */
async function getBehaviorScoresForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<BehaviorScore[]> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('behavior_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString());

  if (error) {
    console.error('Behavior Score 조회 실패:', error);
    throw new Error(`Failed to get behavior scores: ${error.message}`);
  }

  return (data || []) as BehaviorScore[];
}

/**
 * 특정 기간의 Outcome를 조회합니다.
 */
async function getOutcomesForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Outcome[]> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .eq('user_id', userId)
    .is('account_id', null) // 전체 통계만 사용
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString());

  if (error) {
    console.error('Outcome 조회 실패:', error);
    throw new Error(`Failed to get outcomes: ${error.message}`);
  }

  return (data || []) as Outcome[];
}

/**
 * Pearson 상관계수를 계산합니다.
 */
function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Behavior-Outcome 상관관계 분석 결과 타입
 */
export interface BehaviorOutcomeCorrelation {
  behavior: string;
  outcomeType: 'hir' | 'conversion_rate' | 'field_growth_rate' | 'prescription_index';
  correlation: number; // -1 ~ 1
  weight: number; // 0 ~ 1 (영향력 가중치)
}

export interface CorrelationAnalysisResult {
  correlations: BehaviorOutcomeCorrelation[];
  summary: {
    topBehaviorsForHIR: string[];
    topBehaviorsForConversion: string[];
    topBehaviorsForGrowth: string[];
    topBehaviorsForPrescription: string[];
  };
}

/**
 * Behavior-Outcome 상관관계를 분석합니다.
 * 
 * @param userId 사용자 UUID
 * @param periodStart 기간 시작일
 * @param periodEnd 기간 종료일
 * @returns 상관관계 분석 결과
 */
export async function analyzeBehaviorOutcomeCorrelation(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CorrelationAnalysisResult> {
  console.group('analyzeBehaviorOutcomeCorrelation: 시작');
  console.log('사용자 ID:', userId);
  console.log('기간:', periodStart, '~', periodEnd);

  try {
    // Behavior Score와 Outcome 조회
    const behaviorScores = await getBehaviorScoresForPeriod(
      userId,
      periodStart,
      periodEnd
    );
    const outcomes = await getOutcomesForPeriod(userId, periodStart, periodEnd);

    console.log('조회된 Behavior Score 수:', behaviorScores.length);
    console.log('조회된 Outcome 수:', outcomes.length);

    if (behaviorScores.length === 0 || outcomes.length === 0) {
      console.log('데이터가 부족하여 상관관계 분석 불가');
      console.groupEnd();
      return {
        correlations: [],
        summary: {
          topBehaviorsForHIR: [],
          topBehaviorsForConversion: [],
          topBehaviorsForGrowth: [],
          topBehaviorsForPrescription: [],
        },
      };
    }

    // 기간별로 그룹화
    const behaviorScoresByPeriod = new Map<string, Map<string, BehaviorScore>>();
    const outcomesByPeriod = new Map<string, Outcome>();

    for (const bs of behaviorScores) {
      const periodKey = `${bs.period_start}_${bs.period_end}`;
      if (!behaviorScoresByPeriod.has(periodKey)) {
        behaviorScoresByPeriod.set(periodKey, new Map());
      }
      behaviorScoresByPeriod.get(periodKey)!.set(bs.behavior, bs);
    }

    for (const outcome of outcomes) {
      const periodKey = `${outcome.period_start}_${outcome.period_end}`;
      outcomesByPeriod.set(periodKey, outcome);
    }

    // 공통 기간 찾기
    const commonPeriods = Array.from(behaviorScoresByPeriod.keys()).filter(
      (key) => outcomesByPeriod.has(key)
    );

    console.log('공통 기간 수:', commonPeriods.length);

    if (commonPeriods.length === 0) {
      console.log('공통 기간이 없어 상관관계 분석 불가');
      console.groupEnd();
      return {
        correlations: [],
        summary: {
          topBehaviorsForHIR: [],
          topBehaviorsForConversion: [],
          topBehaviorsForGrowth: [],
          topBehaviorsForPrescription: [],
        },
      };
    }

    // 각 Behavior와 Outcome 지표 간 상관관계 계산
    const correlations: BehaviorOutcomeCorrelation[] = [];

    const outcomeTypes: Array<
      'hir' | 'conversion_rate' | 'field_growth_rate' | 'prescription_index'
    > = ['hir', 'conversion_rate', 'field_growth_rate', 'prescription_index'];

    for (const behaviorType of BEHAVIOR_TYPE_LIST) {
      for (const outcomeType of outcomeTypes) {
        const behaviorValues: number[] = [];
        const outcomeValues: number[] = [];

        for (const periodKey of commonPeriods) {
          const bsMap = behaviorScoresByPeriod.get(periodKey);
          const outcome = outcomesByPeriod.get(periodKey);

          if (bsMap && outcome) {
            const bs = bsMap.get(behaviorType);
            if (bs) {
              // quality_score를 사용
              behaviorValues.push(bs.quality_score);
              
              let outcomeValue = 0;
              if (outcomeType === 'hir') {
                outcomeValue = outcome.hir_score;
              } else if (outcomeType === 'conversion_rate') {
                outcomeValue = outcome.conversion_rate;
              } else if (outcomeType === 'field_growth_rate') {
                outcomeValue = outcome.field_growth_rate;
              } else if (outcomeType === 'prescription_index') {
                outcomeValue = outcome.prescription_index;
              }

              outcomeValues.push(outcomeValue);
            }
          }
        }

        if (behaviorValues.length > 1 && outcomeValues.length > 1) {
          const correlation = calculatePearsonCorrelation(
            behaviorValues,
            outcomeValues
          );

          // 가중치 계산 (상관계수의 절댓값)
          const weight = Math.abs(correlation);

          correlations.push({
            behavior: behaviorType,
            outcomeType,
            correlation,
            weight,
          });
        }
      }
    }

    console.log('계산된 상관관계 수:', correlations.length);

    // 요약 정보 생성
    const topBehaviorsForHIR = correlations
      .filter((c) => c.outcomeType === 'hir')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((c) => c.behavior);

    const topBehaviorsForConversion = correlations
      .filter((c) => c.outcomeType === 'conversion_rate')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((c) => c.behavior);

    const topBehaviorsForGrowth = correlations
      .filter((c) => c.outcomeType === 'field_growth_rate')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((c) => c.behavior);

    const topBehaviorsForPrescription = correlations
      .filter((c) => c.outcomeType === 'prescription_index')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((c) => c.behavior);

    console.log('HIR에 가장 큰 영향을 미치는 행동:', topBehaviorsForHIR);
    console.log('전환률에 가장 큰 영향을 미치는 행동:', topBehaviorsForConversion);
    console.log('성장률에 가장 큰 영향을 미치는 행동:', topBehaviorsForGrowth);
    console.log('처방지수에 가장 큰 영향을 미치는 행동:', topBehaviorsForPrescription);

    console.groupEnd();

    return {
      correlations,
      summary: {
        topBehaviorsForHIR,
        topBehaviorsForConversion,
        topBehaviorsForGrowth,
        topBehaviorsForPrescription,
      },
    };
  } catch (error) {
    console.error('analyzeBehaviorOutcomeCorrelation 에러:', error);
    console.groupEnd();
    throw error;
  }
}

