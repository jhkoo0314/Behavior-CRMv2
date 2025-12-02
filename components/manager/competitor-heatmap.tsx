/**
 * 경쟁사 활동 히트맵 컴포넌트
 * 
 * 지역별, 병원별 경쟁사 활동을 표시합니다.
 * PRD 4.3.4 참고: 경쟁사 활동 히트맵
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompetitorSignals } from '@/actions/competitor-signals/get-competitor-signals';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { CompetitorSignal } from '@/types/database.types';
import type { Account } from '@/types/database.types';

interface CompetitorActivity {
  competitorName: string;
  accountId: string;
  accountName: string;
  activityCount: number;
  latestActivityDate: string | null;
}

export function CompetitorHeatmap() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<CompetitorActivity[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('CompetitorHeatmap: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // 경쟁사 신호 조회
        const signalsResult = await getCompetitorSignals({
          startDate: start,
          endDate: end,
        });

        console.log('조회된 경쟁사 신호 수:', signalsResult.data.length);

        // 모든 계정 조회 (병원명 매핑용)
        const accountsResult = await getAccounts({});
        const accountMap = new Map<string, Account>();
        for (const account of accountsResult.data) {
          accountMap.set(account.id, account);
        }

        // 경쟁사별, 병원별로 그룹화
        const activityMap = new Map<string, CompetitorActivity>();

        for (const signal of signalsResult.data) {
          const account = accountMap.get(signal.account_id);
          if (!account) continue;

          const key = `${signal.competitor_name}_${signal.account_id}`;
          const existing = activityMap.get(key);

          if (existing) {
            existing.activityCount += 1;
            if (
              !existing.latestActivityDate ||
              new Date(signal.detected_at) > new Date(existing.latestActivityDate)
            ) {
              existing.latestActivityDate = signal.detected_at;
            }
          } else {
            activityMap.set(key, {
              competitorName: signal.competitor_name,
              accountId: signal.account_id,
              accountName: account.name,
              activityCount: 1,
              latestActivityDate: signal.detected_at,
            });
          }
        }

        // 활동량이 많은 순으로 정렬
        const sorted = Array.from(activityMap.values()).sort(
          (a, b) => b.activityCount - a.activityCount
        );

        console.log('경쟁사 활동 리스트:', sorted);
        setActivities(sorted);
      } catch (err) {
        console.error('경쟁사 활동 히트맵 데이터 조회 실패:', err);
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
          <CardTitle>경쟁사 활동 히트맵</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle>경쟁사 활동 히트맵</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  // 경쟁사별로 그룹화
  const competitorMap = new Map<string, CompetitorActivity[]>();
  for (const activity of activities) {
    if (!competitorMap.has(activity.competitorName)) {
      competitorMap.set(activity.competitorName, []);
    }
    competitorMap.get(activity.competitorName)!.push(activity);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>경쟁사 활동 히트맵</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            경쟁사 활동이 없습니다.
          </p>
        ) : (
          <div className="space-y-6">
            {Array.from(competitorMap.entries()).map(([competitorName, competitorActivities]) => (
              <div key={competitorName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{competitorName}</h3>
                  <Badge variant="outline">{competitorActivities.length}개 병원</Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {competitorActivities.map((activity) => (
                    <div
                      key={`${activity.competitorName}_${activity.accountId}`}
                      className="rounded-lg border p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{activity.accountName}</span>
                        <Badge variant="secondary">{activity.activityCount}건</Badge>
                      </div>
                      {activity.latestActivityDate && (
                        <p className="text-xs text-muted-foreground">
                          최근: {new Date(activity.latestActivityDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



