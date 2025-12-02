/**
 * 성장 맵 페이지
 *
 * PRD 4.3 참고: 행동 품질 트렌드, Outcome Layer 변화, 성장 추천 액션
 *
 * 새로운 디자인으로 리팩토링:
 * 1. Gamification Tier: 레벨/경험치 시스템
 * 2. Dual-Axis Trend Chart: 행동-성과 인과관계 차트
 * 3. Skill Tree: 3단계 성장 로드맵
 */

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// 새 컴포넌트들 동적 import (코드 스플리팅)
const GamificationTier = dynamic(
  () =>
    import("@/components/growth/gamification-tier").then((mod) => ({
      default: mod.GamificationTier,
    })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> },
);

const BehaviorOutcomeTrendChart = dynamic(
  () =>
    import("@/components/growth/behavior-outcome-trend-chart").then((mod) => ({
      default: mod.BehaviorOutcomeTrendChart,
    })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> },
);

const SkillTree = dynamic(
  () =>
    import("@/components/growth/skill-tree").then((mod) => ({
      default: mod.SkillTree,
    })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> },
);

export default function GrowthPage() {
  console.group("GrowthPage: 렌더링");
  console.log("성장 맵 페이지 로드");
  console.groupEnd();

  return (
    <div className="min-w-0 w-full max-w-[1200px] mx-auto px-5 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-3xl font-extrabold text-transparent">
          나의 성장 맵 (Growth Map)
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          행동 품질이 성과로 이어지는 여정을 확인하세요.
        </p>
      </div>

      {/* 1. Gamification Tier */}
      <GamificationTier />

      {/* 2. Dual-Axis Trend Chart */}
      <BehaviorOutcomeTrendChart />

      {/* 3. Skill Tree (Next Steps) */}
      <SkillTree />
    </div>
  );
}
