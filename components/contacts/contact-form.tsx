'use client';

/**
 * Contact 입력 폼 컴포넌트
 * 
 * 담당자 정보를 입력하고 수정하는 폼입니다.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact } from '@/types/database.types';
import type { Account } from '@/types/database.types';

const contactFormSchema = z.object({
  account_id: z.string().min(1, '병원을 선택해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  specialty: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  contact?: Contact;
  accounts: Account[];
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ContactForm({
  contact,
  accounts,
  onSubmit,
  onCancel,
}: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contact
      ? {
          account_id: contact.account_id,
          name: contact.name,
          role: contact.role || '',
          phone: contact.phone || '',
          email: contact.email || '',
          specialty: contact.specialty || '',
          notes: contact.notes || '',
        }
      : {
          account_id: accounts[0]?.id || '',
          name: '',
          role: '',
          phone: '',
          email: '',
          specialty: '',
          notes: '',
        },
  });

  const handleSubmit = async (data: ContactFormData) => {
    console.group('ContactForm: 제출');
    console.log('폼 데이터:', data);
    await onSubmit(data);
    console.groupEnd();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>병원 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                disabled={!!contact} // 수정 시에는 병원 변경 불가
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="병원을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="이름을 입력하세요" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <FormControl>
                <Input {...field} placeholder="의사, 약사, 스탭 등" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>전화번호</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="전화번호를 입력하세요" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder="이메일을 입력하세요"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>전문 분야</FormLabel>
              <FormControl>
                <Input {...field} placeholder="전문 분야를 입력하세요" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="담당자에 대한 추가 정보를 입력하세요"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? '저장 중...'
              : contact
                ? '수정'
                : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

