/**
 * @file create-sample-prescriptions.ts
 * @description 샘플 Prescription 생성 Server Action
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { logger } from '@/lib/utils/logger';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const days = randomInt(0, daysAgo);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

export interface CreateSamplePrescriptionsInput {
  accountIds: string[];
  contactIds: string[];
  count?: number; // 기본값: 20-50개 랜덤
  daysAgo?: number; // 기본값: 30일
}

/**
 * 샘플 Prescription을 생성합니다.
 */
export async function createSamplePrescriptions(
  input: CreateSamplePrescriptionsInput
): Promise<{ created: number }> {
  const startTime = Date.now();
  const actionName = 'createSamplePrescriptions';
  const count = input.count || randomInt(20, 50);
  const daysAgo = input.daysAgo || 30;

  logger.action.start(actionName, { count, daysAgo });

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = getServiceRoleClient();
    const prescriptions = [];

    for (let i = 0; i < count; i++) {
      const accountId = input.accountIds[randomInt(0, input.accountIds.length - 1)];
      const contactId =
        randomInt(0, 10) > 5
          ? input.contactIds[randomInt(0, input.contactIds.length - 1)]
          : null;

      prescriptions.push({
        account_id: accountId,
        contact_id: contactId,
        product_name: `제품 ${randomInt(1, 10)}`,
        product_code: `PROD-${randomInt(1000, 9999)}`,
        quantity: randomInt(10, 1000),
        quantity_unit: '정',
        price: randomInt(10000, 100000),
        prescription_date: randomDate(daysAgo).toISOString().split('T')[0],
        notes: `샘플 처방 ${i + 1}에 대한 메모입니다.`,
      });
    }

    const { error } = await supabase.from('prescriptions').insert(prescriptions);

    if (error) {
      logger.db.error('INSERT INTO prescriptions (sample)', error as Error);
      throw new Error(`Failed to create sample prescriptions: ${error.message}`);
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

