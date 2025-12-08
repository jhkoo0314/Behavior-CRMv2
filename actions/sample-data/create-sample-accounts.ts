/**
 * @file create-sample-accounts.ts
 * @description 샘플 Account 생성 Server Action
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { logger } from '@/lib/utils/logger';

const ACCOUNT_NAMES = [
  '서울대학교병원',
  '세브란스병원',
  '아산병원',
  '삼성서울병원',
  '고려대학교병원',
  '연세대학교세브란스병원',
  '가톨릭의대 서울성모병원',
  '한양대학교병원',
  '경희대학교병원',
  '중앙대학교병원',
  '분당서울대학교병원',
  '순천향대학교병원',
  '이화여자대학교병원',
  '건국대학교병원',
  '인하대학교병원',
];

const ACCOUNT_TYPES = ['general_hospital', 'hospital', 'clinic', 'pharmacy'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface CreateSampleAccountsInput {
  count?: number; // 기본값: 10
}

/**
 * 샘플 Account를 생성합니다.
 */
export async function createSampleAccounts(
  input: CreateSampleAccountsInput = {}
): Promise<{ created: number; accountIds: string[] }> {
  const startTime = Date.now();
  const actionName = 'createSampleAccounts';
  const count = input.count || 10;

  logger.action.start(actionName, { count });

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = getServiceRoleClient();
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const name = ACCOUNT_NAMES[i] || `샘플 병원 ${i + 1}`;
      const type = ACCOUNT_TYPES[randomInt(0, ACCOUNT_TYPES.length - 1)];

      accounts.push({
        name,
        type,
        address: `서울시 ${randomInt(1, 25)}구 샘플로 ${randomInt(1, 999)}번지`,
        phone: `02-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        specialty: ['내과', '외과', '정형외과', '신경과', '정신과'][randomInt(0, 4)],
        patient_count: randomInt(100, 10000),
        revenue: randomInt(100000000, 10000000000),
        notes: `샘플 병원 ${i + 1}에 대한 메모입니다.`,
      });
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert(accounts)
      .select('id');

    if (error) {
      logger.db.error('INSERT INTO accounts (sample)', error as Error);
      throw new Error(`Failed to create sample accounts: ${error.message}`);
    }

    const accountIds = data.map((a) => a.id);
    const duration = Date.now() - startTime;

    logger.action.end(actionName, duration, {
      created: accountIds.length,
    });

    return {
      created: accountIds.length,
      accountIds,
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






