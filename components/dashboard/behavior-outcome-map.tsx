/**
 * Behavior-Outcome 관계 지도 컴포넌트
 * 
 * 어떤 행동이 성과에 가장 큰 영향을 미치는지 시각화합니다.
 * PRD 4.1.3 참고: Behavior-Outcome 관계 지도
 */

'use client';

import { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getCorrelationAnalysis } from '@/actions/analytics/get-correlation-analysis';
import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import { OUTCOME_TYPE_LABELS } from '@/constants/outcome-types';
import { calculatePeriod } from '@/lib/utils/chart-data';

interface RelationshipData {
  name: string;
  value: number; // 가중치 (0-1)
  behavior: string;
  outcome: string;
  [key: string]: string | number; // Recharts Treemap 타입 요구사항
}

export function BehaviorOutcomeMap() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<RelationshipData[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('BehaviorOutcomeMap: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        const analysis = await getCorrelationAnalysis({
          periodStart: start,
          periodEnd: end,
        });

        console.log('상관관계 분석 결과:', analysis);

        // 가중치가 높은 상위 관계만 필터링 (상위 16개: 8개 Behavior × 4개 Outcome 중 상위)
        const sortedCorrelations = analysis.correlations
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 16);

        const data: RelationshipData[] = sortedCorrelations.map((correlation) => ({
          name: `${BEHAVIOR_TYPE_LABELS[correlation.behavior as keyof typeof BEHAVIOR_TYPE_LABELS]} → ${OUTCOME_TYPE_LABELS[correlation.outcomeType as keyof typeof OUTCOME_TYPE_LABELS]}`,
          value: correlation.weight * 100, // 0-100 스케일로 변환
          behavior: correlation.behavior,
          outcome: correlation.outcomeType,
        }));

        console.log('차트 데이터:', data);
        setChartData(data);
      } catch (err) {
        console.error('Behavior-Outcome 관계 분석 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const isEmpty = !isLoading && chartData.length === 0;

  // 색상 팔레트 (가중치에 따라 색상 강도 조정)
  const getColor = (value: number) => {
    const intensity = Math.min(value / 100, 1);
    const hue = 220; // 파란색 계열
    const saturation = 60 + intensity * 40; // 60-100
    const lightness = 50 + (1 - intensity) * 30; // 50-80
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <ChartWrapper
      title="Behavior-Outcome 관계 지도"
      description="어떤 행동이 성과에 가장 큰 영향을 미치는지 시각화 (최근 30일)"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다. 활동을 기록하면 관계 지도가 표시됩니다."
    >
      {!isEmpty && (
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={chartData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="hsl(var(--primary))"
          >
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload as RelationshipData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        영향도: {data.value.toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.value)}
              />
            ))}
          </Treemap>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
