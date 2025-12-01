'use client';

/**
 * 경쟁사 신호 수동 입력 폼 컴포넌트
 * 
 * 영업사원이 현장에서 직접 경쟁사 신호를 입력하는 폼입니다.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { Account } from '@/types/database.types';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { getRecentAccounts } from '@/actions/accounts/get-recent-accounts';
import {
  COMPETITOR_SIGNAL_TYPE_LIST,
  COMPETITOR_SIGNAL_TYPE_LABELS,
} from '@/constants/competitor-signal-types';
import { createCompetitorSignal } from '@/actions/competitor-signals/create-competitor-signal';
import { toast } from 'sonner';

const competitorSignalFormSchema = z.object({
  account_id: z.string().min(1, '병원을 선택해주세요'),
  contact_id: z.string().nullable().optional(),
  competitor_name: z.string().min(1, '경쟁사명을 입력해주세요'),
  type: z.string().min(1, '신호 유형을 선택해주세요'),
  description: z.string().min(1, '상세 내용을 입력해주세요'),
  detected_at: z.string().min(1, '탐지 일시를 입력해주세요'),
});

export type CompetitorSignalFormData = z.infer<
  typeof competitorSignalFormSchema
>;

interface CompetitorSignalFormProps {
  accounts?: Account[];
  onSubmit?: (data: CompetitorSignalFormData) => Promise<void>;
  onCancel?: () => void;
}

export function CompetitorSignalForm({
  accounts: initialAccounts,
  onSubmit: externalOnSubmit,
  onCancel,
}: CompetitorSignalFormProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts || []);
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // 계정 목록 로드
  useEffect(() => {
    if (initialAccounts && initialAccounts.length > 0) {
      setAccounts(initialAccounts);
    } else {
      getAccounts()
        .then((result) => {
          setAccounts(result.data);
        })
        .catch((error) => {
          console.error('계정 목록 로드 실패:', error);
        });
    }
  }, [initialAccounts]);

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

  // Combobox 옵션 생성
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

  const form = useForm<CompetitorSignalFormData>({
    resolver: zodResolver(competitorSignalFormSchema),
    defaultValues: {
      account_id: accounts[0]?.id || '',
      contact_id: null,
      competitor_name: '',
      type: COMPETITOR_SIGNAL_TYPE_LIST[0],
      description: '',
      detected_at: formatDateTimeLocal(new Date().toISOString()),
    },
  });

  const handleSubmit = async (data: CompetitorSignalFormData) => {
    console.group('CompetitorSignalForm: 제출');
    console.log('폼 데이터:', data);
    setLoading(true);

    try {
      if (externalOnSubmit) {
        await externalOnSubmit(data);
      } else {
        await createCompetitorSignal({
          account_id: data.account_id,
          contact_id: data.contact_id,
          competitor_name: data.competitor_name,
          type: data.type,
          description: data.description,
          detected_at: new Date(data.detected_at).toISOString(),
        });
        toast.success('경쟁사 신호가 기록되었습니다');
        form.reset();
      }
    } catch (error) {
      console.error('경쟁사 신호 저장 실패:', error);
      if (error instanceof Error) {
        toast.error('저장에 실패했습니다: ' + error.message);
      } else {
        toast.error('저장에 실패했습니다');
      }
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>대상 병원 *</FormLabel>
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
          name="competitor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>경쟁사명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="경쟁사명을 입력하세요" />
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
              <FormLabel>신호 유형 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="신호 유형을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMPETITOR_SIGNAL_TYPE_LIST.map((type) => (
                    <SelectItem key={type} value={type}>
                      {COMPETITOR_SIGNAL_TYPE_LABELS[type]}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 내용 *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="구체적인 상황을 묘사해주세요"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="detected_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>탐지 일시 *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
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
          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

