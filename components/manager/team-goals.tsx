/**
 * 팀 목표 달성 현황 컴포넌트
 * 
 * 팀 전체 목표 vs 실제 달성도를 비교합니다.
 * PRD 4.3.5 참고: 팀 목표 달성 현황
 * 
 * 참고: 목표 데이터는 향후 구현 예정이므로 현재는 임시 데이터 사용
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { getOutcomesByUser } from '@/actions/outcomes/get-outcomes-by-user';
import { getUserIdByClerkId } from '@/lib/supabase/get-user-id';
import { calculatePeriod } from '@/lib/utils/chart-data';
import { formatPercent } from '@/lib/utils/chart-data';

interface GoalProgress {
  metric: string;
  current: number;
  target: number;
  progress: number; // 0-100
}

export function TeamGoals() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [goals, setGoals] = useState<GoalProgress[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('TeamGoals: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 팀원 목록 조회
        const teamMembersResult = await getTeamMembers({});
        console.log('조회된 팀원 수:', teamMembersResult.data.length);

        const { start, end } = calculatePeriod(30);

        // 각 팀원의 Outcome 조회하여 평균 계산
        let totalHir = 0;
        let totalConversion = 0;
        let totalGrowth = 0;
        let totalPrescription = 0;
        let memberCount = 0;

        for (const member of teamMembersResult.data) {
          const userUuid = await getUserIdByClerkId(member.clerk_id);
          if (!userUuid) continue;

          // 각 팀원의 Outcome 조회
          const outcomesResult = await getOutcomesByUser({
            userId: userUuid,
            periodStart: start,
            periodEnd: end,
            periodType: 'daily',
          });

          if (outcomesResult.data.length > 0) {
            const latest = outcomesResult.data.find((o) => o.account_id === null) || outcomesResult.data[0];
            totalHir += latest.hir_score;
            totalConversion += latest.conversion_rate;
            totalGrowth += latest.field_growth_rate;
            totalPrescription += latest.prescription_index;
            memberCount += 1;
          }
        }

        // 평균 계산
        const avgHir = memberCount > 0 ? totalHir / memberCount : 0;
        const avgConversion = memberCount > 0 ? totalConversion / memberCount : 0;
        const avgGrowth = memberCount > 0 ? totalGrowth / memberCount : 0;
        const avgPrescription = memberCount > 0 ? totalPrescription / memberCount : 0;

        // 임시 목표값 (향후 실제 목표 데이터로 교체)
        const targetHir = 70;
        const targetConversion = 25;
        const targetGrowth = 15;
        const targetPrescription = 80;

        const goalsData: GoalProgress[] = [
          {
            metric: '평균 HIR',
            current: Math.round(avgHir * 10) / 10,
            target: targetHir,
            progress: Math.min((avgHir / targetHir) * 100, 100),
          },
          {
            metric: '평균 전환률',
            current: Math.round(avgConversion * 10) / 10,
            target: targetConversion,
            progress: Math.min((avgConversion / targetConversion) * 100, 100),
          },
          {
            metric: '평균 필드 성장률',
            current: Math.round(avgGrowth * 10) / 10,
            target: targetGrowth,
            progress: Math.min((avgGrowth / targetGrowth) * 100, 100),
          },
          {
            metric: '평균 처방지수',
            current: Math.round(avgPrescription * 10) / 10,
            target: targetPrescription,
            progress: Math.min((avgPrescription / targetPrescription) * 100, 100),
          },
        ];

        console.log('팀 목표 달성 현황:', goalsData);
        setGoals(goalsData);
      } catch (err) {
        console.error('팀 목표 달성 현황 데이터 조회 실패:', err);
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
          <CardTitle>팀 목표 달성 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <CardTitle>팀 목표 달성 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>팀 목표 달성 현황</CardTitle>
        <p className="text-sm text-muted-foreground">
          최근 30일 기준 팀 전체 평균 지표
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {goals.map((goal) => (
            <div key={goal.metric} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{goal.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {goal.current} / {goal.target}
                  </span>
                  <span
                    className={`font-semibold ${
                      goal.progress >= 100
                        ? 'text-green-600'
                        : goal.progress >= 80
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatPercent(goal.progress)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    goal.progress >= 100
                      ? 'bg-green-600'
                      : goal.progress >= 80
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

