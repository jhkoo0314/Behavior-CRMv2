'use server';

/**
 * 팀 KPI 집계 Server Action
 *
 * 관리자 대시보드에서 사용하는 팀 전체 KPI를 계산합니다.
 * - Team Behavior Score: 팀원들의 평균 Behavior Score
 * - Avg. HIR: 팀원들의 평균 HIR 점수
 * - Active Pipeline: 팀 전체 파이프라인 금액 (임시로 0 표시)
 * - Team Goal Forecast: 목표 달성 예측률
 */

import { getTeamMembers } from '@/actions/users/get-team-members';
import { getBehaviorScoresByUser } from '@/actions/behavior-scores/get-behavior-scores-by-user';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { getOutcomesByUser } from '@/actions/outcomes/get-outcomes-by-user';
import { calculatePeriod, calculatePreviousPeriod } from '@/lib/utils/chart-data';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';

export interface TeamKPIs {
  behaviorScore: {
    current: number;
    previous: number;
    change: number;
  };
  avgHir: {
    current: number;
    previous: number;
    change: number;
  };
  activePipeline: {
    current: number;
    previous: number;
    change: number;
  };
  goalForecast: {
    current: number;
    previous: number;
    change: number;
  };
}

export async function getTeamKPIs(): Promise<TeamKPIs> {
  console.group('getTeamKPIs: 시작');

  try {
    // 팀원 목록 조회
    const teamMembersResult = await getTeamMembers({});
    console.log('조회된 팀원 수:', teamMembersResult.data.length);

    if (teamMembersResult.data.length === 0) {
      console.log('팀원이 없어 기본값 반환');
      console.groupEnd();
      return {
        behaviorScore: { current: 0, previous: 0, change: 0 },
        avgHir: { current: 0, previous: 0, change: 0 },
        activePipeline: { current: 0, previous: 0, change: 0 },
        goalForecast: { current: 0, previous: 0, change: 0 },
      };
    }

    // 현재 기간 (최근 30일)
    const { start: currentStart, end: currentEnd } = calculatePeriod(30);
    // 이전 기간 (30일 전 ~ 60일 전)
    const { start: previousStart, end: previousEnd } = calculatePreviousPeriod(
      currentStart,
      currentEnd
    );

    console.log('현재 기간:', currentStart, '~', currentEnd);
    console.log('이전 기간:', previousStart, '~', previousEnd);

    // 각 팀원의 지표 계산
    let totalBehaviorScore = 0;
    let totalHir = 0;
    let totalPreviousBehaviorScore = 0;
    let totalPreviousHir = 0;
    let memberCount = 0;

    for (const member of teamMembersResult.data) {
      if (!member.id) continue;

      try {
        // 현재 기간 Behavior Score 계산
        const currentScores = await getBehaviorScoresByUser({
          userId: member.id,
          periodStart: currentStart,
          periodEnd: currentEnd,
        });

        const behaviorScoreMap: Record<string, { sum: number; count: number }> = {};
        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          behaviorScoreMap[behaviorType] = { sum: 0, count: 0 };
        }

        for (const score of currentScores) {
          const existing = behaviorScoreMap[score.behavior];
          if (existing) {
            existing.sum += score.quality_score;
            existing.count += 1;
          }
        }

        let totalScore = 0;
        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          const stats = behaviorScoreMap[behaviorType];
          const avgScore = stats.count > 0 ? stats.sum / stats.count : 0;
          totalScore += avgScore;
        }
        const avgBehaviorScore = Math.round(totalScore / BEHAVIOR_TYPE_LIST.length);

        // 현재 기간 HIR 계산
        const currentHir = await calculateHIR(member.id, currentStart, currentEnd);

        // 이전 기간 Behavior Score 계산
        const previousScores = await getBehaviorScoresByUser({
          userId: member.id,
          periodStart: previousStart,
          periodEnd: previousEnd,
        });

        const previousBehaviorScoreMap: Record<string, { sum: number; count: number }> = {};
        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          previousBehaviorScoreMap[behaviorType] = { sum: 0, count: 0 };
        }

        for (const score of previousScores) {
          const existing = previousBehaviorScoreMap[score.behavior];
          if (existing) {
            existing.sum += score.quality_score;
            existing.count += 1;
          }
        }

        let previousTotalScore = 0;
        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          const stats = previousBehaviorScoreMap[behaviorType];
          const avgScore = stats.count > 0 ? stats.sum / stats.count : 0;
          previousTotalScore += avgScore;
        }
        const avgPreviousBehaviorScore = Math.round(previousTotalScore / BEHAVIOR_TYPE_LIST.length);

        // 이전 기간 HIR 계산
        const previousHir = await calculateHIR(member.id, previousStart, previousEnd);

        totalBehaviorScore += avgBehaviorScore;
        totalHir += currentHir;
        totalPreviousBehaviorScore += avgPreviousBehaviorScore;
        totalPreviousHir += previousHir;
        memberCount += 1;
      } catch (err) {
        console.error(`팀원 ${member.name} 지표 계산 실패:`, err);
        // 개별 팀원 오류는 무시하고 계속 진행
      }
    }

    // 평균 계산
    const avgBehaviorScore = memberCount > 0 ? totalBehaviorScore / memberCount : 0;
    const avgHir = memberCount > 0 ? totalHir / memberCount : 0;
    const avgPreviousBehaviorScore = memberCount > 0 ? totalPreviousBehaviorScore / memberCount : 0;
    const avgPreviousHir = memberCount > 0 ? totalPreviousHir / memberCount : 0;

    // 변화율 계산
    const behaviorScoreChange = avgPreviousBehaviorScore > 0
      ? Math.round(((avgBehaviorScore - avgPreviousBehaviorScore) / avgPreviousBehaviorScore) * 100)
      : 0;
    const hirChange = avgPreviousHir > 0
      ? Math.round(((avgHir - avgPreviousHir) / avgPreviousHir) * 100)
      : 0;

    // Active Pipeline (임시로 0, 향후 구현 필요)
    const activePipeline = 0;
    const previousPipeline = 0;
    const pipelineChange = 0;

    // Goal Forecast (임시로 HIR 기반 계산)
    const targetHir = 70;
    const goalForecast = Math.min(100, Math.round((avgHir / targetHir) * 100));
    const previousGoalForecast = Math.min(100, Math.round((avgPreviousHir / targetHir) * 100));
    const goalForecastChange = previousGoalForecast > 0
      ? Math.round(((goalForecast - previousGoalForecast) / previousGoalForecast) * 100)
      : 0;

    console.log('팀 KPI 결과:', {
      behaviorScore: { current: avgBehaviorScore, previous: avgPreviousBehaviorScore, change: behaviorScoreChange },
      avgHir: { current: avgHir, previous: avgPreviousHir, change: hirChange },
      activePipeline: { current: activePipeline, previous: previousPipeline, change: pipelineChange },
      goalForecast: { current: goalForecast, previous: previousGoalForecast, change: goalForecastChange },
    });

    console.groupEnd();

    return {
      behaviorScore: {
        current: Math.round(avgBehaviorScore),
        previous: Math.round(avgPreviousBehaviorScore),
        change: behaviorScoreChange,
      },
      avgHir: {
        current: Math.round(avgHir),
        previous: Math.round(avgPreviousHir),
        change: hirChange,
      },
      activePipeline: {
        current: activePipeline,
        previous: previousPipeline,
        change: pipelineChange,
      },
      goalForecast: {
        current: goalForecast,
        previous: previousGoalForecast,
        change: goalForecastChange,
      },
    };
  } catch (error) {
    console.error('getTeamKPIs 에러:', error);
    console.groupEnd();
    throw error;
  }
}

