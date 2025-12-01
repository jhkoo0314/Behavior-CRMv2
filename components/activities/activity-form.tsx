'use client';

/**
 * Activity 입력 폼 컴포넌트
 * 
 * 영업사원의 행동 데이터를 입력하고 수정하는 폼입니다.
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
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';
import {
  ACTIVITY_TYPE_LIST,
  ACTIVITY_TYPE_LABELS,
  type ActivityType,
} from '@/constants/activity-types';
import {
  BEHAVIOR_TYPE_LIST,
  BEHAVIOR_TYPE_LABELS,
  type BehaviorType,
} from '@/constants/behavior-types';
import { getContacts } from '@/actions/contacts/get-contacts';

const activityFormSchema = z.object({
  account_id: z.string().min(1, '병원을 선택해주세요'),
  contact_id: z.string().nullable().optional(),
  type: z.enum([
    'visit',
    'call',
    'message',
    'presentation',
    'follow_up',
  ] as const),
  behavior: z.enum([
    'approach',
    'contact',
    'visit',
    'presentation',
    'question',
    'need_creation',
    'demonstration',
    'follow_up',
  ] as const),
  description: z
    .string()
    .min(1, '설명을 입력해주세요')
    .max(5000, '설명은 5000자 이하여야 합니다')
    .refine(
      (val) => {
        // XSS 방지: 위험한 태그나 스크립트 패턴 검사
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /onerror=/i,
          /onload=/i,
          /onclick=/i,
        ];
        return !dangerousPatterns.some((pattern) => pattern.test(val));
      },
      {
        message: '위험한 내용이 포함되어 있습니다',
      }
    ),
  quality_score: z.number().int().min(0).max(100),
  quantity_score: z.number().int().min(0).max(100),
  duration_minutes: z.number().int().min(0).optional(),
  performed_at: z.string().min(1, '수행 일시를 입력해주세요'),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  activity?: Activity;
  accounts: Account[];
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ActivityForm({
  activity,
  accounts,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activity?.account_id || accounts[0]?.id || ''
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

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

  // performed_at을 datetime-local 형식으로 변환
  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          account_id: activity.account_id,
          contact_id: activity.contact_id || null,
          type: activity.type,
          behavior: activity.behavior,
          description: activity.description,
          quality_score: activity.quality_score,
          quantity_score: activity.quantity_score,
          duration_minutes: activity.duration_minutes || 0,
          performed_at: formatDateTimeLocal(activity.performed_at),
        }
      : {
          account_id: accounts[0]?.id || '',
          contact_id: null,
          type: 'visit',
          behavior: 'approach',
          description: '',
          quality_score: 50,
          quantity_score: 50,
          duration_minutes: 0,
          performed_at: formatDateTimeLocal(new Date().toISOString()),
        },
  });

  const handleSubmit = async (data: ActivityFormData) => {
    console.group('ActivityForm: 제출');
    console.log('폼 데이터:', data);
    await onSubmit(data);
    console.groupEnd();
  };

  const accountId = form.watch('account_id');

  // account_id가 변경되면 contact_id 초기화 및 담당자 목록 로드
  useEffect(() => {
    if (accountId && accountId !== selectedAccountId) {
      setSelectedAccountId(accountId);
      form.setValue('contact_id', null);
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>활동 타입 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="활동 타입을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACTIVITY_TYPE_LIST.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACTIVITY_TYPE_LABELS[type]}
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
            name="behavior"
            render={({ field }) => (
              <FormItem>
                <FormLabel>행동 타입 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="행동 타입을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BEHAVIOR_TYPE_LIST.map((behavior) => (
                      <SelectItem key={behavior} value={behavior}>
                        {BEHAVIOR_TYPE_LABELS[behavior]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명 *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="활동에 대한 상세 설명을 입력하세요"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quality_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>품질 점수 (0-100) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
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
            name="quantity_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>양 점수 (0-100) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="performed_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수행 일시 *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상담 시간 (분)</FormLabel>
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
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? '저장 중...'
              : activity
                ? '수정'
                : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

