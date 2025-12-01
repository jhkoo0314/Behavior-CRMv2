'use server';

/**
 * Contact 수정 Server Action
 * 
 * 담당자 정보를 수정합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Contact } from '@/types/database.types';

export interface UpdateContactInput {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  notes?: string;
}

export async function updateContact(input: UpdateContactInput): Promise<Contact> {
  console.group('updateContact: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 데이터 조회 (로깅용)
    const { data: existing } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', input.id)
      .single();

    if (!existing) {
      throw new Error('Contact not found');
    }

    console.log('수정 전 데이터:', existing);

    // 업데이트할 필드만 추출
    const updateData: Partial<Contact> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.specialty !== undefined) updateData.specialty = input.specialty || null;
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Contact 수정 실패:', error);
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    console.log('수정 후 데이터:', data);
    console.groupEnd();
    return data as Contact;
  } catch (error) {
    console.error('updateContact 에러:', error);
    console.groupEnd();
    throw error;
  }
}

