/**
 * @file create-feedback.ts
 * @description 피드백 생성 Server Action
 *
 * 사용자 피드백을 저장합니다.
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { logger } from '@/lib/utils/logger';

export interface CreateFeedbackInput {
  type: 'bug' | 'feature' | 'question' | 'other';
  title: string;
  content: string;
  email?: string;
}

/**
 * 피드백을 생성합니다.
 *
 * @param input 피드백 데이터
 * @returns 생성된 피드백 ID
 */
export async function createFeedback(
  input: CreateFeedbackInput
): Promise<{ id: string }> {
  const startTime = Date.now();
  const actionName = 'createFeedback';

  logger.action.start(actionName, {
    type: input.type,
  });

  try {
    // 입력 검증
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (input.title.length > 200) {
      throw new Error('Title is too long (max 200 characters)');
    }
    if (!input.content || input.content.trim().length < 10) {
      throw new Error('Content must be at least 10 characters');
    }
    if (input.content.length > 2000) {
      throw new Error('Content is too long (max 2000 characters)');
    }
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('Invalid email address');
    }

    const { userId } = await auth();
    const supabase = getServiceRoleClient();

    // feedback 테이블이 없으면 생성 (임시)
    // 실제로는 마이그레이션으로 생성해야 함
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId || null,
        type: input.type,
        title: input.title.trim(),
        content: input.content.trim(),
        email: input.email?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      // feedback 테이블이 없을 수 있으므로 경고만 출력
      logger.warn('피드백 저장 실패 (테이블이 없을 수 있음)', {
        error: error.message,
      });
      // 개발 환경에서는 에러를 throw하지 않고 성공으로 처리
      if (process.env.NODE_ENV === 'development') {
        logger.info('개발 환경: 피드백 저장 건너뜀', {});
        return { id: 'dev-placeholder-id' };
      }
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    logger.action.end(actionName, duration, {
      feedback_id: data.id,
    });

    return { id: data.id };
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.action.error(actionName, err, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

