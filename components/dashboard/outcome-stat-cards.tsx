/**
 * Outcome Layer 핵심지표 Stat Cards 컴포넌트
 * 
 * HIR, 전환률, 필드 성장률, 처방지수를 카드 형태로 표시합니다.
 * 각 카드에는 Sparkline과 전일/전주/전월 대비 변화율이 포함됩니다.
 * PRD 4.1.2 참고: Outcome Layer 핵심지표 카드
 */

'use client';

import { useState, useEffect } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOutcomes } from '@/actions/outcomes/get-outcomes';
import type { Outcome } from '@/types/database.types';
import { calculatePeriod, calculatePreviousPeriod, createSparklineData, formatPercent, formatNumber } from '@/lib/utils/chart-data';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface OutcomeStat {
  label: string;
  value: number;
  unit: string;
  sparklineData: Array<{ date: Date; value: number }>;
  changePercent: number;
  changeLabel: string;
}

export function OutcomeStatCards() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<{
    hir: OutcomeStat;
    conversion: OutcomeStat;
    growth: OutcomeStat;
    prescription: OutcomeStat;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('OutcomeStatCards: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 최근 7일 데이터 조회
        const { start, end } = calculatePeriod(7);
        const previousPeriod = calculatePreviousPeriod(start, end);

        console.log('현재 기간:', start, '~', end);
        console.log('이전 기간:', previousPeriod.start, '~', previousPeriod.end);

        const [currentData, previousData] = await Promise.all([
          getOutcomes({
            periodStart: start,
            periodEnd: end,
            periodType: 'daily',
          }),
          getOutcomes({
            periodStart: previousPeriod.start,
            periodEnd: previousPeriod.end,
            periodType: 'daily',
          }),
        ]);

        console.log('현재 기간 Outcome 수:', currentData.data.length);
        console.log('이전 기간 Outcome 수:', previousData.data.length);

        // 최신 Outcome 값 (전체 통계, account_id가 null인 것)
        const latestCurrent = currentData.data.find((o) => o.account_id === null) || currentData.data[0];
        const latestPrevious = previousData.data.find((o) => o.account_id === null) || previousData.data[0];

        // Sparkline 데이터 생성 (일별 데이터)
        const currentDaily = currentData.data
          .filter((o) => o.account_id === null)
          .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
          .map((o) => ({
            date: new Date(o.period_start),
            value: o.hir_score,
          }));

        const conversionDaily = currentData.data
          .filter((o) => o.account_id === null)
          .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
          .map((o) => ({
            date: new Date(o.period_start),
            value: o.conversion_rate,
          }));

        const growthDaily = currentData.data
          .filter((o) => o.account_id === null)
          .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
          .map((o) => ({
            date: new Date(o.period_start),
            value: o.field_growth_rate,
          }));

        const prescriptionDaily = currentData.data
          .filter((o) => o.account_id === null)
          .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
          .map((o) => ({
            date: new Date(o.period_start),
            value: o.prescription_index,
          }));

        // 변화율 계산
        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const hirChange = latestCurrent && latestPrevious
          ? calculateChange(latestCurrent.hir_score, latestPrevious.hir_score)
          : 0;

        const conversionChange = latestCurrent && latestPrevious
          ? calculateChange(latestCurrent.conversion_rate, latestPrevious.conversion_rate)
          : 0;

        const growthChange = latestCurrent && latestPrevious
          ? calculateChange(latestCurrent.field_growth_rate, latestPrevious.field_growth_rate)
          : 0;

        const prescriptionChange = latestCurrent && latestPrevious
          ? calculateChange(latestCurrent.prescription_index, latestPrevious.prescription_index)
          : 0;

        setStats({
          hir: {
            label: 'HIR',
            value: latestCurrent?.hir_score || 0,
            unit: '',
            sparklineData: currentDaily,
            changePercent: hirChange,
            changeLabel: '전주 대비',
          },
          conversion: {
            label: '전환률',
            value: latestCurrent?.conversion_rate || 0,
            unit: '%',
            sparklineData: conversionDaily,
            changePercent: conversionChange,
            changeLabel: '전주 대비',
          },
          growth: {
            label: '필드 성장률',
            value: latestCurrent?.field_growth_rate || 0,
            unit: '%',
            sparklineData: growthDaily,
            changePercent: growthChange,
            changeLabel: '전주 대비',
          },
          prescription: {
            label: '처방 기반 성과지수',
            value: latestCurrent?.prescription_index || 0,
            unit: '',
            sparklineData: prescriptionDaily,
            changePercent: prescriptionChange,
            changeLabel: '전주 대비',
          },
        });

        console.log('Stat Cards 데이터 설정 완료');
      } catch (err) {
        console.error('Outcome 조회 실패:', err);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatCard = ({ stat }: { stat: OutcomeStat }) => {
    const sparkline = createSparklineData(stat.sparklineData);
    const isPositive = stat.changePercent > 0;
    const isNegative = stat.changePercent < 0;
    const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stat.value, stat.unit === '%' ? 1 : 0)}
            {stat.unit && <span className="ml-1 text-base font-normal text-muted-foreground">{stat.unit}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
              <ChangeIcon className="h-3 w-3" />
              <span>{formatPercent(Math.abs(stat.changePercent))}</span>
            </div>
            <span className="text-muted-foreground">{stat.changeLabel}</span>
          </div>
          {/* Sparkline */}
          {sparkline.data.length > 0 && (
            <div className="mt-4 h-[40px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline.data}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Tooltip
                    contentStyle={{ display: 'none' }}
                    cursor={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard stat={stats.hir} />
      <StatCard stat={stats.conversion} />
      <StatCard stat={stats.growth} />
      <StatCard stat={stats.prescription} />
    </div>
  );
}
