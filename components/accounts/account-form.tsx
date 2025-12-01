'use client';

/**
 * Account 입력 폼 컴포넌트
 * 
 * 병원 정보를 입력하고 수정하는 폼입니다.
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
import type { Account } from '@/types/database.types';

const accountFormSchema = z.object({
  name: z
    .string()
    .min(1, '병원명을 입력해주세요')
    .max(200, '병원명은 200자 이하여야 합니다'),
  address: z.string().max(500, '주소는 500자 이하여야 합니다').optional(),
  phone: z
    .string()
    .regex(/^[0-9-]+$/, '전화번호는 숫자와 하이픈만 사용할 수 있습니다')
    .max(20, '전화번호는 20자 이하여야 합니다')
    .optional(),
  type: z.enum(['general_hospital', 'hospital', 'clinic', 'pharmacy']),
  specialty: z.string().max(100, '진료과는 100자 이하여야 합니다').optional(),
  patient_count: z.number().int().min(0).max(10000000).optional(),
  revenue: z.number().int().min(0).max(1000000000000).optional(),
  notes: z.string().max(2000, '메모는 2000자 이하여야 합니다').optional(),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel?: () => void;
}

const ACCOUNT_TYPE_LABELS: Record<
  'general_hospital' | 'hospital' | 'clinic' | 'pharmacy',
  string
> = {
  general_hospital: '종합병원',
  hospital: '병원',
  clinic: '의원',
  pharmacy: '약국',
};

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? {
          name: account.name,
          address: account.address || '',
          phone: account.phone || '',
          type: account.type,
          specialty: account.specialty || '',
          patient_count: account.patient_count || 0,
          revenue: account.revenue || 0,
          notes: account.notes || '',
        }
      : {
          name: '',
          address: '',
          phone: '',
          type: 'clinic',
          specialty: '',
          patient_count: 0,
          revenue: 0,
          notes: '',
        },
  });

  const handleSubmit = async (data: AccountFormData) => {
    console.group('AccountForm: 제출');
    console.log('폼 데이터:', data);
    await onSubmit(data);
    console.groupEnd();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>병원명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="병원명을 입력하세요" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>병원 타입 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="병원 타입을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Input {...field} placeholder="주소를 입력하세요" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>진료과</FormLabel>
              <FormControl>
                <Input {...field} placeholder="진료과를 입력하세요" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>환자 수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : 0
                      )
                    }
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>매출 (원)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : 0
                      )
                    }
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="병원에 대한 추가 정보를 입력하세요"
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
              : account
                ? '수정'
                : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

