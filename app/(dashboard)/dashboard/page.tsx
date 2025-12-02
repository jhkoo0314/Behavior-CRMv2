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
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 프로필 카드 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[400px]" />
      </div>
      {/* 레이더 차트 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[400px]" />
      </div>
      {/* 액션 큐 스켈레톤 */}
      <div className="lg:row-span-2">
        <Skeleton className="h-full w-full min-h-[400px]" />
      </div>
      {/* 스캐터 차트 스켈레톤 */}
      <div className="md:col-span-2 lg:col-span-3">
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const userName = user?.fullName || user?.firstName || "사용자";

  return (
    <div className="min-w-0 w-full max-w-[1400px] mx-auto px-5 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">안녕하세요, {userName} 님 👋</h1>
          <p className="text-muted-foreground mt-1">
            Behavior-Driven CRM v2에 오신 것을 환영합니다.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          데이터 새로고침
        </Button>
      </div>

      {/* 메인 그리드 */}
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
