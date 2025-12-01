'use server';

/**
 * 코칭 신호 생성 및 저장 Server Action
 * 
 * 주기별 코칭 신호를 생성하고 DB에 저장합니다.
 * PRD 5.2.3 참고: 코칭 신호 저장 및 조회
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { generateCoachingSignals } from '@/lib/analytics/generate-coaching-signals';
import { generateCoachingAction } from '@/lib/analytics/generate-coaching-actions';
import { getAccounts } from '@/actions/accounts/get-accounts';
import type { CoachingSignal } from '@/types/database.types';

export interface GenerateAndSaveCoachingSignalsInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
}

/**
 * 코칭 신호를 생성하고 저장합니다.
 */
export async function generateAndSaveCoachingSignals(
  input: GenerateAndSaveCoachingSignalsInput = {}
): Promise<{ created: number; updated: number }> {
  console.group('generateAndSaveCoachingSignals: 시작');
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

    // 기간 설정 (기본값: 최근 30일)
    const periodEnd = input.periodEnd
      ? input.periodEnd instanceof Date
        ? input.periodEnd
        : new Date(input.periodEnd)
      : new Date();

    const periodStart = input.periodStart
      ? input.periodStart instanceof Date
        ? input.periodStart
        : new Date(input.periodStart)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('분석 기간:', periodStart, '~', periodEnd);

    // 코칭 신호 생성
    const signals = await generateCoachingSignals(userUuid, periodStart, periodEnd);

    console.log('생성된 신호 수:', signals.length);

    // 병원 이름 조회 (메시지 개인화용)
    const { data: accounts } = await getAccounts();
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    const supabase = await createClerkSupabaseClient();
    let created = 0;
    let updated = 0;

    // 각 신호를 저장
    for (const signal of signals) {
      // 추천 액션 생성
      const recommendedAction = generateCoachingAction(
        signal.type,
        signal.behavior_type,
        signal.account_id ? (accountMap.get(signal.account_id) || undefined) : undefined
      );

      // 중복 체크: 같은 타입의 미해결 신호가 있으면 업데이트
      const { data: existing } = await supabase
        .from('coaching_signals')
        .select('id')
        .eq('user_id', userUuid)
        .eq('type', signal.type)
        .eq('is_resolved', false)
        .limit(1);

      if (existing && existing.length > 0) {
        // 기존 신호 업데이트
        const { error: updateError } = await supabase
          .from('coaching_signals')
          .update({
            message: signal.message,
            recommended_action: recommendedAction,
            priority: signal.priority,
            account_id: signal.account_id || null,
            contact_id: signal.contact_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);

        if (!updateError) {
          updated++;
          console.log('신호 업데이트:', signal.type);
        }
      } else {
        // 새 신호 생성
        const { error: insertError } = await supabase
          .from('coaching_signals')
          .insert({
            user_id: userUuid,
            type: signal.type,
            priority: signal.priority,
            message: signal.message,
            recommended_action: recommendedAction,
            account_id: signal.account_id || null,
            contact_id: signal.contact_id || null,
            is_resolved: false,
            resolved_at: null,
          });

        if (!insertError) {
          created++;
          console.log('신호 생성:', signal.type);
        }
      }
    }

    console.log('저장 완료 - 생성:', created, ', 업데이트:', updated);
    console.groupEnd();

    return { created, updated };
  } catch (error) {
    console.error('generateAndSaveCoachingSignals 에러:', error);
    console.groupEnd();
    throw error;
  }
}

