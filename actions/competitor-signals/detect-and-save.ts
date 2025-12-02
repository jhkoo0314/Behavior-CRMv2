'use server';

/**
 * 경쟁사 신호 감지 및 저장 Server Action
 * 
 * Activity 생성 시 자동으로 경쟁사 신호를 감지하고 저장합니다.
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { detectCompetitorSignals } from '@/lib/analytics/detect-competitor-signals';
import type { CompetitorSignal } from '@/types/database.types';

export interface DetectAndSaveCompetitorSignalInput {
  activityDescription: string;
  accountId: string;
  contactId?: string | null;
  activityId?: string; // 관련 Activity ID (선택적)
}

/**
 * 경쟁사 신호를 감지하고 저장합니다.
 * 
 * @param input Activity 정보
 * @returns 저장된 경쟁사 신호 또는 null (감지되지 않은 경우)
 */
export async function detectAndSaveCompetitorSignal(
  input: DetectAndSaveCompetitorSignalInput
): Promise<CompetitorSignal | null> {
  console.group('detectAndSaveCompetitorSignal: 시작');
  console.log('입력 데이터:', input);

  try {
    // 경쟁사 신호 감지
    const signal = detectCompetitorSignals(
      input.activityDescription,
      input.accountId,
      input.contactId || undefined
    );

    if (!signal) {
      console.log('경쟁사 신호 미감지');
      console.groupEnd();
      return null;
    }

    // 중복 방지: 같은 account_id + 같은 날짜에 같은 competitor_name이면 스킵
    const supabase = await createClerkSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('competitor_signals')
      .select('id')
      .eq('account_id', input.accountId)
      .eq('competitor_name', signal.competitor_name)
      .gte('detected_at', `${today}T00:00:00`)
      .lte('detected_at', `${today}T23:59:59`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('오늘 이미 같은 경쟁사 신호가 존재하여 스킵');
      console.groupEnd();
      return null;
    }

    // 경쟁사 신호 저장
    const { data, error } = await supabase
      .from('competitor_signals')
      .insert({
        account_id: input.accountId,
        contact_id: input.contactId || null,
        competitor_name: signal.competitor_name,
        type: signal.type,
        description: signal.description,
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('경쟁사 신호 저장 실패:', error);
      // 에러가 발생해도 Activity 생성은 성공 처리 (부가 기능)
      console.groupEnd();
      return null;
    }

    console.log('경쟁사 신호 저장 완료:', data);
    console.groupEnd();

    return data as CompetitorSignal;
  } catch (error) {
    console.error('detectAndSaveCompetitorSignal 에러:', error);
    // 에러가 발생해도 Activity 생성은 성공 처리 (부가 기능)
    console.groupEnd();
    return null;
  }
}



