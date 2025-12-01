'use server';

/**
 * Prescription 삭제 Server Action
 * 
 * Prescription을 삭제합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function deletePrescription(
  prescriptionId: string
): Promise<void> {
  console.group('deletePrescription: 시작');
  console.log('삭제할 Prescription ID:', prescriptionId);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 조회
    const { data: existing, error: fetchError } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('id', prescriptionId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Prescription not found');
    }

    // Prescription 삭제
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', prescriptionId);

    if (error) {
      console.error('Prescription 삭제 실패:', error);
      throw new Error(`Failed to delete prescription: ${error.message}`);
    }

    console.log('Prescription 삭제 성공');
    console.groupEnd();
  } catch (error) {
    console.error('deletePrescription 에러:', error);
    console.groupEnd();
    throw error;
  }
}

