/**
 * @file create-sample-activities.ts
 * @description 샘플 Activity 생성 Server Action
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { logger } from '@/lib/utils/logger';

const ACTIVITY_TYPES = ['visit', 'call', 'message', 'presentation', 'follow_up'] as const;
const BEHAVIOR_TYPES = [
  'approach',
  'contact',
  'visit',
  'presentation',
  'question',
  'need_creation',
  'demonstration',
  'follow_up',
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const days = randomInt(0, daysAgo);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(randomInt(9, 18));
  date.setMinutes(randomInt(0, 59));
  return date;
}

export interface CreateSampleActivitiesInput {
  accountIds: string[];
  contactIds: string[];
  count?: number; // 기본값: 50-100개 랜덤
  daysAgo?: number; // 기본값: 90일
}

/**
 * 샘플 Activity를 생성합니다.
 */
export async function createSampleActivities(
  input: CreateSampleActivitiesInput
): Promise<{ created: number }> {
  const startTime = Date.now();
  const actionName = 'createSampleActivities';
  const count = input.count || randomInt(50, 100);
  const daysAgo = input.daysAgo || 90;

  logger.action.start(actionName, { count, daysAgo });

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const supabase = getServiceRoleClient();
    const activities = [];

    for (let i = 0; i < count; i++) {
      const accountId = input.accountIds[randomInt(0, input.accountIds.length - 1)];
      const contactId =
        randomInt(0, 10) > 3
          ? input.contactIds[randomInt(0, input.contactIds.length - 1)]
          : null;
      const type = ACTIVITY_TYPES[randomInt(0, ACTIVITY_TYPES.length - 1)];
      const behavior = BEHAVIOR_TYPES[randomInt(0, BEHAVIOR_TYPES.length - 1)];

      activities.push({
        user_id: userUuid,
        account_id: accountId,
        contact_id: contactId,
        type,
        behavior,
        description: `${type} 활동: ${behavior} 행동 수행`,
        quality_score: randomInt(50, 100),
        quantity_score: randomInt(50, 100),
        duration_minutes: randomInt(10, 120),
        performed_at: randomDate(daysAgo).toISOString(),
      });
    }

    const { error } = await supabase.from('activities').insert(activities);

    if (error) {
      logger.db.error('INSERT INTO activities (sample)', error as Error);
      throw new Error(`Failed to create sample activities: ${error.message}`);
    }

    const duration = Date.now() - startTime;

    logger.action.end(actionName, duration, {
      created: count,
    });

    return { created: count };
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}






