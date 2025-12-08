/**
 * Behavior 지표 조회 Server Action
 * 
 * 현재 사용자의 HIR, RTR, BCR, PHR 및 Total Score를 조회합니다.
 */

'use server';

import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { calculateRTR } from '@/lib/analytics/calculate-rtr';
import { calculateBCR } from '@/lib/analytics/calculate-bcr';
import { calculatePHR } from '@/lib/analytics/calculate-phr';

export interface BehaviorMetrics {
  hir: number;
  rtr: number;
  bcr: number;
  phr: number;
  totalScore: number;
}

export interface GetBehaviorMetricsInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
}

/**
 * Behavior 지표를 조회합니다.
 * 
 * @param input 기간 설정 (선택사항)
 * @returns Behavior 지표 객체
 */
export async function getBehaviorMetrics(
  input: GetBehaviorMetricsInput = {}
): Promise<BehaviorMetrics> {
  console.group('getBehaviorMetrics: 시작');

  try {
    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    // 기간 설정
    const endDate = input.periodEnd 
      ? (typeof input.periodEnd === 'string' ? new Date(input.periodEnd) : input.periodEnd)
      : new Date();
    const startDate = input.periodStart
      ? (typeof input.periodStart === 'string' ? new Date(input.periodStart) : input.periodStart)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('기간:', startDate, '~', endDate);

    // 모든 지표 병렬 계산
    const [hir, rtr, bcr, phr] = await Promise.all([
      calculateHIR(userUuid, startDate, endDate),
      calculateRTR(userUuid, startDate, endDate),
      calculateBCR(userUuid, startDate, endDate),
      calculatePHR(userUuid, startDate, endDate),
    ]);

    // Total Score 계산 (평균)
    const totalScore = Math.round((hir + rtr + bcr + phr) / 4);

    console.log('HIR:', hir);
    console.log('RTR:', rtr);
    console.log('BCR:', bcr);
    console.log('PHR:', phr);
    console.log('Total Score:', totalScore);
    console.groupEnd();

    return {
      hir,
      rtr,
      bcr,
      phr,
      totalScore,
    };
  } catch (error) {
    console.error('getBehaviorMetrics 에러:', error);
    console.groupEnd();
    throw error;
  }
}




