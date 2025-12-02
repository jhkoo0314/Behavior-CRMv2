/**
 * Team Balance Radar 컴포넌트
 *
 * 팀 전체의 HIR, RTR, BCR, PHR 지표를 레이더 차트로 표시
 * Recharts RadarChart 사용
 */

'use client';

import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { calculateRTR } from '@/lib/analytics/calculate-rtr';
import { calculateBCR } from '@/lib/analytics/calculate-bcr';
import { calculatePHR } from '@/lib/analytics/calculate-phr';
import { calculatePeriod } from '@/lib/utils/chart-data';

interface RadarData {
  metric: string;
  value: number;
  fullMark: number;
}

export function TeamBalanceRadar() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [insight, setInsight] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      console.group('TeamBalanceRadar: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 팀원 목록 조회
        const teamMembersResult = await getTeamMembers({});
        console.log('조회된 팀원 수:', teamMembersResult.data.length);

        if (teamMembersResult.data.length === 0) {
          setRadarData([
            { metric: 'HIR', value: 0, fullMark: 100 },
            { metric: 'RTR', value: 0, fullMark: 100 },
            { metric: 'BCR', value: 0, fullMark: 100 },
            { metric: 'PHR', value: 0, fullMark: 100 },
          ]);
          setInsight('팀원이 없습니다.');
          setIsLoading(false);
          console.groupEnd();
          return;
        }

        const { start, end } = calculatePeriod(30);

        // 각 팀원의 지표 계산하여 평균 계산
        let totalHir = 0;
        let totalRtr = 0;
        let totalBcr = 0;
        let totalPhr = 0;
        let memberCount = 0;

        for (const member of teamMembersResult.data) {
          if (!member.id) continue;

          try {
            const [hir, rtr, bcr, phr] = await Promise.all([
              calculateHIR(member.id, start, end),
              calculateRTR(member.id, start, end),
              calculateBCR(member.id, start, end),
              calculatePHR(member.id, start, end),
            ]);

            totalHir += hir;
            totalRtr += rtr;
            totalBcr += bcr;
            totalPhr += phr;
            memberCount += 1;
          } catch (err) {
            console.error(`팀원 ${member.name} 지표 계산 실패:`, err);
            // 개별 팀원 오류는 무시하고 계속 진행
          }
        }

        // 평균 계산
        const avgHir = memberCount > 0 ? Math.round(totalHir / memberCount) : 0;
        const avgRtr = memberCount > 0 ? Math.round(totalRtr / memberCount) : 0;
        const avgBcr = memberCount > 0 ? Math.round(totalBcr / memberCount) : 0;
        const avgPhr = memberCount > 0 ? Math.round(totalPhr / memberCount) : 0;

        const data: RadarData[] = [
          { metric: `HIR (${avgHir})`, value: avgHir, fullMark: 100 },
          { metric: `RTR (${avgRtr})`, value: avgRtr, fullMark: 100 },
          { metric: `BCR (${avgBcr})`, value: avgBcr, fullMark: 100 },
          { metric: `PHR (${avgPhr})`, value: avgPhr, fullMark: 100 },
        ];

        // Insight 생성: 가장 낮은 지표 찾기
        const metrics = [
          { name: 'HIR', value: avgHir },
          { name: 'RTR', value: avgRtr },
          { name: 'BCR', value: avgBcr },
          { name: 'PHR', value: avgPhr },
        ];
        const lowestMetric = metrics.reduce((min, m) => (m.value < min.value ? m : min));

        let insightText = '';
        if (lowestMetric.value < 60) {
          if (lowestMetric.name === 'PHR') {
            insightText =
              '💡 Insight: PHR(파이프라인 관리) 점수가 가장 낮습니다. 팀원들에게 "다음 행동 예정일" 입력을 독려하세요.';
          } else if (lowestMetric.name === 'RTR') {
            insightText =
              '💡 Insight: RTR(관계 온도) 점수가 가장 낮습니다. 팀원들의 병원 방문 빈도와 관계 관리에 집중하세요.';
          } else if (lowestMetric.name === 'BCR') {
            insightText =
              '💡 Insight: BCR(행동 일관성) 점수가 가장 낮습니다. 팀원들의 루틴 형성을 지원하세요.';
          } else {
            insightText =
              '💡 Insight: HIR(정직입력) 점수가 가장 낮습니다. 팀원들의 활동 기록 품질을 개선하세요.';
          }
        } else {
          insightText = '💡 Insight: 모든 지표가 균형있게 유지되고 있습니다. 팀의 행동 품질이 우수합니다.';
        }

        console.log('레이더 차트 데이터:', data);
        console.log('Insight:', insightText);

        setRadarData(data);
        setInsight(insightText);
      } catch (err) {
        console.error('Team Balance Radar 조회 실패:', err);
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
          <CardTitle className="text-base font-bold">Team Balance</CardTitle>
          <p className="text-xs text-slate-500 mt-1">팀 행동 지표의 균형 상태</p>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Team Balance</CardTitle>
          <p className="text-xs text-slate-500 mt-1">팀 행동 지표의 균형 상태</p>
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
        <CardTitle className="text-base font-bold">Team Balance</CardTitle>
        <p className="text-xs text-slate-500 mt-1">팀 행동 지표의 균형 상태</p>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="팀 평균"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {insight && (
          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 mt-4">
            {insight}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

