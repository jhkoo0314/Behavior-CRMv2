/**
 * 차트 관련 타입 정의
 * 
 * 모든 차트 컴포넌트에서 사용하는 공통 타입
 */

/**
 * Sparkline 데이터 타입
 */
export interface SparklineDataPoint {
  date: string;
  value: number;
}

export interface SparklineData {
  data: SparklineDataPoint[];
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

/**
 * 상관관계 데이터 타입
 */
export interface CorrelationDataPoint {
  x: number; // HIR
  y: number; // 필드 성장률
  size: number; // 활동량
  name: string; // 병원명
}

/**
 * Behavior Quality Score 차트 데이터
 */
export interface BehaviorQualityData {
  behavior: string;
  behaviorLabel: string;
  score: number; // 0-100
}

/**
 * Funnel 단계 데이터
 */
export interface FunnelStep {
  name: string;
  value: number;
  conversionRate?: number; // 이전 단계 대비 전환율 (%)
}

/**
 * Heatmap 셀 데이터
 */
export interface HeatmapCell {
  x: number; // 활동 볼륨
  y: number; // 품질 점수
  value: number; // 활동량 × 품질
  label?: string;
}
