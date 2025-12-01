/**
 * 메인 대시보드 페이지
 * 
 * PRD 4.1 참고: Behavior Quality Score, Outcome Layer 지표, Behavior-Outcome 관계 지도
 * 
 * 모든 차트는 클라이언트 렌더링 기반으로 구현됩니다.
 */

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { SampleDataGenerator } from '@/components/dashboard/sample-data-generator';

// 차트 컴포넌트 동적 import (코드 스플리팅)
const BehaviorQualityChart = dynamic(
  () => import('@/components/dashboard/behavior-quality-chart').then((mod) => ({ default: mod.BehaviorQualityChart })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const OutcomeStatCards = dynamic(
  () => import('@/components/dashboard/outcome-stat-cards').then((mod) => ({ default: mod.OutcomeStatCards })),
  { ssr: false, loading: () => <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div> }
);

const BehaviorOutcomeMap = dynamic(
  () => import('@/components/dashboard/behavior-outcome-map').then((mod) => ({ default: mod.BehaviorOutcomeMap })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

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

      {/* 샘플 데이터 생성기 */}
      <SampleDataGenerator />

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

