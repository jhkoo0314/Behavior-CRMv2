/**
 * @file create-sample-contacts.ts
 * @description 샘플 Contact 생성 Server Action
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { logger } from '@/lib/utils/logger';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface CreateSampleContactsInput {
  accountIds: string[];
  contactsPerAccount?: number; // 기본값: 2-3개 랜덤
}

/**
 * 샘플 Contact를 생성합니다.
 */
export async function createSampleContacts(
  input: CreateSampleContactsInput
): Promise<{ created: number; contactIds: string[] }> {
  const startTime = Date.now();
  const actionName = 'createSampleContacts';

  logger.action.start(actionName, {
    account_count: input.accountIds.length,
  });

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = getServiceRoleClient();
    const contacts = [];

    for (const accountId of input.accountIds) {
      const contactCount = input.contactsPerAccount || randomInt(2, 3);

      for (let i = 0; i < contactCount; i++) {
        contacts.push({
          account_id: accountId,
          name: `담당자 ${i + 1}`,
          role: ['과장', '차장', '부장', '원장', '교수'][randomInt(0, 4)],
          phone: `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
          email: `contact${i + 1}@example.com`,
          specialty: ['내과', '외과', '정형외과'][randomInt(0, 2)],
          notes: `샘플 담당자 ${i + 1}에 대한 메모입니다.`,
        });
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contacts)
      .select('id');

    if (error) {
      logger.db.error('INSERT INTO contacts (sample)', error as Error);
      throw new Error(`Failed to create sample contacts: ${error.message}`);
    }

    const contactIds = data.map((c) => c.id);
    const duration = Date.now() - startTime;

    logger.action.end(actionName, duration, {
      created: contactIds.length,
    });

    return {
      created: contactIds.length,
      contactIds,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}



