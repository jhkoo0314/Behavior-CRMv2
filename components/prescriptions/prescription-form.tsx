'use client';

/**
 * Prescription 입력 폼 컴포넌트
 * 
 * 처방 정보를 입력하고 수정하는 폼입니다.
 */

import { useState, useEffect } from 'react';
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
import type { Prescription } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';
import type { Activity } from '@/types/database.types';
import { getContacts } from '@/actions/contacts/get-contacts';
import { getActivities } from '@/actions/activities/get-activities';

const prescriptionFormSchema = z.object({
  account_id: z.string().min(1, '병원을 선택해주세요'),
  contact_id: z.string().nullable().optional(),
  related_activity_id: z.string().nullable().optional(),
  product_name: z.string().min(1, '제품명을 입력해주세요'),
  product_code: z.string().optional().nullable(),
  quantity: z.number().int().min(0, '수량은 0 이상이어야 합니다'),
  quantity_unit: z.string().min(1, '수량 단위를 선택해주세요'),
  price: z.number().min(0, '가격은 0 이상이어야 합니다').optional(),
  prescription_date: z.string().min(1, '처방일을 입력해주세요'),
  notes: z.string().optional().nullable(),
});

export type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>;

interface PrescriptionFormProps {
  prescription?: Prescription;
  accounts: Account[];
  onSubmit: (data: PrescriptionFormData) => Promise<void>;
  onCancel?: () => void;
}

export function PrescriptionForm({
  prescription,
  accounts,
  onSubmit,
  onCancel,
}: PrescriptionFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    prescription?.account_id || accounts[0]?.id || ''
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // 선택한 병원의 담당자 목록 로드
  useEffect(() => {
    if (selectedAccountId) {
      setLoadingContacts(true);
      getContacts({ account_id: selectedAccountId })
        .then((data) => {
          setContacts(data);
          setLoadingContacts(false);
        })
        .catch((error) => {
          console.error('담당자 목록 로드 실패:', error);
          setContacts([]);
          setLoadingContacts(false);
        });
    } else {
      setContacts([]);
    }
  }, [selectedAccountId]);

  // 선택한 병원의 Activity 목록 로드
  useEffect(() => {
    if (selectedAccountId) {
      setLoadingActivities(true);
      getActivities({ account_id: selectedAccountId, limit: 100 })
        .then((result) => {
          setActivities(result.data);
          setLoadingActivities(false);
        })
        .catch((error) => {
          console.error('활동 목록 로드 실패:', error);
          setActivities([]);
          setLoadingActivities(false);
        });
    } else {
      setActivities([]);
    }
  }, [selectedAccountId]);

  // prescription_date를 date 형식으로 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: prescription
      ? {
          account_id: prescription.account_id,
          contact_id: prescription.contact_id || null,
          related_activity_id: prescription.related_activity_id || null,
          product_name: prescription.product_name,
          product_code: prescription.product_code || null,
          quantity: prescription.quantity,
          quantity_unit: prescription.quantity_unit,
          price: prescription.price,
          prescription_date: formatDate(prescription.prescription_date),
          notes: prescription.notes || null,
        }
      : {
          account_id: accounts[0]?.id || '',
          contact_id: null,
          related_activity_id: null,
          product_name: '',
          product_code: null,
          quantity: 0,
          quantity_unit: 'box',
          price: 0,
          prescription_date: formatDate(new Date().toISOString()),
          notes: null,
        },
  });

  const handleSubmit = async (data: PrescriptionFormData) => {
    console.group('PrescriptionForm: 제출');
    console.log('폼 데이터:', data);
    await onSubmit(data);
    console.groupEnd();
  };

  const accountId = form.watch('account_id');

  // account_id가 변경되면 contact_id, related_activity_id 초기화 및 목록 로드
  useEffect(() => {
    if (accountId && accountId !== selectedAccountId) {
      setSelectedAccountId(accountId);
      form.setValue('contact_id', null);
      form.setValue('related_activity_id', null);
    }
  }, [accountId, selectedAccountId, form]);

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
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedAccountId(value);
                }}
                defaultValue={field.value}
                value={field.value}
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
          name="contact_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>담당자</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? null : value)
                }
                value={field.value || 'none'}
                disabled={loadingContacts || contacts.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingContacts
                          ? '로딩 중...'
                          : contacts.length === 0
                            ? '담당자가 없습니다'
                            : '담당자를 선택하세요 (선택사항)'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
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
          name="related_activity_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>관련 활동</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? null : value)
                }
                value={field.value || 'none'}
                disabled={loadingActivities || activities.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingActivities
                          ? '로딩 중...'
                          : activities.length === 0
                            ? '활동이 없습니다'
                            : '관련 활동을 선택하세요 (선택사항)'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {new Date(activity.performed_at).toLocaleString('ko-KR')} -{' '}
                      {activity.description.substring(0, 50)}
                      {activity.description.length > 50 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제품명 *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="제품명을 입력하세요" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제품 코드</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="제품 코드 (선택사항)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수량 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : 0
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>단위 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="단위를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="box">박스</SelectItem>
                    <SelectItem value="bottle">병</SelectItem>
                    <SelectItem value="tablet">정</SelectItem>
                    <SelectItem value="vial">바이얼</SelectItem>
                    <SelectItem value="unit">단위</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>가격</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : 0
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
          name="prescription_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>처방일 *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                  value={field.value || ''}
                  placeholder="추가 메모를 입력하세요 (선택사항)"
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
              : prescription
                ? '수정'
                : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

