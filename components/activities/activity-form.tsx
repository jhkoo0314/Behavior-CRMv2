'use client';

/**
 * Behavior-Driven Activity Form 컴포넌트 (MVP)
 * 
 * 영업사원의 행동 데이터를 입력하는 새로운 3단계 폼입니다.
 * - Step 1: 기본 정보 입력 (병원, 활동 결과, 수행 일시)
 * - Step 2: 핵심 내용 태깅 (복수 선택, 최소 1개)
 * - Step 3: 인사이트 및 계획 (관계 온도, 다음 활동 예정일, 메모)
 * 
 * 주요 기능:
 * - HIR 측정: 폼 시작 시간부터 제출 시간까지 자동 계산
 * - 진행률 표시: 상단 progress bar
 * - 단계별 검증
 * - 반응형 디자인
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import { getRecentAccounts } from '@/actions/accounts/get-recent-accounts';
import {
  ACTIVITY_TAGS,
  ACTIVITY_TAG_LABELS,
  type ActivityTagId,
} from '@/constants/activity-tags';

const activityFormSchema = z.object({
  account_id: z.string().min(1, '병원을 선택해주세요'),
  outcome: z.enum(['won', 'ongoing', 'lost'], {
    required_error: '활동 결과를 선택해주세요',
  }),
  performed_at: z.string().min(1, '수행 일시를 입력해주세요'),
  tags: z
    .array(z.string())
    .min(1, '최소 1개의 태그를 선택해야 서버 분석이 가능합니다'),
  sentiment_score: z.number().int().min(0).max(100),
  next_action_date: z.string().min(1, '다음 활동 예정일은 PHR 관리에 필수입니다'),
  description: z.string().max(5000, '메모는 5000자 이하여야 합니다').optional(),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  activity?: Activity;
  accounts: Account[];
  onSubmit: (data: ActivityFormData & { dwell_time_seconds: number }) => Promise<void>;
  onCancel?: () => void;
}

export function ActivityForm({
  activity,
  accounts,
  onSubmit,
}: ActivityFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([]);
  const [startTime] = useState<number>(Date.now()); // HIR 측정 시작점

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

  // next_action_date를 date 형식으로 변환
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          account_id: activity.account_id,
          outcome: activity.outcome || 'ongoing',
          performed_at: formatDateTimeLocal(activity.performed_at),
          tags: activity.tags || [],
          sentiment_score: activity.sentiment_score ?? 50,
          next_action_date: formatDate(activity.next_action_date),
          description: activity.description || '',
        }
      : {
          account_id: accounts[0]?.id || '',
          outcome: 'ongoing',
          performed_at: formatDateTimeLocal(new Date().toISOString()),
          tags: [],
          sentiment_score: 50,
          next_action_date: (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 7); // 기본값: 일주일 후
            return formatDate(tomorrow.toISOString());
          })(),
          description: '',
        },
  });


  // 진행률 계산 (33%, 66%, 100%)
  const progress = useMemo(() => {
    return (step / 3) * 100;
  }, [step]);

  // 관계 온도 점수 표시 클래스
  const getScoreDisplayClass = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score <= 30) return 'text-red-600';
    return 'text-yellow-600';
  };

  const handleSubmit = async (data: ActivityFormData) => {
    console.group('ActivityForm: 제출');
    console.log('폼 데이터:', data);

    // HIR 측정: 체류 시간 계산
    const endTime = Date.now();
    const dwellTimeSeconds = Math.floor((endTime - startTime) / 1000);

    console.log('HIR 측정:', {
      startTime,
      endTime,
      dwellTimeSeconds,
    });

    try {
      await onSubmit({
        ...data,
        dwell_time_seconds: dwellTimeSeconds,
      });
      toast.success(`저장 완료! (입력 시간: ${dwellTimeSeconds}초 - HIR 반영됨)`);
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
    if (step === 1) {
      // Step 1 검증
      const isValid = await form.trigger(['account_id', 'outcome', 'performed_at']);
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      // Step 2 검증: 태그 최소 1개
      const isValid = await form.trigger(['tags']);
      if (isValid) {
        setStep(3);
      } else {
        toast.error('최소 1개의 태그를 선택해야 서버 분석이 가능합니다');
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const toggleTag = (tagId: ActivityTagId) => {
    const currentTags = form.getValues('tags');
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    form.setValue('tags', newTags);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold" id="headerTitle">
            {step === 1 && '1. 기본 정보 입력'}
            {step === 2 && '2. 핵심 내용 태깅'}
            {step === 3 && '3. 인사이트 및 계획'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1" id="headerSubtitle">
            {step === 1 && '누구를 만나서 결과가 어땠나요?'}
            {step === 2 && '어떤 대화가 오고 갔나요? (복수 선택)'}
            {step === 3 && '관계 온도와 다음 약속을 잡으세요.'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[400px] flex flex-col">
          {/* Step 1: 기본 정보 입력 */}
          {step === 1 && (
            <div className="space-y-5 flex-1 animate-in fade-in slide-in-from-right-4 duration-400">
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>방문 병원</FormLabel>
                    <FormControl>
                      <Combobox
                        options={accountOptions}
                        value={field.value}
                        onValueChange={field.onChange}
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
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>활동 결과 *</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Won Card */}
                        <button
                          type="button"
                          onClick={() => field.onChange('won')}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                            field.value === 'won'
                              ? 'border-green-600 bg-green-50'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <CheckCircle2Icon
                            className={`size-6 mb-2 ${
                              field.value === 'won' ? 'text-green-600' : 'text-muted-foreground'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              field.value === 'won' ? 'text-green-600' : 'text-muted-foreground'
                            }`}
                          >
                            성공/긍정
                          </span>
                        </button>

                        {/* Ongoing Card */}
                        <button
                          type="button"
                          onClick={() => field.onChange('ongoing')}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                            field.value === 'ongoing'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <ClockIcon
                            className={`size-6 mb-2 ${
                              field.value === 'ongoing' ? 'text-blue-600' : 'text-muted-foreground'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              field.value === 'ongoing' ? 'text-blue-600' : 'text-muted-foreground'
                            }`}
                          >
                            진행/보류
                          </span>
                        </button>

                        {/* Lost Card */}
                        <button
                          type="button"
                          onClick={() => field.onChange('lost')}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                            field.value === 'lost'
                              ? 'border-red-600 bg-red-50'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <XCircleIcon
                            className={`size-6 mb-2 ${
                              field.value === 'lost' ? 'text-red-600' : 'text-muted-foreground'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              field.value === 'lost' ? 'text-red-600' : 'text-muted-foreground'
                            }`}
                          >
                            거절/실패
                          </span>
                        </button>
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
                    <FormLabel>수행 일시</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: 핵심 내용 태깅 */}
          {step === 2 && (
            <div className="space-y-5 flex-1 animate-in fade-in slide-in-from-right-4 duration-400">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>핵심 내용 태깅 *</FormLabel>
                    <p className="text-xs text-muted-foreground mb-3">
                      서버가 상황을 분석할 수 있도록 키워드를 선택해주세요. (HIR, RTR 검증용)
                    </p>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {ACTIVITY_TAGS.map((tag) => {
                          const isSelected = field.value.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border hover:bg-muted'
                              }`}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted p-4 rounded-lg mt-auto">
                <p className="text-xs text-muted-foreground m-0">
                  <strong className="font-semibold">💡 Logic-Driven Tip:</strong>
                  <br />
                  &apos;부정 태그&apos; 선택 후 &apos;높은 점수&apos;를 입력하면 서버 로직에 의해 재검증 대상이
                  됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: 인사이트 및 계획 */}
          {step === 3 && (
            <div className="space-y-5 flex-1 animate-in fade-in slide-in-from-right-4 duration-400">
              <FormField
                control={form.control}
                name="sentiment_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center w-full">
                      관계 온도 (RTR)
                      <span className={`font-bold ${getScoreDisplayClass(field.value)}`}>
                        {field.value}도
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4 px-2">
                        <span className="text-xl">👎</span>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          className="flex-1"
                        />
                        <span className="text-xl">👍</span>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      * 직전 방문 온도와 비교하여 관계 변화율이 계산됩니다.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <hr className="border-t border-border my-6" />

              <FormField
                control={form.control}
                name="next_action_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>다음 활동 예정일 (PHR 관리) *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-red-600 mt-1">
                      * 미입력 시 &apos;Dead Lead&apos;로 분류되어 PHR 점수가 하락합니다.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모 (선택사항)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="특이사항이 있다면 남겨주세요."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              className="flex-1 min-h-[44px]"
            >
              이전
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-[2] min-h-[44px]"
            >
              다음 단계
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-[2] min-h-[44px]"
            >
              {form.formState.isSubmitting ? '저장 중...' : '활동 저장하기'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
