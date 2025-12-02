'use server';

/**
 * 파이프라인 현황 Server Action
 * 
 * activities 테이블의 outcome 필드를 기반으로 파이프라인 단계별 집계를 반환합니다.
 * 제안(ongoing), 협상(ongoing), 마감 임박(won) 등의 단계로 구분합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Activity } from '@/types/database.types';

export interface PipelineSummaryInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
}

export interface PipelineStage {
  stage: 'proposal' | 'negotiation' | 'closing';
  stageLabel: string;
  count: number;
  totalValue: number; // 해당 단계의 총 가치 (prescriptions의 price 합계)
  percentage: number; // 전체 대비 비율 (%)
}

export interface PipelineSummary {
  stages: PipelineStage[];
  totalCount: number;
  totalValue: number;
  conversionRate: number; // 전체 전환율 (%)
}

/**
 * 파이프라인 현황을 조회합니다.
 */
export async function getPipelineSummary(
  input: PipelineSummaryInput = {}
): Promise<PipelineSummary> {
  console.group('getPipelineSummary: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const periodStart =
      input.periodStart instanceof Date
        ? input.periodStart
        : input.periodStart
          ? new Date(input.periodStart)
          : (() => {
              const date = new Date();
              date.setMonth(date.getMonth() - 3);
              return date;
            })(); // 3개월 전

    const periodEnd =
      input.periodEnd instanceof Date
        ? input.periodEnd
        : input.periodEnd
          ? new Date(input.periodEnd)
          : new Date(); // 오늘

    console.log('기간:', periodStart, '~', periodEnd);

    const supabase = await createClerkSupabaseClient();

    // activities 조회 (outcome이 있는 것만)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('id, outcome, account_id, performed_at')
      .eq('user_id', userUuid)
      .gte('performed_at', periodStart.toISOString())
      .lte('performed_at', periodEnd.toISOString())
      .not('outcome', 'is', null);

    if (activitiesError) {
      console.error('Activity 조회 실패:', activitiesError);
      throw new Error(`Failed to get activities: ${activitiesError.message}`);
    }

    const activities = (activitiesData || []) as Activity[];
    console.log('조회된 Activity 수:', activities.length);

    // outcome별 집계
    const proposalActivities: Activity[] = [];
    const negotiationActivities: Activity[] = [];
    const closingActivities: Activity[] = [];

    for (const activity of activities) {
      if (activity.outcome === 'ongoing') {
        // 최근 활동이면 협상, 오래된 활동이면 제안으로 분류
        const daysSinceActivity =
          (new Date().getTime() - new Date(activity.performed_at).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSinceActivity < 14) {
          negotiationActivities.push(activity);
        } else {
          proposalActivities.push(activity);
        }
      } else if (activity.outcome === 'won') {
        closingActivities.push(activity);
      }
    }

    console.log('제안 단계:', proposalActivities.length);
    console.log('협상 단계:', negotiationActivities.length);
    console.log('마감 임박:', closingActivities.length);

    // 각 단계의 총 가치 계산 (prescriptions의 price 합계)
    const accountIds = new Set<string>();
    activities.forEach((a) => {
      if (a.account_id) accountIds.add(a.account_id);
    });

    let totalValue = 0;
    const stageValues = {
      proposal: 0,
      negotiation: 0,
      closing: 0,
    };

    if (accountIds.size > 0) {
      // 각 단계의 account별로 prescriptions 가치 계산
      const accountIdsArray = Array.from(accountIds);

      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('account_id, price')
        .in('account_id', accountIdsArray)
        .gte('prescription_date', periodStart.toISOString())
        .lte('prescription_date', periodEnd.toISOString());

      const prescriptions = (prescriptionsData || []) as Array<{
        account_id: string;
        price: number;
      }>;

      // account별 가치 매핑
      const accountValueMap = new Map<string, number>();
      for (const prescription of prescriptions) {
        const current = accountValueMap.get(prescription.account_id) || 0;
        accountValueMap.set(
          prescription.account_id,
          current + (prescription.price || 0)
        );
        totalValue += prescription.price || 0;
      }

      // 각 단계별 가치 계산
      for (const activity of proposalActivities) {
        if (activity.account_id) {
          stageValues.proposal += accountValueMap.get(activity.account_id) || 0;
        }
      }
      for (const activity of negotiationActivities) {
        if (activity.account_id) {
          stageValues.negotiation += accountValueMap.get(activity.account_id) || 0;
        }
      }
      for (const activity of closingActivities) {
        if (activity.account_id) {
          stageValues.closing += accountValueMap.get(activity.account_id) || 0;
        }
      }
    }

    const totalCount = activities.length;
    const conversionRate =
      totalCount > 0 ? (closingActivities.length / totalCount) * 100 : 0;

    // 단계별 비율 계산
    const proposalPercentage =
      totalCount > 0 ? (proposalActivities.length / totalCount) * 100 : 0;
    const negotiationPercentage =
      totalCount > 0 ? (negotiationActivities.length / totalCount) * 100 : 0;
    const closingPercentage =
      totalCount > 0 ? (closingActivities.length / totalCount) * 100 : 0;

    const stages: PipelineStage[] = [
      {
        stage: 'proposal',
        stageLabel: '제안',
        count: proposalActivities.length,
        totalValue: stageValues.proposal,
        percentage: proposalPercentage,
      },
      {
        stage: 'negotiation',
        stageLabel: '협상',
        count: negotiationActivities.length,
        totalValue: stageValues.negotiation,
        percentage: negotiationPercentage,
      },
      {
        stage: 'closing',
        stageLabel: '마감 임박',
        count: closingActivities.length,
        totalValue: stageValues.closing,
        percentage: closingPercentage,
      },
    ];

    console.log('파이프라인 현황 생성 완료');
    console.log('전체 건수:', totalCount);
    console.log('전환율:', conversionRate.toFixed(2), '%');

    const summary: PipelineSummary = {
      stages,
      totalCount,
      totalValue,
      conversionRate,
    };

    console.groupEnd();
    return summary;
  } catch (error) {
    console.error('getPipelineSummary 에러:', error);
    console.groupEnd();
    throw error;
  }
}

