'use server';

/**
 * 매출 통계 조회 Server Action
 * 
 * prescriptions 테이블을 기반으로 매출 통계를 조회합니다.
 * 월별 매출, 총 매출, 목표 대비 달성률 등을 계산합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import type { Prescription } from '@/types/database.types';

export interface RevenueStatsInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
  accountId?: string;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM 형식
  monthLabel: string; // "1월", "2월" 등
  revenue: number; // 해당 월의 총 매출
}

export interface RevenueStats {
  totalRevenue: number; // 총 매출
  monthlyRevenues: MonthlyRevenue[]; // 월별 매출 배열
  goalAmount: number; // 목표 매출 (현재는 계산된 값, 추후 설정 가능)
  achievementRate: number; // 목표 대비 달성률 (%)
  remainingAmount: number; // 목표까지 남은 금액
  yearOverYearGrowth: number; // 전년 대비 성장률 (%)
}

/**
 * 매출 통계를 조회합니다.
 */
export async function getRevenueStats(
  input: RevenueStatsInput = {}
): Promise<RevenueStats> {
  console.group('getRevenueStats: 시작');
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
          : new Date(new Date().getFullYear(), 0, 1); // 올해 1월 1일

    const periodEnd =
      input.periodEnd instanceof Date
        ? input.periodEnd
        : input.periodEnd
          ? new Date(input.periodEnd)
          : new Date(); // 오늘

    console.log('기간:', periodStart, '~', periodEnd);

    const supabase = await createClerkSupabaseClient();

    // prescriptions 조회
    let query = supabase
      .from('prescriptions')
      .select('price, prescription_date')
      .gte('prescription_date', periodStart.toISOString())
      .lte('prescription_date', periodEnd.toISOString());

    // 병원 필터링
    if (input.accountId) {
      query = query.eq('account_id', input.accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Prescription 조회 실패:', error);
      throw new Error(`Failed to get prescriptions: ${error.message}`);
    }

    const prescriptions = (data || []) as Prescription[];
    console.log('조회된 Prescription 수:', prescriptions.length);

    // 총 매출 계산
    const totalRevenue = prescriptions.reduce((sum, p) => sum + (p.price || 0), 0);
    console.log('총 매출:', totalRevenue);

    // 월별 매출 집계
    const monthlyMap = new Map<string, number>();

    for (const prescription of prescriptions) {
      const date = new Date(prescription.prescription_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currentRevenue = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, currentRevenue + (prescription.price || 0));
    }

    // 월별 매출 배열 생성 및 정렬
    const monthlyRevenues: MonthlyRevenue[] = Array.from(monthlyMap.entries())
      .map(([monthKey, revenue]) => {
        const [year, month] = monthKey.split('-');
        const monthLabel = `${parseInt(month)}월`;
        return {
          month: monthKey,
          monthLabel,
          revenue,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log('월별 매출:', monthlyRevenues.length, '개월');

    // 목표 매출 계산 (현재는 총 매출의 120%로 설정, 추후 설정 가능)
    const goalAmount = totalRevenue > 0 ? Math.round(totalRevenue * 1.2) : 150000000;
    const achievementRate = goalAmount > 0 ? (totalRevenue / goalAmount) * 100 : 0;
    const remainingAmount = Math.max(0, goalAmount - totalRevenue);

    // 전년 대비 성장률 계산 (전년 동일 기간 대비)
    const previousYearStart = new Date(periodStart);
    previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
    const previousYearEnd = new Date(periodEnd);
    previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

    let previousYearRevenue = 0;
    try {
      let prevQuery = supabase
        .from('prescriptions')
        .select('price')
        .gte('prescription_date', previousYearStart.toISOString())
        .lte('prescription_date', previousYearEnd.toISOString());

      if (input.accountId) {
        prevQuery = prevQuery.eq('account_id', input.accountId);
      }

      const { data: prevData } = await prevQuery;
      previousYearRevenue = (prevData || []).reduce(
        (sum, p) => sum + ((p as Prescription).price || 0),
        0
      );
    } catch (err) {
      console.warn('전년 데이터 조회 실패:', err);
    }

    const yearOverYearGrowth =
      previousYearRevenue > 0
        ? ((totalRevenue - previousYearRevenue) / previousYearRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    console.log('전년 매출:', previousYearRevenue);
    console.log('YoY 성장률:', yearOverYearGrowth.toFixed(2), '%');

    const stats: RevenueStats = {
      totalRevenue,
      monthlyRevenues,
      goalAmount,
      achievementRate,
      remainingAmount,
      yearOverYearGrowth,
    };

    console.log('매출 통계 생성 완료');
    console.groupEnd();

    return stats;
  } catch (error) {
    console.error('getRevenueStats 에러:', error);
    console.groupEnd();
    throw error;
  }
}

