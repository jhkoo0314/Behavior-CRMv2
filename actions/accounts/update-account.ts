'use server';

/**
 * Account 수정 Server Action
 * 
 * 병원 정보를 수정합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Account } from '@/types/database.types';

export interface UpdateAccountInput {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  type?: 'general_hospital' | 'hospital' | 'clinic' | 'pharmacy';
  specialty?: string;
  patient_count?: number;
  revenue?: number;
  notes?: string;
  tier?: 'S' | 'A' | 'B' | 'RISK';
}

export async function updateAccount(input: UpdateAccountInput): Promise<Account> {
  console.group('updateAccount: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 조회 (로깅용)
    const { data: existing } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', input.id)
      .single();

    if (!existing) {
      throw new Error('Account not found');
    }

    console.log('수정 전 데이터:', existing);

    // 업데이트할 필드만 추출
    const updateData: Partial<Account> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address !== undefined) updateData.address = input.address || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.specialty !== undefined) updateData.specialty = input.specialty || null;
    if (input.patient_count !== undefined) updateData.patient_count = input.patient_count;
    if (input.revenue !== undefined) updateData.revenue = input.revenue;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.tier !== undefined) updateData.tier = input.tier;

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Account 수정 실패:', error);
      throw new Error(`Failed to update account: ${error.message}`);
    }

    console.log('수정 후 데이터:', data);
    console.groupEnd();
    return data as Account;
  } catch (error) {
    console.error('updateAccount 에러:', error);
    console.groupEnd();
    throw error;
  }
}

