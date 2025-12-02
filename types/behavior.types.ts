/**
 * Behavior Layer 타입 정의
 * PRD 3.1 참고: Behavior Layer 지표
 */

import { BehaviorType } from "@/constants/behavior-types";
import { ActivityType } from "@/constants/activity-types";

/**
 * Behavior Layer 지표 타입
 */
export type { BehaviorType };

/**
 * Activity 타입
 */
export type { ActivityType };

/**
 * Behavior Score 인터페이스
 * 행동 강도, 다양성, 질 점수를 포함
 */
export interface BehaviorScore {
  behaviorType: BehaviorType;
  intensityScore: number; // 0-100
  diversityScore: number; // 0-100
  qualityScore: number; // 0-100
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Behavior Score 집계 결과
 */
export interface BehaviorScoreSummary {
  behaviorType: BehaviorType;
  averageIntensity: number;
  averageDiversity: number;
  averageQuality: number;
  totalActivities: number;
}


