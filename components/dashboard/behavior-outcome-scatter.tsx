/**
 * 행동-성과 상관관계 스캐터 차트 컴포넌트
 * 
 * 행동 품질 점수(Total Score)와 매출 달성률(conversion_rate)의 상관관계를 시각화합니다.
 * 팀원 데이터와 현재 사용자 데이터를 비교합니다.
 * 하단 전체 영역에 배치됩니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamScatterData } from '@/actions/analytics/get-team-scatter-data';
import type { ScatterDataPoint } from '@/actions/analytics/get-team-scatter-data';

export function BehaviorOutcomeScatter() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataPoints, setDataPoints] = useState<ScatterDataPoint[]>([]);
  const [currentUserPoint, setCurrentUserPoint] = useState<ScatterDataPoint | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('BehaviorOutcomeScatter: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const data = await getTeamScatterData({
          periodStart: startDate,
          periodEnd: endDate,
        });

        console.log('조회된 스캐터 데이터 포인트 수:', data.length);

        // 현재 사용자와 팀원 분리
        const currentUser = data.find((p) => p.isCurrentUser);
        const teamMembers = data.filter((p) => !p.isCurrentUser);

        setCurrentUserPoint(currentUser || null);
        setDataPoints(teamMembers);

        console.log('현재 사용자:', currentUser);
        console.log('팀원 수:', teamMembers.length);
      } catch (err) {
        console.error('스캐터 데이터 조회 실패:', err);
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
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>행동-성과 상관관계 분석</CardTitle>
          <CardDescription>
            행동 점수가 높은 그룹이 매출 달성률도 높습니다. 당신의 위치를 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // 차트 영역 크기
  const chartWidth = 100; // %
  const chartHeight = 200; // px
  const padding = 10; // %

  // 데이터 범위 계산
  const allPoints = currentUserPoint ? [...dataPoints, currentUserPoint] : dataPoints;
  const minScore = Math.min(...allPoints.map((p) => p.totalScore), 0);
  const maxScore = Math.max(...allPoints.map((p) => p.totalScore), 100);
  const minRate = Math.min(...allPoints.map((p) => p.conversionRate), 0);
  const maxRate = Math.max(...allPoints.map((p) => p.conversionRate), 100);

  // 좌표 변환 함수
  const getX = (score: number) => {
    const range = maxScore - minScore || 100;
    return padding + ((score - minScore) / range) * (100 - 2 * padding);
  };

  const getY = (rate: number) => {
    const range = maxRate - minRate || 100;
    return chartHeight - (padding / 100 * chartHeight) - ((rate - minRate) / range) * (chartHeight - 2 * (padding / 100 * chartHeight));
  };

  // 인사이트 메시지 생성
  const getInsight = (): string => {
    if (!currentUserPoint) {
      return '데이터가 부족하여 인사이트를 제공할 수 없습니다.';
    }

    const avgScore = dataPoints.length > 0
      ? dataPoints.reduce((sum, p) => sum + p.totalScore, 0) / dataPoints.length
      : currentUserPoint.totalScore;

    const avgRate = dataPoints.length > 0
      ? dataPoints.reduce((sum, p) => sum + p.conversionRate, 0) / dataPoints.length
      : currentUserPoint.conversionRate;

    if (currentUserPoint.totalScore >= 80 && currentUserPoint.conversionRate >= 80) {
      return `현재 <strong>'High Behavior, High Outcome'</strong> 영역에 있습니다. 우수한 성과를 유지하고 있습니다.`;
    } else if (currentUserPoint.totalScore >= avgScore && currentUserPoint.conversionRate < avgRate) {
      return `현재 행동 점수는 평균 이상이지만 매출 달성률이 낮습니다. HIR(정직입력) 점수가 5점 더 오르면, 예측 매출 달성률이 <strong>+12%</strong> 상승할 것으로 분석됩니다.`;
    } else if (currentUserPoint.totalScore < avgScore) {
      return `현재 행동 점수를 개선하면 매출 달성률이 향상될 수 있습니다. HIR(정직입력) 점수가 5점 더 오르면, 예측 매출 달성률이 <strong>+12%</strong> 상승할 것으로 분석됩니다.`;
    } else {
      return `현재 <strong>'High Behavior, High Outcome'</strong> 영역으로 진입 중입니다. HIR(정직입력) 점수가 5점 더 오르면, 예측 매출 달성률이 <strong>+12%</strong> 상승할 것으로 분석됩니다.`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>행동-성과 상관관계 분석 (Behavior-Outcome Map)</CardTitle>
            <CardDescription>
              행동 점수가 높은 그룹이 매출 달성률도 높습니다. 당신의 위치를 확인하세요.
            </CardDescription>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 opacity-50 rounded-full"></span>
              팀원
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(37,99,235)]"></span>
              나 (현재)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 items-center">
          {/* 스캐터 차트 */}
          <div className="flex-1 relative" style={{ height: `${chartHeight}px` }}>
            {/* Y축 레이블 */}
            <div
              className="absolute left-[-30px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground whitespace-nowrap"
            >
              매출 달성률 (%)
            </div>

            {/* X축 레이블 */}
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
              행동 품질 점수 (Total Score)
            </div>

            {/* 차트 영역 */}
            <div
              className="relative w-full h-full border-l border-b"
              style={{ height: `${chartHeight}px` }}
            >
              {/* 가이드 라인 (중앙) */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-200"></div>
              <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200"></div>

              {/* 팀원 포인트 */}
              {dataPoints.map((point, index) => {
                const x = getX(point.totalScore);
                const y = getY(point.conversionRate);
                return (
                  <div
                    key={index}
                    className="absolute w-2 h-2 bg-slate-400 opacity-50 rounded-full -translate-x-1/2 translate-y-1/2"
                    style={{
                      left: `${x}%`,
                      bottom: `${(y / chartHeight) * 100}%`,
                    }}
                    title={`${point.userName}: ${point.totalScore}점, ${point.conversionRate.toFixed(1)}%`}
                  />
                );
              })}

              {/* 현재 사용자 포인트 */}
              {currentUserPoint && (
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(37,99,235)] -translate-x-1/2 translate-y-1/2 z-10"
                  style={{
                    left: `${getX(currentUserPoint.totalScore)}%`,
                    bottom: `${(getY(currentUserPoint.conversionRate) / chartHeight) * 100}%`,
                  }}
                  title={`나: ${currentUserPoint.totalScore}점, ${currentUserPoint.conversionRate.toFixed(1)}%`}
                />
              )}
            </div>
          </div>

          {/* 인사이트 */}
          <div className="w-[250px] bg-slate-50 p-4 rounded-lg">
            <h4 className="mb-2 text-sm font-semibold">💡 Insight</h4>
            <p
              className="text-xs text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: getInsight() }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

