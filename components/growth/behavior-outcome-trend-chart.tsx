/**
 * Dual-Axis Trend Chart 컴포넌트
 * 
 * 행동 품질(Behavior)과 성과(Outcome)를 하나의 차트에 표시하여 인과관계를 시각화
 * PRD 4.3 참고: 행동-성과 인과관계 분석
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendDataPoint {
  date: string;
  behavior: number; // 행동 품질 평균 점수
  outcome: number; // 성과/매출 (HIR 또는 처방지수)
}

export function BehaviorOutcomeTrendChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [laggingArea, setLaggingArea] = useState<{
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    function generateMockData() {
      console.group('BehaviorOutcomeTrendChart: Mock 데이터 생성 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 최근 12주간의 mock 데이터 생성
        const weeks = 12;
        const mockData: TrendDataPoint[] = [];
        const today = new Date();
        
        // 행동 품질: 초기값 45점에서 시작하여 점진적으로 상승 (약간의 변동 포함)
        const behaviorBase = 45;
        // 성과: 행동보다 약 2주 지연된 패턴으로 상승
        const outcomeBase = 40;

        // 1단계: 먼저 행동 데이터만 생성
        const behaviorValues: number[] = [];
        const dates: string[] = [];

        for (let i = weeks - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - (i * 7));
          
          // 매주 월요일로 정규화
          const dayOfWeek = date.getDay();
          const monday = new Date(date);
          monday.setDate(date.getDate() - dayOfWeek + 1);
          const dateKey = monday.toISOString().split('T')[0];
          dates.push(dateKey);

          // 행동 품질: 점진적 상승 + 약간의 랜덤 변동
          // 초반에는 느리게 상승, 중반부터 가속, 후반에는 안정화
          const progress = (weeks - i) / weeks;
          let behaviorTrend = 0;
          
          if (progress < 0.3) {
            // 초반 30%: 느린 상승
            behaviorTrend = behaviorBase + (progress * 0.3) * 15 + (Math.random() - 0.5) * 3;
          } else if (progress < 0.7) {
            // 중반 40%: 빠른 상승 (가속 구간)
            behaviorTrend = behaviorBase + 4.5 + ((progress - 0.3) * 0.4) * 25 + (Math.random() - 0.5) * 4;
          } else {
            // 후반 30%: 안정화 (약간의 변동)
            behaviorTrend = behaviorBase + 14.5 + ((progress - 0.7) * 0.3) * 10 + (Math.random() - 0.5) * 2;
          }
          
          behaviorTrend = Math.max(30, Math.min(95, behaviorTrend)); // 30-95 범위로 제한
          behaviorValues.push(Math.round(behaviorTrend * 10) / 10);
        }

        // 2단계: 성과 데이터 생성 (행동 데이터를 참조하여 2주 지연 효과 적용)
        for (let i = 0; i < weeks; i++) {
          let outcomeTrend = 0;
          
          if (i >= 2) {
            // 2주 전 행동 데이터를 참조 (지연 효과)
            const behavior2WeeksAgo = behaviorValues[i - 2];
            outcomeTrend = behavior2WeeksAgo * 0.85 + (Math.random() - 0.5) * 5; // 약간의 변동
          } else {
            // 초기 2주는 기본값 사용
            outcomeTrend = outcomeBase + (Math.random() - 0.5) * 5;
          }
          
          outcomeTrend = Math.max(25, Math.min(90, outcomeTrend)); // 25-90 범위로 제한

          mockData.push({
            date: dates[i],
            behavior: behaviorValues[i],
            outcome: Math.round(outcomeTrend * 10) / 10,
          });
        }

        console.log('생성된 Mock 데이터:', mockData.length, '개');
        console.log('샘플 데이터:', mockData.slice(0, 3));
        console.log('전체 데이터:', mockData);

        setChartData(mockData);

        // Lagging Effect 영역 찾기: 행동이 가장 크게 상승한 지점에서 2주 후 영역
        if (mockData.length > 4) {
          let maxBehaviorIncrease = 0;
          let increaseIndex = -1;
          
          for (let i = 1; i < mockData.length - 2; i++) {
            const increase = mockData[i].behavior - mockData[i - 1].behavior;
            if (increase > maxBehaviorIncrease) {
              maxBehaviorIncrease = increase;
              increaseIndex = i;
            }
          }

          if (increaseIndex > 0 && increaseIndex < mockData.length - 2) {
            // 행동 상승 지점에서 2주 후 (약 2개 데이터 포인트)
            setLaggingArea({
              start: increaseIndex + 2, // 행동 상승 후 2주
              end: Math.min(increaseIndex + 4, mockData.length - 1),
            });
            console.log('Lagging Effect 영역:', increaseIndex + 2, '~', Math.min(increaseIndex + 4, mockData.length - 1));
          }
        }
      } catch (err) {
        console.error('Mock 데이터 생성 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 생성할 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    // 약간의 지연을 주어 로딩 상태를 보여줌
    const timer = setTimeout(() => {
      generateMockData();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>행동-성과 인과관계 분석</CardTitle>
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
          <CardTitle>행동-성과 인과관계 분석</CardTitle>
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
          <CardTitle>행동-성과 인과관계 분석</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>행동-성과 인과관계 분석</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              행동 지표(파란선)가 상승하면, 약 2주 후 매출(초록선)이 따라 오르는 패턴을 보입니다.
            </p>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>행동 품질 (Behavior)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span>성과/매출 (Outcome)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                yAxisId="behavior"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '행동 품질', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="outcome"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '성과', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('ko-KR');
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}점`,
                  name === 'behavior' ? '행동 품질' : '성과/매출',
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === 'behavior' ? '행동 품질 (Behavior)' : '성과/매출 (Outcome)'
                }
              />
              {/* Lagging Effect 하이라이트 영역 */}
              {laggingArea && (
                <ReferenceArea
                  x1={chartData[laggingArea.start]?.date}
                  x2={chartData[laggingArea.end]?.date}
                  yAxisId="behavior"
                  fill="rgba(99, 102, 241, 0.1)"
                  stroke="none"
                />
              )}
              {/* 행동 품질 라인 (파란색) */}
              <Line
                yAxisId="behavior"
                type="monotone"
                dataKey="behavior"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="behavior"
              />
              {/* 성과/매출 라인 (초록색, 점선) */}
              <Line
                yAxisId="outcome"
                type="monotone"
                dataKey="outcome"
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                name="outcome"
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Lagging Effect 툴팁 */}
          {laggingArea && (
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900/90 px-3 py-2 text-xs text-white">
              <strong>⚡ Lagging Effect 확인</strong>
              <br />
              행동 점수 상승 2주 후
              <br />
              매출이 급상승했습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

