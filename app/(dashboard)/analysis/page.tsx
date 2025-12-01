/**
 * 분석 페이지
 * 
 * PRD 4.2 참고: HIR ↔ 성장률 상관도, 고객 세분화, 활동 볼륨 × 품질 Matrix, 처방 기반 성과 Funnel
 * 현재는 UI 구조만 준비하고, 실제 차트는 스프린트 4에서 구현
 */

import { ChartWrapper } from '@/components/charts/chart-wrapper';

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">분석</h1>
        <p className="text-muted-foreground">
          왜 이런 성과가 나왔는지 분석합니다.
        </p>
      </div>

      {/* HIR ↔ 성장률 상관도 차트 영역 (임시) */}
      <ChartWrapper
        title="HIR ↔ 성장률 상관도"
        description="X축: HIR, Y축: 필드 성장률, 버블 크기: 전체 활동량"
        isEmpty={true}
        emptyMessage="데이터가 없습니다. 활동을 기록하면 상관도 차트가 표시됩니다."
      >
        {null}
      </ChartWrapper>

      {/* 고객 세분화 및 HIR 비교 영역 (임시) */}
      <ChartWrapper
        title="고객 세분화 및 HIR 비교"
        description="고객군별 행동 품질(HIR) 비교"
        isEmpty={true}
        emptyMessage="데이터가 없습니다."
      >
        {null}
      </ChartWrapper>

      {/* 활동 볼륨 × 품질 Matrix 영역 (임시) */}
      <ChartWrapper
        title="활동 볼륨 × 품질 Matrix"
        description="행동 프로파일 분류 (많이 하지만 품질 낮음 / 적게 하지만 품질 높음 등)"
        isEmpty={true}
        emptyMessage="데이터가 없습니다."
      >
        {null}
      </ChartWrapper>

      {/* 처방 기반 성과 Funnel Chart 영역 (임시) */}
      <ChartWrapper
        title="처방 기반 성과 Funnel"
        description="행동 → 고객 반응 → 처방량 변화 → 성과"
        isEmpty={true}
        emptyMessage="데이터가 없습니다."
      >
        {null}
      </ChartWrapper>
    </div>
  );
}

