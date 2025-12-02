/**
 * AI 마감 예측 KPI 카드 컴포넌트
 * 
 * 현재 행동 점수를 기반으로 한 예상 마감 금액을 표시합니다.
 * 현재는 UI만 표시 (고정값).
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRevenueStats } from '@/actions/outcomes/get-revenue-stats';
import { formatNumber } from '@/lib/utils/chart-data';
import { Sparkles } from 'lucide-react';

export function PredictionKpiCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [predictedAmount, setPredictedAmount] = useState<number | null>(null);
  const [goalAmount, setGoalAmount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('PredictionKpiCard: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const revenueStats = await getRevenueStats();
        // 예측 금액 = 목표 금액의 101% (고정값, 추후 실제 예측 로직으로 교체)
        const predicted = Math.round(revenueStats.goalAmount * 1.01);
        console.log('예측 마감 금액:', predicted);
        setPredictedAmount(predicted);
        setGoalAmount(revenueStats.goalAmount);
      } catch (err) {
        console.error('예측 데이터 조회 실패:', err);
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
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32 bg-slate-700" />
          <Skeleton className="h-4 w-16 bg-slate-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-8 w-40 bg-slate-700" />
          <Skeleton className="h-6 w-48 bg-slate-700" />
        </CardContent>
      </Card>
    );
  }

  if (error || predictedAmount === null || goalAmount === null) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold opacity-80">
            ✨ AI 마감 예측
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-70">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const achievementRate = Math.round((predictedAmount / goalAmount) * 100);
  const isAboveGoal = achievementRate >= 100;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold opacity-80">
          ✨ AI 마감 예측
        </CardTitle>
        <span className="text-xs font-semibold opacity-70">신뢰도 92%</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold">₩ {formatNumber(predictedAmount)}</div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs font-bold">
            {isAboveGoal && <span>▲</span>}
            목표 {achievementRate}% 달성 예상
          </span>
        </div>
        <p className="mt-3 text-xs opacity-70">
          * 현재 행동 점수(Total 82점) 유지 시 예상치입니다.
        </p>
      </CardContent>
    </Card>
  );
}

