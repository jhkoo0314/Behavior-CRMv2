/**
 * 월별 매출 및 행동 점수 추이 차트 컴포넌트
 * 
 * ComposedChart를 사용하여 막대 그래프(매출)와 라인 그래프(행동 점수)를 함께 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRevenueStats } from '@/actions/outcomes/get-revenue-stats';
import { getBehaviorScoresTrend } from '@/actions/behavior-scores/get-behavior-scores-trend';
import { formatNumber } from '@/lib/utils/chart-data';
import type { MonthlyRevenue } from '@/actions/outcomes/get-revenue-stats';

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  revenue: number;
  behaviorScore: number;
}

export function RevenueBehaviorChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [goalLine, setGoalLine] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      console.group('RevenueBehaviorChart: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 올해 1월부터 현재까지의 데이터 조회
        const currentYear = new Date().getFullYear();
        const periodStart = new Date(currentYear, 0, 1);
        const periodEnd = new Date();

        const [revenueStats, behaviorData] = await Promise.all([
          getRevenueStats({
            periodStart,
            periodEnd,
          }),
          getBehaviorScoresTrend({
            periodStart,
            periodEnd,
            groupBy: 'day',
          }),
        ]);

        console.log('매출 통계:', revenueStats);
        console.log('행동 데이터:', behaviorData.length, '개');

        // 목표선 계산 (월별 평균 매출의 120%)
        const avgMonthlyRevenue =
          revenueStats.monthlyRevenues.length > 0
            ? revenueStats.monthlyRevenues.reduce((sum, m) => sum + m.revenue, 0) /
              revenueStats.monthlyRevenues.length
            : 0;
        const monthlyGoal = avgMonthlyRevenue * 1.2;
        setGoalLine(monthlyGoal);

        // 월별 행동 점수 평균 계산
        const behaviorByMonth = new Map<string, number[]>();

        for (const item of behaviorData) {
          const date = new Date(item.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const avgBehavior =
            (item.approach +
              item.contact +
              item.visit +
              item.presentation +
              item.question +
              item.need_creation +
              item.demonstration +
              item.follow_up) /
            8;

          if (!behaviorByMonth.has(monthKey)) {
            behaviorByMonth.set(monthKey, []);
          }
          behaviorByMonth.get(monthKey)!.push(avgBehavior);
        }

        // 차트 데이터 생성
        const mergedData: ChartDataPoint[] = revenueStats.monthlyRevenues.map((monthly) => {
          const behaviorScores = behaviorByMonth.get(monthly.month) || [];
          const avgBehaviorScore =
            behaviorScores.length > 0
              ? behaviorScores.reduce((sum, score) => sum + score, 0) / behaviorScores.length
              : 0;

          return {
            month: monthly.month,
            monthLabel: monthly.monthLabel,
            revenue: monthly.revenue,
            behaviorScore: Math.round(avgBehaviorScore * 10) / 10,
          };
        });

        console.log('차트 데이터 생성 완료:', mergedData.length, '개월');
        setChartData(mergedData);
      } catch (err) {
        console.error('차트 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>월별 매출 및 행동 점수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>월별 매출 및 행동 점수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>월별 매출 및 행동 점수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              데이터가 없습니다. 활동을 기록하면 차트가 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 목표선을 차트 높이의 20% 지점에 표시 (최대 매출의 20%가 목표)
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));
  const goalLineY = maxRevenue * 0.2;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">월별 매출 및 행동 점수 추이</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              행동 점수(파란선)가 상승한 달에는 매출(초록막대)도 동반 상승하는 경향이 있습니다.
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded bg-green-500" />
              <span>매출액</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded bg-blue-500" />
              <span>행동 점수</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                label={{ value: '매출액 (만원)', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <YAxis
                yAxisId="behavior"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}점`}
                label={{ value: '행동 점수', angle: 90, position: 'insideRight', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') {
                    return [`₩ ${formatNumber(value)}`, '매출액'];
                  }
                  return [`${value}점`, '행동 점수'];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'revenue') return '매출액';
                  if (value === 'behaviorScore') return '행동 점수';
                  return value;
                }}
              />
              {/* 목표선 */}
              {goalLineY > 0 && (
                <ReferenceLine
                  yAxisId="revenue"
                  y={goalLineY}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  label={{ value: 'Monthly Goal', position: 'right', fontSize: 10 }}
                />
              )}
              {/* 매출 막대 그래프 */}
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill="#10b981"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
              {/* 행동 점수 라인 그래프 */}
              <Line
                yAxisId="behavior"
                type="monotone"
                dataKey="behaviorScore"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="behaviorScore"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

