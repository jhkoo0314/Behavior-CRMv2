'use server';

/**
 * Account 생성 Server Action
 * 
 * 병원 정보를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
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
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  console.group('createAccount: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Account 생성
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
        type: input.type,
        specialty: input.specialty || null,
        patient_count: input.patient_count || 0,
        revenue: input.revenue || 0,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Account 생성 실패:', error);
      throw new Error(`Failed to create account: ${error.message}`);
    }

    console.log('Account 생성 성공:', data);
    console.groupEnd();
    return data as Account;
  } catch (error) {
    console.error('createAccount 에러:', error);
    console.groupEnd();
    throw error;
  }
}

