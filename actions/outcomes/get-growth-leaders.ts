'use server';

/**
 * 병원별 성장 리더보드 Server Action
 * 
 * account별 매출 성장률을 계산하여 Top N 병원을 반환합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Prescription, Account } from '@/types/database.types';

export interface GrowthLeaderInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
  limit?: number; // Top N (기본 3)
}

export interface GrowthLeader {
  accountId: string;
  accountName: string;
  accountDescription: string | null;
  currentRevenue: number; // 현재 기간 매출
  previousRevenue: number; // 이전 기간 매출
  growthRate: number; // 성장률 (%)
  isNew: boolean; // 신규 병원 여부
}

/**
 * 병원별 성장 리더보드를 조회합니다.
 */
export async function getGrowthLeaders(
  input: GrowthLeaderInput = {}
): Promise<GrowthLeader[]> {
  console.group('getGrowthLeaders: 시작');
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
              date.setMonth(date.getMonth() - 1);
              return date;
            })(); // 1개월 전

    const periodEnd =
      input.periodEnd instanceof Date
        ? input.periodEnd
        : input.periodEnd
          ? new Date(input.periodEnd)
          : new Date(); // 오늘

    console.log('현재 기간:', periodStart, '~', periodEnd);

    // 이전 기간 계산 (동일한 길이의 기간)
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodEnd = new Date(periodStart);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    console.log('이전 기간:', previousPeriodStart, '~', previousPeriodEnd);

    const supabase = await createClerkSupabaseClient();
    const limit = input.limit || 3;

    // 현재 기간 prescriptions 조회
    const { data: currentData, error: currentError } = await supabase
      .from('prescriptions')
      .select('account_id, price, prescription_date')
      .gte('prescription_date', periodStart.toISOString())
      .lte('prescription_date', periodEnd.toISOString());

    if (currentError) {
      console.error('현재 기간 Prescription 조회 실패:', currentError);
      throw new Error(`Failed to get current prescriptions: ${currentError.message}`);
    }

    // 이전 기간 prescriptions 조회
    const { data: previousData, error: previousError } = await supabase
      .from('prescriptions')
      .select('account_id, price, prescription_date')
      .gte('prescription_date', previousPeriodStart.toISOString())
      .lte('prescription_date', previousPeriodEnd.toISOString());

    if (previousError) {
      console.error('이전 기간 Prescription 조회 실패:', previousError);
      throw new Error(`Failed to get previous prescriptions: ${previousError.message}`);
    }

    const currentPrescriptions = (currentData || []) as Prescription[];
    const previousPrescriptions = (previousData || []) as Prescription[];

    console.log('현재 기간 Prescription 수:', currentPrescriptions.length);
    console.log('이전 기간 Prescription 수:', previousPrescriptions.length);

    // account별 매출 집계
    const currentRevenueMap = new Map<string, number>();
    const previousRevenueMap = new Map<string, number>();
    const accountIds = new Set<string>();

    for (const prescription of currentPrescriptions) {
      if (prescription.account_id) {
        accountIds.add(prescription.account_id);
        const current = currentRevenueMap.get(prescription.account_id) || 0;
        currentRevenueMap.set(
          prescription.account_id,
          current + (prescription.price || 0)
        );
      }
    }

    for (const prescription of previousPrescriptions) {
      if (prescription.account_id) {
        accountIds.add(prescription.account_id);
        const previous = previousRevenueMap.get(prescription.account_id) || 0;
        previousRevenueMap.set(
          prescription.account_id,
          previous + (prescription.price || 0)
        );
      }
    }

    // account 정보 조회
    const accountIdsArray = Array.from(accountIds);
    if (accountIdsArray.length === 0) {
      console.log('병원 데이터 없음');
      console.groupEnd();
      return [];
    }

    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, specialty, notes')
      .in('id', accountIdsArray);

    if (accountsError) {
      console.error('Account 조회 실패:', accountsError);
      throw new Error(`Failed to get accounts: ${accountsError.message}`);
    }

    const accounts = (accountsData || []) as Account[];
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    console.log('조회된 Account 수:', accounts.length);

    // 성장률 계산 및 리더보드 생성
    const leaders: GrowthLeader[] = [];

    for (const accountId of accountIdsArray) {
      const currentRevenue = currentRevenueMap.get(accountId) || 0;
      const previousRevenue = previousRevenueMap.get(accountId) || 0;
      const isNew = previousRevenue === 0 && currentRevenue > 0;

      // 성장률 계산
      let growthRate = 0;
      if (isNew) {
        growthRate = 100; // 신규 병원은 100%로 표시
      } else if (previousRevenue > 0) {
        growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      } else if (currentRevenue > 0) {
        growthRate = 0; // 이전 기간 데이터 없고 현재만 있는 경우
      }

      const account = accountMap.get(accountId);
      if (account) {
        leaders.push({
          accountId,
          accountName: account.name,
          accountDescription: account.specialty || account.notes || null,
          currentRevenue,
          previousRevenue,
          growthRate,
          isNew,
        });
      }
    }

    // 성장률 기준으로 정렬 (내림차순)
    leaders.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return b.growthRate - a.growthRate;
    });

    // Top N만 반환
    const topLeaders = leaders.slice(0, limit);

    console.log('성장 리더보드 생성 완료:', topLeaders.length, '개');
    console.groupEnd();

    return topLeaders;
  } catch (error) {
    console.error('getGrowthLeaders 에러:', error);
    console.groupEnd();
    throw error;
  }
}

