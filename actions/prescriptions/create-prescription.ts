'use server';

/**
 * Prescription 생성 Server Action
 * 
 * 처방 정보를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';

export interface CreatePrescriptionInput {
  account_id: string;
  contact_id?: string | null;
  related_activity_id?: string | null;
  product_name: string;
  product_code?: string | null;
  quantity: number;
  quantity_unit?: string;
  price?: number;
  prescription_date?: Date | string;
  notes?: string | null;
}

export async function createPrescription(
  input: CreatePrescriptionInput
): Promise<Prescription> {
  console.group('createPrescription: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Prescription 생성
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        account_id: input.account_id,
        contact_id: input.contact_id || null,
        related_activity_id: input.related_activity_id || null,
        product_name: input.product_name,
        product_code: input.product_code || null,
        quantity: input.quantity,
        quantity_unit: input.quantity_unit || 'box',
        price: input.price || 0,
        prescription_date: input.prescription_date
          ? new Date(input.prescription_date).toISOString()
          : new Date().toISOString(),
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Prescription 생성 실패:', error);
      throw new Error(`Failed to create prescription: ${error.message}`);
    }

    console.log('Prescription 생성 성공:', data);
    console.groupEnd();
    return data as Prescription;
  } catch (error) {
    console.error('createPrescription 에러:', error);
    console.groupEnd();
    throw error;
  }
}

