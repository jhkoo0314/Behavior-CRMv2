'use client';

/**
 * Activity 입력 폼 컴포넌트 (PRD 기반 개선)
 * 
 * 영업사원의 행동 데이터를 입력하고 수정하는 폼입니다.
 * - Step UI (2단계)
 * - Slider (품질/양적 점수)
 * - Radio Group (활동 유형)
 * - Combobox (병원 선택, 최근 방문 병원 상단 노출)
 * - Smart Selection 로직
 */

import { useState, useEffect, useMemo } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { MinusIcon, PlusIcon } from 'lucide-react';
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
import { getRecentAccounts } from '@/actions/accounts/get-recent-accounts';
import { toast } from 'sonner';

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
    .max(5000, '설명은 5000자 이하여야 합니다')
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // 선택사항이므로 빈 값 허용
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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activity?.account_id || accounts[0]?.id || ''
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([]);

  // 최근 방문 병원 로드
  useEffect(() => {
    getRecentAccounts()
      .then((data) => {
        setRecentAccounts(data);
      })
      .catch((error) => {
        console.error('최근 방문 병원 로드 실패:', error);
        setRecentAccounts([]);
      });
  }, []);

  // Combobox 옵션 생성 (최근 방문 병원 상단 노출)
  const accountOptions: ComboboxOption[] = useMemo(() => {
    const recentIds = new Set(recentAccounts.map((acc) => acc.id));
    const recent: ComboboxOption[] = recentAccounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
      isRecent: true,
    }));
    const normal: ComboboxOption[] = accounts
      .filter((acc) => !recentIds.has(acc.id))
      .map((acc) => ({
        value: acc.id,
        label: acc.name,
        isRecent: false,
      }));
    return [...recent, ...normal];
  }, [accounts, recentAccounts]);

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
          description: activity.description || '',
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

  const activityType = form.watch('type');
  const accountId = form.watch('account_id');
  const qualityScore = form.watch('quality_score');
  const quantityScore = form.watch('quantity_score');

  // Smart Selection: 활동 유형별 기본값 자동 설정
  useEffect(() => {
    if (activity) return; // 수정 모드에서는 자동 설정 안 함

    switch (activityType) {
      case 'visit':
        form.setValue('duration_minutes', 30);
        break;
      case 'call':
        form.setValue('duration_minutes', 5);
        break;
      case 'message':
        form.setValue('duration_minutes', 0);
        break;
      default:
        // 다른 타입은 기본값 유지
        break;
    }
  }, [activityType, form, activity]);

  // account_id가 변경되면 contact_id 초기화 및 담당자 목록 로드
  useEffect(() => {
    if (accountId && accountId !== selectedAccountId) {
      setSelectedAccountId(accountId);
      form.setValue('contact_id', null);
    }
  }, [accountId, selectedAccountId, form]);

  const handleSubmit = async (data: ActivityFormData) => {
    console.group('ActivityForm: 제출');
    console.log('폼 데이터:', data);
    try {
      await onSubmit(data);
      toast.success('활동이 기록되었습니다');
      form.reset();
    } catch (error) {
      console.error('Activity 저장 실패:', error);
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('Network')) {
          toast.error('네트워크 오류가 발생했습니다');
        } else {
          toast.error('저장에 실패했습니다: ' + error.message);
        }
      } else {
        toast.error('저장에 실패했습니다');
      }
      throw error;
    }
    console.groupEnd();
  };

  const handleNext = async () => {
    // Step 1 필드 검증
    const isValid = await form.trigger(['account_id', 'type', 'behavior']);
    if (isValid) {
      setStep(2);
    }
  };

  const handlePrev = () => {
    setStep(1);
  };

  const adjustDuration = (delta: number) => {
    const current = form.getValues('duration_minutes') || 0;
    const newValue = Math.max(0, current + delta);
    form.setValue('duration_minutes', newValue);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Step 진행 표시 */}
        <div className="flex items-center justify-center gap-2 pb-4">
          <div
            className={`h-2 w-12 rounded-full ${
              step === 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-2 w-12 rounded-full ${
              step === 2 ? 'bg-primary' : 'bg-muted'
            }`}
          />
        </div>

        {step === 1 ? (
          // Step 1: 기본 정보
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>병원 *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={accountOptions}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedAccountId(value);
                      }}
                      placeholder="병원을 검색하세요..."
                      searchPlaceholder="병원명으로 검색..."
                      emptyText="병원을 찾을 수 없습니다."
                    />
                  </FormControl>
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>활동 유형 *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                    >
                      {ACTIVITY_TYPE_LIST.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={type} />
                          <label
                            htmlFor={type}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {ACTIVITY_TYPE_LABELS[type]}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="behavior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>행동 목적 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="행동 목적을 선택하세요" />
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

            <div className="flex justify-end gap-2 pt-4 pb-safe">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="min-h-[44px] min-w-[44px]"
                >
                  취소
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] min-w-[44px]"
              >
                다음
              </Button>
            </div>
          </div>
        ) : (
          // Step 2: 상세 정보
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="quality_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>품질 점수: {field.value}점</FormLabel>
                  <FormControl>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full touch-manipulation"
                      />
                    </div>
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
                  <FormLabel>양적 점수: {field.value}점</FormLabel>
                  <FormControl>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full touch-manipulation"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>내용 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
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
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>소요 시간 (분)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => adjustDuration(-10)}
                          className="h-10 w-10"
                        >
                          <MinusIcon className="size-4" />
                        </Button>
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
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => adjustDuration(10)}
                          className="h-10 w-10"
                        >
                          <PlusIcon className="size-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="flex justify-end gap-2 pt-4 pb-safe">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="min-h-[44px] min-w-[44px]"
              >
                이전
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-h-[44px] min-w-[44px]"
              >
                {form.formState.isSubmitting
                  ? '저장 중...'
                  : activity
                    ? '수정'
                    : '저장'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
