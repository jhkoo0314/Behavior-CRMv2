/**
 * 메인 대시보드 페이지 v2
 *
 * Bento Box 스타일의 그리드 레이아웃으로 구성된 새로운 대시보드입니다.
 *
 * 레이아웃 구조:
 * - 왼쪽: 프로필 카드 (ProfileCard) - grid-row: span 2
 * - 중간: 레이더 차트 (BehaviorRadarChart) - grid-row: span 2
 * - 오른쪽: 액션 큐 (ActionQueue) - grid-row: span 2
 * - 하단: 스캐터 차트 (BehaviorOutcomeScatter) - grid-column: span 3
 */

"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { BehaviorRadarChart } from "@/components/dashboard/behavior-radar-chart";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { BehaviorOutcomeScatter } from "@/components/dashboard/behavior-outcome-scatter";

function DashboardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      style={{ gridAutoRows: "minmax(250px, auto)" }}
    >
      {/* 프로필 카드 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[450px]" />
      </div>
      {/* 레이더 차트 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[450px]" />
      </div>
      {/* 액션 큐 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[450px]" />
      </div>
      {/* 스캐터 차트 스켈레톤 */}
      <div className="md:col-span-2 lg:col-span-3">
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-w-0 w-full max-w-[1200px] mx-auto px-5 pt-1 pb-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Action Hub</h1>
        <p className="text-muted-foreground mt-1">행동 데이터 기반 대시보드</p>
      </div>

      {/* 메인 그리드 */}
      <Suspense fallback={<DashboardSkeleton />}>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ gridAutoRows: "minmax(250px, auto)" }}
        >
          {/* 왼쪽: 프로필 카드 */}
          <div className="lg:row-span-2">
            <ProfileCard />
          </div>

          {/* 중간: 레이더 차트 */}
          <div className="lg:row-span-2">
            <BehaviorRadarChart />
          </div>

          {/* 오른쪽: 액션 큐 */}
          <div className="lg:row-span-2">
            <ActionQueue />
          </div>

          {/* 하단: 스캐터 차트 */}
          <div className="md:col-span-2 lg:col-span-3">
            <BehaviorOutcomeScatter />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
