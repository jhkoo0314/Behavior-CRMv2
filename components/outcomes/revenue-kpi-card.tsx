/**
 * 매출 달성액 KPI 카드 컴포넌트
 * 
 * 총 매출, 목표 대비 달성률, 목표까지 남은 금액을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRevenueStats } from '@/actions/outcomes/get-revenue-stats';
import { formatNumber } from '@/lib/utils/chart-data';
import type { RevenueStats } from '@/actions/outcomes/get-revenue-stats';

export function RevenueKpiCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<RevenueStats | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('RevenueKpiCard: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const revenueStats = await getRevenueStats();
        console.log('매출 통계:', revenueStats);
        setStats(revenueStats);
      } catch (err) {
        console.error('매출 통계 조회 실패:', err);
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="mt-3 h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            매출 달성액 (Revenue)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const achievementRate = Math.round(stats.achievementRate);
  const progressWidth = Math.min(100, achievementRate);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          매출 달성액 (Revenue)
        </CardTitle>
        <span className="text-xs font-semibold text-muted-foreground">🎯 {achievementRate}%</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold">₩ {formatNumber(stats.totalRevenue)}</div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-1000"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          목표까지 <strong className="font-semibold text-foreground">₩ {formatNumber(stats.remainingAmount)}</strong> 남음
        </div>
      </CardContent>
    </Card>
  );
}

