/**
 * Team KPI Row 컴포넌트
 *
 * 팀 전체 KPI를 4개의 카드로 표시
 * - Team Behavior Score
 * - Avg. HIR (정직입력)
 * - Active Pipeline
 * - Team Goal Forecast
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/chart-data';
import { mockTeamKPIs } from '@/lib/mock/manager-mock-data';
import type { TeamKPIs } from '@/actions/manager/get-team-kpis';

interface KPICardProps {
  title: string;
  value: string | number;
  trend: {
    value: number;
    label: string;
    type: 'up' | 'down' | 'warning';
  };
  valueColor?: string;
}

function KPICard({ title, value, trend, valueColor }: KPICardProps) {
  const trendColor =
    trend.type === 'up'
      ? 'text-emerald-500'
      : trend.type === 'down'
        ? 'text-red-500'
        : 'text-amber-500';

  const trendIcon = trend.type === 'up' ? '▲' : trend.type === 'down' ? '▼' : '●';

  return (
    <Card className="p-6 flex flex-col">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {title}
      </div>
      <div className={`text-3xl font-extrabold mb-2 ${valueColor || 'text-slate-800'}`}>
        {value}
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${trendColor}`}>
        <span>{trendIcon}</span>
        <span>{trend.label}</span>
      </div>
    </Card>
  );
}

export function TeamKpiRow() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [kpis, setKpis] = useState<TeamKPIs | null>(null);

  useEffect(() => {
    console.group('TeamKpiRow: Mock 데이터 로드 시작');
    setIsLoading(true);
    setError(null);

    try {
      // 공통 Mock 데이터 사용
      console.log('로드된 Mock KPI 데이터:', mockTeamKPIs);
      setKpis(mockTeamKPIs);
    } catch (err) {
      console.error('Mock 데이터 로드 실패:', err);
      setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </Card>
      </div>
    );
  }

  // 트렌드 라벨 생성
  const behaviorScoreTrend = {
    value: kpis.behaviorScore.change,
    label:
      kpis.behaviorScore.change > 0
        ? `전월 대비 ${Math.abs(kpis.behaviorScore.change)}점 상승`
        : kpis.behaviorScore.change < 0
          ? `전월 대비 ${Math.abs(kpis.behaviorScore.change)}점 하락`
          : '전월과 동일',
    type: kpis.behaviorScore.change > 0 ? ('up' as const) : kpis.behaviorScore.change < 0 ? ('down' as const) : ('warning' as const),
  };

  const hirTrend = {
    value: kpis.avgHir.change,
    label:
      kpis.avgHir.current >= 90
        ? '신뢰도 매우 높음'
        : kpis.avgHir.current >= 70
          ? '신뢰도 높음'
          : '신뢰도 개선 필요',
    type: kpis.avgHir.current >= 70 ? ('up' as const) : ('down' as const),
  };

  const pipelineTrend = {
    value: kpis.activePipeline.change,
    label: kpis.activePipeline.change < 0 ? 'PHR 관리 필요' : '정상',
    type: kpis.activePipeline.change < 0 ? ('down' as const) : ('up' as const),
  };

  const goalTrend = {
    value: kpis.goalForecast.change,
    label:
      kpis.goalForecast.current >= 100
        ? '목표 달성'
        : kpis.goalForecast.current >= 90
          ? '목표 달성 임박'
          : '목표 달성 필요',
    type: kpis.goalForecast.current >= 90 ? ('warning' as const) : kpis.goalForecast.current >= 100 ? ('up' as const) : ('down' as const),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <KPICard
        title="Team Behavior Score"
        value={`${kpis.behaviorScore.current}점`}
        trend={behaviorScoreTrend}
        valueColor="text-indigo-500"
      />
      <KPICard
        title="Avg. HIR (정직입력)"
        value={`${kpis.avgHir.current}%`}
        trend={hirTrend}
      />
      <KPICard
        title="Active Pipeline"
        value={`₩ ${formatNumber(kpis.activePipeline.current / 1000000, 1)}B`}
        trend={pipelineTrend}
      />
      <KPICard
        title="Team Goal Forecast"
        value={`${kpis.goalForecast.current}%`}
        trend={goalTrend}
      />
    </div>
  );
}

