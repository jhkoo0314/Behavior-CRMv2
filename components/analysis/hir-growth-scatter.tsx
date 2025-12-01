/**
 * HIR ↔ 성장률 상관도 차트 컴포넌트
 * 
 * X축: HIR, Y축: 필드 성장률, 버블 크기: 전체 활동량
 * PRD 4.2.1 참고: HIR ↔ 성장률 상관도 (ScatterChart)
 */

'use client';

import { useState, useEffect } from 'react';
import { Scatter, ScatterChart, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getOutcomes } from '@/actions/outcomes/get-outcomes';
import { getActivities } from '@/actions/activities/get-activities';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { CorrelationDataPoint } from '@/types/chart.types';

interface ScatterDataPoint extends CorrelationDataPoint {
  accountId: string;
}

export function HirGrowthScatter() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<ScatterDataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('HirGrowthScatter: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // account_id별 Outcome 조회
        const outcomesResult = await getOutcomes({
          periodStart: start,
          periodEnd: end,
          periodType: 'daily',
        });

        console.log('조회된 Outcome 수:', outcomesResult.data.length);

        // account_id별로 그룹화
        const accountMap = new Map<string, {
          hir: number[];
          growth: number[];
          activityCount: number;
        }>();

        // account_id가 null이 아닌 Outcome만 사용
        for (const outcome of outcomesResult.data) {
          if (outcome.account_id) {
            if (!accountMap.has(outcome.account_id)) {
              accountMap.set(outcome.account_id, {
                hir: [],
                growth: [],
                activityCount: 0,
              });
            }
            const account = accountMap.get(outcome.account_id)!;
            account.hir.push(outcome.hir_score);
            account.growth.push(outcome.field_growth_rate);
          }
        }

        // 각 account_id별 활동량 계산
        const accountIds = Array.from(accountMap.keys());
        for (const accountId of accountIds) {
          const activitiesResult = await getActivities({
            startDate: start,
            endDate: end,
            account_id: accountId,
          });
          const account = accountMap.get(accountId)!;
          account.activityCount = activitiesResult.totalCount;
        }

        // 차트 데이터 생성 (평균 HIR, 평균 성장률, 활동량)
        const data: ScatterDataPoint[] = [];
        for (const [accountId, stats] of accountMap.entries()) {
          const avgHir = stats.hir.length > 0
            ? stats.hir.reduce((sum, val) => sum + val, 0) / stats.hir.length
            : 0;
          const avgGrowth = stats.growth.length > 0
            ? stats.growth.reduce((sum, val) => sum + val, 0) / stats.growth.length
            : 0;

          if (avgHir > 0 || avgGrowth > 0) {
            data.push({
              x: avgHir,
              y: avgGrowth,
              size: stats.activityCount,
              name: `병원 ${accountId.slice(0, 8)}...`, // 임시 이름
              accountId,
            });
          }
        }

        console.log('차트 데이터:', data);
        setChartData(data);
      } catch (err) {
        console.error('HIR ↔ 성장률 상관도 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const isEmpty = !isLoading && chartData.length === 0;

  // 버블 크기 범위 계산
  const maxSize = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.size))
    : 100;

  return (
    <ChartWrapper
      title="HIR ↔ 성장률 상관도"
      description="X축: HIR, Y축: 필드 성장률, 버블 크기: 전체 활동량"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다. 활동을 기록하면 상관도 차트가 표시됩니다."
    >
      {!isEmpty && (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="HIR"
              label={{ value: 'HIR', position: 'insideBottom', offset: -5 }}
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="필드 성장률"
              label={{ value: '필드 성장률 (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 'dataMax']}
            />
            <ZAxis
              type="number"
              dataKey="size"
              range={[50, 500]}
              name="활동량"
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload as ScatterDataPoint;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        HIR: {data.x.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        필드 성장률: {data.y.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        활동량: {data.size}건
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="병원" data={chartData} fill="hsl(var(--primary))">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--primary))`}
                  opacity={0.6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
