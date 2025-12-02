/**
 * 분석 페이지
 *
 * 성과 분석 (Behavior Analytics) 대시보드
 * 행동 데이터 기반으로 성과 원인을 분석합니다.
 *
 * 주요 차트:
 * 1. 활동량(Volume) × 행동품질(Quality) 매트릭스
 * 2. 정직입력률(HIR)과 성장의 상관관계
 * 3. 처방 전환 퍼널 (Prescription Funnel)
 * 4. 고객 세분화
 */

"use client";

import { VolumeQualityHeatmap } from "@/components/analysis/volume-quality-heatmap";
import { HirGrowthScatter } from "@/components/analysis/hir-growth-scatter";
import { PrescriptionFunnel } from "@/components/analysis/prescription-funnel";
import { CustomerSegmentation } from "@/components/analysis/customer-segmentation";

export default function AnalysisPage() {
  return (
    <div className="min-w-0 w-full bg-slate-50 p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              성과 분석 (Behavior Analytics)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              행동 데이터 기반으로 성과 원인을 분석합니다.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-md sm:gap-4">
            <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm">
              <option>이번 달 (Current Month)</option>
              <option>지난 3개월 (Last Quarter)</option>
            </select>

            <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm">
              <option>전체 제품군</option>
              <option>제품 A (주력)</option>
              <option>제품 B (신규)</option>
            </select>

            <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm">
              <option>나의 데이터</option>
              <option>팀 전체 평균</option>
            </select>
          </div>
        </div>

        {/* Row 1: The "Why" (Matrix & Correlation) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Volume vs Quality Matrix */}
          <VolumeQualityHeatmap />

          {/* 2. HIR vs Growth Correlation */}
          <HirGrowthScatter />
        </div>

        {/* Row 2: The "What" & "Who" (Funnel & Segmentation) */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* 3. Prescription Funnel */}
          <div className="min-w-0">
            <PrescriptionFunnel />
          </div>

          {/* 4. Customer Segmentation */}
          <div className="min-w-0">
            <CustomerSegmentation />
          </div>
        </div>
      </div>
    </div>
  );
}
