'use server';

/**
 * Contact 조회 Server Action
 * 
 * 담당자 목록을 조회합니다. account_id 필터링이 필수입니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Contact } from '@/types/database.types';

export interface GetContactsInput {
  account_id: string; // 필수
}

export async function getContacts(
  input: GetContactsInput
): Promise<Contact[]> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Contact 조회 (account_id 필터링)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', input.account_id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Contact 조회 실패:', error);
      throw new Error(`Failed to get contacts: ${error.message}`);
    }

    return (data || []) as Contact[];
  } catch (error) {
    console.error('getContacts 에러:', error);
    throw error;
  }
}

