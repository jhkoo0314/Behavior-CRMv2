/**
 * @file feedback-form.tsx
 * @description 피드백 입력 폼 컴포넌트
 *
 * 사용자 피드백을 수집하는 폼입니다.
 * - 피드백 타입 선택 (버그 리포트, 기능 제안, 사용법 문의 등)
 * - 피드백 내용 입력
 * - Supabase feedback 테이블에 저장
 */

'use client';

import { useState } from 'react';
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
  FormDescription,
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
import { createFeedback } from '@/actions/feedback/create-feedback';
import { logger } from '@/lib/utils/logger';

const feedbackFormSchema = z.object({
  type: z.enum(['bug', 'feature', 'question', 'other'], {
    required_error: '피드백 타입을 선택해주세요',
  }),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하여야 합니다'),
  content: z
    .string()
    .min(10, '내용을 10자 이상 입력해주세요')
    .max(2000, '내용은 2000자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요').optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FEEDBACK_TYPE_LABELS = {
  bug: '버그 리포트',
  feature: '기능 제안',
  question: '사용법 문의',
  other: '기타',
} as const;

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: 'other',
      title: '',
      content: '',
      email: '',
    },
  });

  const handleSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    logger.info('피드백 제출 시작', { type: data.type });

    try {
      await createFeedback({
        type: data.type,
        title: data.title,
        content: data.content,
        email: data.email || undefined,
      });

      logger.info('피드백 제출 성공', { type: data.type });
      setSubmitSuccess(true);
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logger.error('피드백 제출 실패', error instanceof Error ? error : new Error(String(error)));
      alert('피드백 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-green-800">
          피드백이 제출되었습니다
        </h3>
        <p className="text-sm text-green-700">
          소중한 의견 감사합니다. 검토 후 답변드리겠습니다.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => setSubmitSuccess(false)}
        >
          추가 피드백 제출
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>피드백 타입 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="피드백 타입을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="피드백 제목을 입력하세요"
                  maxLength={200}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/200자
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>내용 *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="피드백 내용을 상세히 입력해주세요"
                  rows={6}
                  maxLength={2000}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/2000자 (최소 10자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일 (선택)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="답변을 받을 이메일 주소 (선택사항)"
                />
              </FormControl>
              <FormDescription>
                답변이 필요하시면 이메일을 입력해주세요
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '제출 중...' : '피드백 제출'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

