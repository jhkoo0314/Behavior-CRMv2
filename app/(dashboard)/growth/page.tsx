/**
 * 성장 맵 페이지
 * 
 * PRD 4.3 참고: 행동 품질 트렌드, Outcome Layer 변화, 성장 추천 액션
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 차트 컴포넌트 동적 import (코드 스플리팅)
const BehaviorTrendChart = dynamic(
  () => import('@/components/growth/behavior-trend-chart').then((mod) => ({ default: mod.BehaviorTrendChart })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const OutcomeTrendChart = dynamic(
  () => import('@/components/growth/outcome-trend-chart').then((mod) => ({ default: mod.OutcomeTrendChart })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const NextBestAction = dynamic(
  () => import('@/components/recommendations/next-best-action').then((mod) => ({ default: mod.NextBestAction })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
);

export default function GrowthPage() {
  return (
    <div className="min-w-0 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">성장 맵</h1>
        <p className="text-muted-foreground">
          나의 행동 품질과 성과 변화를 추적하고 성장 방향을 확인하세요.
        </p>
      </div>

      {/* 행동 품질 트렌드 차트 */}
      <BehaviorTrendChart />

      {/* Outcome Layer 변화 차트 */}
      <OutcomeTrendChart />

      {/* 성장 추천 액션 */}
      <NextBestAction />
    </div>
  );
}

