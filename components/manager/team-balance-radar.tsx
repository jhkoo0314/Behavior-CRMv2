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
import { mockTeamAverageMetrics } from '@/lib/mock/manager-mock-data';

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
    console.group('TeamBalanceRadar: Mock 데이터 로드 시작');
    setIsLoading(true);
    setError(null);

    try {
      // 공통 Mock 데이터 사용
      const { hir, rtr, bcr, phr } = mockTeamAverageMetrics;

      const data: RadarData[] = [
        { metric: `HIR (${hir})`, value: hir, fullMark: 100 },
        { metric: `RTR (${rtr})`, value: rtr, fullMark: 100 },
        { metric: `BCR (${bcr})`, value: bcr, fullMark: 100 },
        { metric: `PHR (${phr})`, value: phr, fullMark: 100 },
      ];

      // Insight 생성: 가장 낮은 지표 찾기
      const metrics = [
        { name: 'HIR', value: hir },
        { name: 'RTR', value: rtr },
        { name: 'BCR', value: bcr },
        { name: 'PHR', value: phr },
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
      console.error('Mock 데이터 로드 실패:', err);
      setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
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

