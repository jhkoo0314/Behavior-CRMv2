'use server';

/**
 * Contact 삭제 Server Action
 * 
 * 담당자 정보를 삭제합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function deleteContact(contactId: string): Promise<void> {
  console.group('deleteContact: 시작');
  console.log('삭제할 Contact ID:', contactId);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Contact 삭제
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);

    if (error) {
      console.error('Contact 삭제 실패:', error);
      throw new Error(`Failed to delete contact: ${error.message}`);
    }

    console.log('Contact 삭제 성공');
    console.groupEnd();
  } catch (error) {
    console.error('deleteContact 에러:', error);
    console.groupEnd();
    throw error;
  }
}

