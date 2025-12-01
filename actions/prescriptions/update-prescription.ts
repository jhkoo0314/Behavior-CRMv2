'use server';

/**
 * Prescription 수정 Server Action
 * 
 * Prescription을 수정합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Prescription } from '@/types/database.types';

export interface UpdatePrescriptionInput {
  id: string;
  account_id?: string;
  contact_id?: string | null;
  related_activity_id?: string | null;
  product_name?: string;
  product_code?: string | null;
  quantity?: number;
  quantity_unit?: string;
  price?: number;
  prescription_date?: Date | string;
  notes?: string | null;
}

export async function updatePrescription(
  input: UpdatePrescriptionInput
): Promise<Prescription> {
  console.group('updatePrescription: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 조회
    const { data: existing, error: fetchError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', input.id)
      .single();

    if (fetchError || !existing) {
      throw new Error('Prescription not found');
    }

    console.log('수정 전 데이터:', existing);

    // 업데이트할 필드만 추출
    const updateData: Partial<Prescription> = {};
    if (input.account_id !== undefined) updateData.account_id = input.account_id;
    if (input.contact_id !== undefined)
      updateData.contact_id = input.contact_id || null;
    if (input.related_activity_id !== undefined)
      updateData.related_activity_id = input.related_activity_id || null;
    if (input.product_name !== undefined)
      updateData.product_name = input.product_name;
    if (input.product_code !== undefined)
      updateData.product_code = input.product_code || null;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.quantity_unit !== undefined)
      updateData.quantity_unit = input.quantity_unit;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.prescription_date !== undefined) {
      updateData.prescription_date =
        input.prescription_date instanceof Date
          ? input.prescription_date.toISOString()
          : input.prescription_date;
    }
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    const { data, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Prescription 수정 실패:', error);
      throw new Error(`Failed to update prescription: ${error.message}`);
    }

    console.log('수정 후 데이터:', data);
    console.groupEnd();
    return data as Prescription;
  } catch (error) {
    console.error('updatePrescription 에러:', error);
    console.groupEnd();
    throw error;
  }
}

