'use server';

/**
 * Account 생성 Server Action
 * 
 * 병원 정보를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Account } from '@/types/database.types';

export interface CreateAccountInput {
  name: string;
  address?: string;
  phone?: string;
  type: 'general_hospital' | 'hospital' | 'clinic' | 'pharmacy';
  specialty?: string;
  patient_count?: number;
  revenue?: number;
  notes?: string;
  tier?: 'S' | 'A' | 'B' | 'RISK';
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const startTime = Date.now();
  const actionName = 'createAccount';

  logger.action.start(actionName, {
    name: input.name,
    type: input.type,
  });

  try {
    // 입력 검증
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new Error('Account name is required');
    }
    if (input.name.length > 200) {
      throw new Error('Account name is too long (max 200 characters)');
    }
    if (!input.type || !['general_hospital', 'hospital', 'clinic', 'pharmacy'].includes(input.type)) {
      throw new Error('Invalid account type');
    }
    if (input.address && input.address.length > 500) {
      throw new Error('Address is too long (max 500 characters)');
    }
    if (input.phone && !/^[0-9-]+$/.test(input.phone)) {
      throw new Error('Phone number contains invalid characters');
    }
    if (input.phone && input.phone.length > 20) {
      throw new Error('Phone number is too long (max 20 characters)');
    }
    if (input.specialty && input.specialty.length > 100) {
      throw new Error('Specialty is too long (max 100 characters)');
    }
    if (input.patient_count !== undefined && (typeof input.patient_count !== 'number' || input.patient_count < 0 || input.patient_count > 10000000)) {
      throw new Error('Patient count must be between 0 and 10,000,000');
    }
    if (input.revenue !== undefined && (typeof input.revenue !== 'number' || input.revenue < 0 || input.revenue > 1000000000000)) {
      throw new Error('Revenue must be between 0 and 1,000,000,000,000');
    }
    if (input.notes && input.notes.length > 2000) {
      throw new Error('Notes is too long (max 2000 characters)');
    }

    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    logger.db.query('INSERT INTO accounts', {
      name: input.name,
      type: input.type,
    });

    // Account 생성
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: input.name.trim(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        type: input.type,
        specialty: input.specialty?.trim() || null,
        patient_count: input.patient_count || 0,
        revenue: input.revenue || 0,
        notes: input.notes?.trim() || null,
        tier: input.tier || 'B',
      })
      .select()
      .single();

    if (error) {
      logger.db.error('INSERT INTO accounts', error as Error, {
        name: input.name,
      });
      throw new Error(`Failed to create account: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    logger.action.end(actionName, duration, {
      account_id: data.id,
    });

    return data as Account;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

