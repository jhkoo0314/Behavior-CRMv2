'use server';

/**
 * Account 삭제 Server Action
 * 
 * 병원 정보를 삭제합니다. 관련된 Contact와 Activity도 CASCADE로 삭제됩니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function deleteAccount(accountId: string): Promise<void> {
  console.group('deleteAccount: 시작');
  console.log('삭제할 Account ID:', accountId);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Account 삭제 (CASCADE로 관련 데이터도 삭제됨)
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);

    if (error) {
      console.error('Account 삭제 실패:', error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    console.log('Account 삭제 성공');
    console.groupEnd();
  } catch (error) {
    console.error('deleteAccount 에러:', error);
    console.groupEnd();
    throw error;
  }
}

