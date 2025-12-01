/**
 * 성장 맵 페이지
 * 
 * PRD 4.3 참고: 행동 품질 트렌드, Outcome Layer 변화, 성장 추천 액션
 */

import { BehaviorTrendChart } from '@/components/growth/behavior-trend-chart';
import { OutcomeTrendChart } from '@/components/growth/outcome-trend-chart';
import { NextBestAction } from '@/components/recommendations/next-best-action';

export default function GrowthPage() {
  return (
    <div className="space-y-6">
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

