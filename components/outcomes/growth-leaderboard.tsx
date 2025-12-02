/**
 * 성장 기여 병원 리더보드 컴포넌트
 * 
 * 병원별 매출 성장률 Top N을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getGrowthLeaders } from '@/actions/outcomes/get-growth-leaders';
import { formatNumber, formatPercent } from '@/lib/utils/chart-data';
import { Trophy } from 'lucide-react';
import type { GrowthLeader } from '@/actions/outcomes/get-growth-leaders';

export function GrowthLeaderboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [leaders, setLeaders] = useState<GrowthLeader[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('GrowthLeaderboard: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const growthLeaders = await getGrowthLeaders({ limit: 3 });
        console.log('성장 리더보드:', growthLeaders);
        setLeaders(growthLeaders);
      } catch (err) {
        console.error('성장 리더보드 조회 실패:', err);
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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            성장 기여 병원 (Top Growth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="text-right">
                  <Skeleton className="mb-1 h-4 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            성장 기여 병원 (Top Growth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (leaders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            성장 기여 병원 (Top Growth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          성장 기여 병원 (Top Growth)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const isPositive = leader.growthRate > 0;
            const isNegative = leader.growthRate < 0 && !leader.isNew;
            const opacity = index === leaders.length - 1 ? 0.6 : 1;

            return (
              <div
                key={leader.accountId}
                className="flex items-center justify-between border-b border-muted pb-3 last:border-0"
                style={{ opacity }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{leader.accountName}</span>
                  {leader.accountDescription && (
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {leader.accountDescription}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">₩ {formatNumber(leader.currentRevenue / 1000000, 1)}M</div>
                  <div
                    className={`mt-0.5 text-xs font-semibold ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : isNegative
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {leader.isNew ? (
                      <span>▲ New</span>
                    ) : isPositive ? (
                      <span>▲ {formatPercent(leader.growthRate, 0)}</span>
                    ) : (
                      <span>▼ {formatPercent(Math.abs(leader.growthRate), 0)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

