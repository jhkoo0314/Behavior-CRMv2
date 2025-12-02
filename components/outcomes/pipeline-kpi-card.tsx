/**
 * 파이프라인 가치 KPI 카드 컴포넌트
 * 
 * 진행 중인 파이프라인의 총 가치와 전환율을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPipelineSummary } from '@/actions/outcomes/get-pipeline-summary';
import { formatNumber, formatPercent } from '@/lib/utils/chart-data';
import { Zap } from 'lucide-react';

export function PipelineKpiCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pipelineValue, setPipelineValue] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('PipelineKpiCard: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const summary = await getPipelineSummary();
        console.log('파이프라인 가치:', summary.totalValue);
        console.log('전환율:', summary.conversionRate);
        setPipelineValue(summary.totalValue);
        setConversionRate(summary.conversionRate);
      } catch (err) {
        console.error('파이프라인 조회 실패:', err);
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

  if (error || pipelineValue === null || conversionRate === null) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            파이프라인 가치
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  // 가치를 M 단위로 변환
  const valueInM = pipelineValue / 1000000;
  const conversionRateRounded = Math.round(conversionRate);
  const isGoodConversion = conversionRate >= 30;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          파이프라인 가치
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold">₩ {formatNumber(valueInM, 1)}M</div>
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
              isGoodConversion
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}
          >
            <Zap className="h-3 w-3" />
            전환율 {conversionRateRounded}% ({isGoodConversion ? 'Good' : 'Normal'})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

