/**
 * 메인 대시보드 페이지
 * 
 * PRD 4.1 참고: Behavior Quality Score, Outcome Layer 지표, Behavior-Outcome 관계 지도
 * 
 * 모든 차트는 클라이언트 렌더링 기반으로 구현됩니다.
 */

'use client';

import { Suspense } from 'react';
import { BehaviorQualityChart } from '@/components/dashboard/behavior-quality-chart';
import { OutcomeStatCards } from '@/components/dashboard/outcome-stat-cards';
import { BehaviorOutcomeMap } from '@/components/dashboard/behavior-outcome-map';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          현재 나의 행동 품질과 성과 수준을 한눈에 확인하세요.
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        {/* Outcome Layer 핵심지표 카드 */}
        <OutcomeStatCards />

        {/* Behavior Quality Score 차트 */}
        <BehaviorQualityChart />

        {/* Behavior-Outcome 관계 지도 */}
        <BehaviorOutcomeMap />
      </Suspense>
    </div>
  );
}

