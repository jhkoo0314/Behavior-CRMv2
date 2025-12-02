/**
 * 분석 페이지
 * 
 * PRD 4.2 참고: HIR ↔ 성장률 상관도, 고객 세분화, 활동 볼륨 × 품질 Matrix, 처방 기반 성과 Funnel
 * 
 * 모든 차트는 클라이언트 렌더링 기반으로 구현됩니다.
 */

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 차트 컴포넌트 동적 import (코드 스플리팅)
const HirGrowthScatter = dynamic(
  () => import('@/components/analysis/hir-growth-scatter').then((mod) => ({ default: mod.HirGrowthScatter })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const CustomerSegmentation = dynamic(
  () => import('@/components/analysis/customer-segmentation').then((mod) => ({ default: mod.CustomerSegmentation })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const VolumeQualityHeatmap = dynamic(
  () => import('@/components/analysis/volume-quality-heatmap').then((mod) => ({ default: mod.VolumeQualityHeatmap })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const PrescriptionFunnel = dynamic(
  () => import('@/components/analysis/prescription-funnel').then((mod) => ({ default: mod.PrescriptionFunnel })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <div className="min-w-0 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">분석</h1>
        <p className="text-muted-foreground">
          왜 이런 성과가 나왔는지 분석합니다.
        </p>
      </div>

      <Suspense fallback={<AnalysisSkeleton />}>
        {/* HIR ↔ 성장률 상관도 차트 */}
        <HirGrowthScatter />

        {/* 고객 세분화 및 HIR 비교 */}
        <CustomerSegmentation />

        {/* 활동 볼륨 × 품질 Matrix */}
        <VolumeQualityHeatmap />

        {/* 처방 기반 성과 Funnel Chart */}
        <PrescriptionFunnel />
      </Suspense>
    </div>
  );
}

