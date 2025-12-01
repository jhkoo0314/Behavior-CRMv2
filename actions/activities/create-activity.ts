'use server';

/**
 * Activity 생성 Server Action
 * 
 * 영업사원의 행동 데이터를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { detectAndSaveCompetitorSignal } from '@/actions/competitor-signals/detect-and-save';
import { logger } from '@/lib/utils/logger';
import { invalidateActivityCache } from '@/lib/utils/cache-invalidation';
import type { Activity } from '@/types/database.types';
import type { ActivityType } from '@/constants/activity-types';
import type { BehaviorType } from '@/constants/behavior-types';

export interface CreateActivityInput {
  account_id: string;
  contact_id?: string | null;
  type: ActivityType;
  behavior: BehaviorType;
  description: string;
  quality_score: number; // 0-100
  quantity_score: number; // 0-100
  duration_minutes?: number;
  performed_at?: Date | string;
}

export async function createActivity(
  input: CreateActivityInput
): Promise<Activity> {
  const startTime = Date.now();
  const actionName = 'createActivity';

  logger.action.start(actionName, {
    account_id: input.account_id,
    type: input.type,
    behavior: input.behavior,
  });

  try {
    // 입력 검증
    if (!input.account_id || typeof input.account_id !== 'string') {
      throw new Error('Invalid account_id');
    }
    if (!input.type || !['visit', 'call', 'message', 'presentation', 'follow_up'].includes(input.type)) {
      throw new Error('Invalid activity type');
    }
    if (!input.behavior || !['approach', 'contact', 'visit', 'presentation', 'question', 'need_creation', 'demonstration', 'follow_up'].includes(input.behavior)) {
      throw new Error('Invalid behavior type');
    }
    if (!input.description || typeof input.description !== 'string' || input.description.trim().length === 0) {
      throw new Error('Description is required');
    }
    if (input.description.length > 5000) {
      throw new Error('Description is too long (max 5000 characters)');
    }
    if (typeof input.quality_score !== 'number' || input.quality_score < 0 || input.quality_score > 100) {
      throw new Error('Quality score must be between 0 and 100');
    }
    if (typeof input.quantity_score !== 'number' || input.quantity_score < 0 || input.quantity_score > 100) {
      throw new Error('Quantity score must be between 0 and 100');
    }
    if (input.duration_minutes !== undefined && (typeof input.duration_minutes !== 'number' || input.duration_minutes < 0)) {
      throw new Error('Duration must be a non-negative number');
    }

    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    // Activity 생성
    logger.db.query('INSERT INTO activities', {
      user_id: userUuid,
      account_id: input.account_id,
    });

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userUuid,
        account_id: input.account_id,
        contact_id: input.contact_id || null,
        type: input.type,
        behavior: input.behavior,
        description: input.description,
        quality_score: input.quality_score,
        quantity_score: input.quantity_score,
        duration_minutes: input.duration_minutes || 0,
        performed_at: input.performed_at
          ? new Date(input.performed_at).toISOString()
          : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.db.error('INSERT INTO activities', error as Error, {
        account_id: input.account_id,
      });
      throw new Error(`Failed to create activity: ${error.message}`);
    }

    logger.info('Activity 생성 성공', {
      activity_id: data.id,
      account_id: input.account_id,
    });

    // 관련 캐시 무효화
    try {
      await invalidateActivityCache(userUuid);
    } catch (cacheError) {
      logger.warn('캐시 무효화 실패 (무시)', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    // 경쟁사 신호 자동 감지 (에러 발생해도 Activity 생성은 성공 처리)
    try {
      await detectAndSaveCompetitorSignal({
        activityDescription: input.description,
        accountId: input.account_id,
        contactId: input.contact_id,
        activityId: data.id,
      });
    } catch (competitorError) {
      logger.warn('경쟁사 신호 감지 중 에러 (무시)', {
        activity_id: data.id,
        error: competitorError instanceof Error ? competitorError.message : String(competitorError),
      });
      // 경쟁사 신호 감지는 부가 기능이므로 에러가 발생해도 Activity 생성은 성공
    }

    const duration = Date.now() - startTime;
    logger.action.end(actionName, duration, {
      activity_id: data.id,
    });

    return data as Activity;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

