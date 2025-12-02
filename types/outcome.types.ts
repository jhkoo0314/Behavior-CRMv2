/**
 * Outcome Layer 타입 정의
 * PRD 3.2 참고: Outcome Layer 핵심 4대 지표
 */

import { OutcomeType } from "@/constants/outcome-types";

/**
 * Outcome Layer 지표 타입
 */
export type { OutcomeType };

/**
 * 기간 단위 타입
 */
export type PeriodType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

/**
 * Outcome 인터페이스
 * Behavior Layer의 결과로 나타난 성과 지표
 */
export interface Outcome {
  hirScore: number; // HIR (High-Impact Rate)
  conversionRate: number; // 전환률 (%)
  fieldGrowthRate: number; // 필드 성장률 (%)
  prescriptionIndex: number; // 처방 기반 성과지수
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Outcome 요약 정보
 */
export interface OutcomeSummary {
  hirScore: number;
  conversionRate: number;
  fieldGrowthRate: number;
  prescriptionIndex: number;
  trend: {
    hir: number; // 전 기간 대비 변화율
    conversion: number;
    growth: number;
    prescription: number;
  };
}


