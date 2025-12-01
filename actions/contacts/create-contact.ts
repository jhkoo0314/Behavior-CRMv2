'use server';

/**
 * Contact 생성 Server Action
 * 
 * 담당자 정보를 생성합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Contact } from '@/types/database.types';

export interface CreateContactInput {
  account_id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  notes?: string;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  console.group('createContact: 시작');
  console.log('입력 데이터:', input);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClerkSupabaseClient();

    // Contact 생성
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        account_id: input.account_id,
        name: input.name,
        role: input.role || null,
        phone: input.phone || null,
        email: input.email || null,
        specialty: input.specialty || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Contact 생성 실패:', error);
      throw new Error(`Failed to create contact: ${error.message}`);
    }

    console.log('Contact 생성 성공:', data);
    console.groupEnd();
    return data as Contact;
  } catch (error) {
    console.error('createContact 에러:', error);
    console.groupEnd();
    throw error;
  }
}

