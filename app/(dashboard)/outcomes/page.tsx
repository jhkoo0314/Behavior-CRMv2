/**
 * 성과 리포트 페이지
 *
 * Outcome Layer 지표를 조회하는 페이지
 * 매출 통계, 성장률, 파이프라인 현황 등을 종합적으로 표시합니다.
 */

"use client";

import { RevenueKpiCard } from "@/components/outcomes/revenue-kpi-card";
import { GrowthKpiCard } from "@/components/outcomes/growth-kpi-card";
import { PipelineKpiCard } from "@/components/outcomes/pipeline-kpi-card";
import { PredictionKpiCard } from "@/components/outcomes/prediction-kpi-card";
import { RevenueBehaviorChart } from "@/components/outcomes/revenue-behavior-chart";
import { GrowthLeaderboard } from "@/components/outcomes/growth-leaderboard";
import { PipelineFunnel } from "@/components/outcomes/pipeline-funnel";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Download } from "lucide-react";

export default function OutcomesPage() {
  return (
    <div className="min-w-0 w-full max-w-[1200px] mx-auto px-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">
            성과 리포트 (Outcome Report)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            2024년 4분기 실적 및 행동 인과관계 분석
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4" />
            이번 달
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4" />
            제품별 보기
          </Button>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <RevenueKpiCard />
        <GrowthKpiCard />
        <PipelineKpiCard />
        <PredictionKpiCard />
      </div>

      {/* Main Chart & Sidebar Grid */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* Left: Revenue Trend with Behavior Overlay */}
        <RevenueBehaviorChart />

        {/* Right: Top Movers & Pipeline */}
        <div className="flex flex-col gap-5">
          <GrowthLeaderboard />
          <PipelineFunnel />
        </div>
      </div>
    </div>
  );
}
