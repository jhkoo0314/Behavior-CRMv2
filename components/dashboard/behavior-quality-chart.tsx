/**
 * Behavior Quality Score 차트 컴포넌트
 * 
 * 8개 Behavior 지표의 품질 점수를 RadarChart로 표시합니다.
 * PRD 4.1.1 참고: Behavior Quality Score (RadarChart)
 */

'use client';

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getBehaviorScores } from '@/actions/behavior-scores/get-behavior-scores';
import { BEHAVIOR_TYPE_LIST, BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import type { BehaviorScore } from '@/types/database.types';
import type { BehaviorQualityData } from '@/types/chart.types';
import { calculatePeriod } from '@/lib/utils/chart-data';
import { Button } from '@/components/ui/button';

export function BehaviorQualityChart() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<BehaviorQualityData[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('BehaviorQualityChart: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(period);
        console.log('기간:', period, '일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        const scores = await getBehaviorScores({
          periodStart: start,
          periodEnd: end,
        });

        console.log('조회된 Behavior Score 수:', scores.length);

        // 각 Behavior 타입별로 평균 quality_score 계산
        const dataMap = new Map<string, { sum: number; count: number }>();

        for (const behaviorType of BEHAVIOR_TYPE_LIST) {
          dataMap.set(behaviorType, { sum: 0, count: 0 });
        }

        for (const score of scores) {
          const existing = dataMap.get(score.behavior);
          if (existing) {
            existing.sum += score.quality_score;
            existing.count += 1;
          }
        }

        const chartDataArray: BehaviorQualityData[] = BEHAVIOR_TYPE_LIST.map((behaviorType) => {
          const stats = dataMap.get(behaviorType) || { sum: 0, count: 0 };
          const avgScore = stats.count > 0 ? stats.sum / stats.count : 0;

          return {
            behavior: behaviorType,
            behaviorLabel: BEHAVIOR_TYPE_LABELS[behaviorType],
            score: Math.round(avgScore),
          };
        });

        console.log('차트 데이터:', chartDataArray);
        setChartData(chartDataArray);
      } catch (err) {
        console.error('Behavior Quality Score 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, [period]);

  const isEmpty = !isLoading && chartData.length === 0;

  return (
    <ChartWrapper
      title="Behavior Quality Score"
      description={`최근 ${period}일 기준 행동 품질 점수`}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다. 활동을 기록하면 차트가 표시됩니다."
    >
      <div className="space-y-4">
        {/* 기간 선택 버튼 */}
        <div className="flex gap-2">
          <Button
            variant={period === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(7)}
          >
            7일
          </Button>
          <Button
            variant={period === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(30)}
          >
            30일
          </Button>
        </div>

        {/* RadarChart */}
        {!isEmpty && (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="behaviorLabel"
                tick={{ fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="품질 점수"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartWrapper>
  );
}
