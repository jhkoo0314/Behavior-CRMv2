/**
 * 성장 맵 페이지
 * 
 * PRD 4.3 참고: 행동 품질 트렌드, Outcome Layer 변화, 성장 추천 액션
 * 현재는 UI 구조만 준비하고, 실제 차트는 스프린트 5에서 구현
 */

import { ChartWrapper } from '@/components/charts/chart-wrapper';

export default function GrowthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">성장 맵</h1>
        <p className="text-muted-foreground">
          나의 행동 품질과 성과 변화를 추적하고 성장 방향을 확인하세요.
        </p>
      </div>

      {/* 행동 품질 트렌드 차트 영역 (임시) */}
      <ChartWrapper
        title="행동 품질 트렌드"
        description="8개 Behavior 지표별 트렌드 (7일, 30일, 90일)"
        isEmpty={true}
        emptyMessage="데이터가 없습니다. 활동을 기록하면 트렌드 차트가 표시됩니다."
      >
        {/* 라인 차트는 스프린트 5에서 구현 */}
      </ChartWrapper>

      {/* Outcome Layer 변화 차트 영역 (임시) */}
      <ChartWrapper
        title="Outcome Layer 변화"
        description="HIR, 전환률, 성장률, 처방지수 트렌드"
        isEmpty={true}
        emptyMessage="데이터가 없습니다."
      >
        {/* 라인 차트는 스프린트 5에서 구현 */}
      </ChartWrapper>

      {/* 성장 추천 액션 영역 (임시) */}
      <ChartWrapper
        title="성장 추천 액션"
        description="AI 기반 개인 맞춤 성장 추천"
        isEmpty={true}
        emptyMessage="데이터가 없습니다. 활동을 기록하면 추천 액션이 표시됩니다."
      >
        {/* AI 추천 기능은 스프린트 5에서 구현 */}
      </ChartWrapper>
    </div>
  );
}

