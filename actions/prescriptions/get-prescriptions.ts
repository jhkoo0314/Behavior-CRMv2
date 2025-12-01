'use server';

/**
 * Prescription 조회 Server Action
 * 
 * 처방 목록을 조회합니다. 사용자별, 병원별, 기간별 필터링을 지원합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';

export interface GetPrescriptionsInput {
  account_id?: string;
  contact_id?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}

export async function getPrescriptions(
  input: GetPrescriptionsInput = {}
): Promise<{ data: Prescription[]; totalCount: number }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('prescriptions')
      .select('*', { count: 'exact' });

    // 병원 필터링
    if (input.account_id) {
      query = query.eq('account_id', input.account_id);
    }

    // 담당자 필터링
    if (input.contact_id) {
      query = query.eq('contact_id', input.contact_id);
    }

    // 날짜 범위 필터링
    if (input.startDate) {
      const startDateStr =
        input.startDate instanceof Date
          ? input.startDate.toISOString()
          : input.startDate;
      query = query.gte('prescription_date', startDateStr);
    }
    if (input.endDate) {
      const endDateStr =
        input.endDate instanceof Date
          ? input.endDate.toISOString()
          : input.endDate;
      query = query.lte('prescription_date', endDateStr);
    }

    // 정렬: prescription_date DESC (기본)
    query = query.order('prescription_date', { ascending: false });

    // 페이지네이션
    if (input.limit) {
      query = query.limit(input.limit);
    }
    if (input.offset !== undefined) {
      const end = input.offset + (input.limit || 10) - 1;
      query = query.range(input.offset, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Prescription 조회 실패:', error);
      throw new Error(`Failed to get prescriptions: ${error.message}`);
    }

    return {
      data: (data || []) as Prescription[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getPrescriptions 에러:', error);
    throw error;
  }
}

