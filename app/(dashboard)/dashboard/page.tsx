/**
 * 메인 대시보드 페이지
 * 
 * PRD 4.1 참고: Behavior Quality Score, Outcome Layer 지표, Behavior-Outcome 관계 지도
 * 현재는 UI 구조만 준비하고, 실제 데이터 표시는 스프린트 2부터 구현
 */

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          현재 나의 행동 품질과 성과 수준을 한눈에 확인하세요.
        </p>
      </div>

      {/* Behavior Quality Score 차트 영역 (임시) */}
      <ChartWrapper
        title="Behavior Quality Score"
        description="최근 7일 또는 30일 기준 행동 품질 점수"
        isEmpty={true}
        emptyMessage="데이터가 없습니다. 활동을 기록하면 차트가 표시됩니다."
      >
        {/* RadarChart는 스프린트 2에서 구현 */}
      </ChartWrapper>

      {/* Outcome Layer 핵심지표 카드 영역 (임시) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HIR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">데이터 없음</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전환률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">데이터 없음</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">필드 성장률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">데이터 없음</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처방 기반 성과지수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">데이터 없음</p>
          </CardContent>
        </Card>
      </div>

      {/* Behavior-Outcome 관계 지도 영역 (임시) */}
      <ChartWrapper
        title="Behavior-Outcome 관계 지도"
        description="어떤 행동이 성과에 가장 큰 영향을 미치는지 시각화"
        isEmpty={true}
        emptyMessage="데이터가 없습니다. 활동을 기록하면 관계 지도가 표시됩니다."
      >
        {/* Chord Diagram 또는 Weighted Tree Map은 스프린트 2에서 구현 */}
      </ChartWrapper>
    </div>
  );
}

