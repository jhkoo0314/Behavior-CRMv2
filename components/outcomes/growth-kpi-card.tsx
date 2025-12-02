/**
 * 전년 대비 성장 KPI 카드 컴포넌트
 * 
 * YoY 성장률을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRevenueStats } from '@/actions/outcomes/get-revenue-stats';
import { formatPercent } from '@/lib/utils/chart-data';
import { ArrowUp } from 'lucide-react';

export function GrowthKpiCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [growthRate, setGrowthRate] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('GrowthKpiCard: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const revenueStats = await getRevenueStats();
        console.log('YoY 성장률:', revenueStats.yearOverYearGrowth);
        setGrowthRate(revenueStats.yearOverYearGrowth);
      } catch (err) {
        console.error('성장률 조회 실패:', err);
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
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-8 w-24" />
          <Skeleton className="h-6 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (error || growthRate === null) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            전년 대비 성장 (YoY)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = growthRate > 0;
  const displayRate = Math.abs(growthRate);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          전년 대비 성장 (YoY)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold">
          {isPositive ? '+' : ''}
          {formatPercent(growthRate, 1)}
        </div>
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
              isPositive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {isPositive && <ArrowUp className="h-3 w-3" />}
            업계 평균 대비 {displayRate > 5 ? '5%' : '0%'} 상회
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

