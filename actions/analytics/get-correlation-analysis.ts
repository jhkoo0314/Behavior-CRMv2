'use server';

/**
 * Behavior-Outcome 상관관계 분석 Server Action
 * 
 * 클라이언트 컴포넌트에서 호출할 수 있도록 래핑
 */

import { auth } from '@clerk/nextjs/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { analyzeBehaviorOutcomeCorrelation } from '@/lib/analytics/analyze-behavior-outcome-correlation';
import type { CorrelationAnalysisResult } from '@/lib/analytics/analyze-behavior-outcome-correlation';

export interface GetCorrelationAnalysisInput {
  periodStart: Date | string;
  periodEnd: Date | string;
}

export async function getCorrelationAnalysis(
  input: GetCorrelationAnalysisInput
): Promise<CorrelationAnalysisResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const periodStart = input.periodStart instanceof Date
      ? input.periodStart
      : new Date(input.periodStart);
    const periodEnd = input.periodEnd instanceof Date
      ? input.periodEnd
      : new Date(input.periodEnd);

    return await analyzeBehaviorOutcomeCorrelation(userUuid, periodStart, periodEnd);
  } catch (error) {
    console.error('getCorrelationAnalysis 에러:', error);
    throw error;
  }
}

