'use server';

/**
 * Activity 분석 로직 Server Action
 * 
 * 활동별 분석 로직을 계산합니다.
 * 타이밍 검증, RTR 로직, 다음 행동 추천을 제공합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Activity } from '@/types/database.types';
import { ACTIVITY_TAGS, getPositiveTags, getNegativeTags } from '@/constants/activity-tags';

export interface ActivityAnalysis {
  timingVerification: {
    status: 'perfect' | 'good' | 'late';
    message: string;
  };
  rtrLogic: {
    score: number;
    message: string;
  };
  nextAction: {
    recommended: string;
    date?: string;
  };
}

/**
 * Activity 분석 로직을 계산합니다.
 * 
 * @param activityId 분석할 Activity ID
 */
export async function getActivityAnalysis(
  activityId: string
): Promise<ActivityAnalysis> {
  console.group('getActivityAnalysis: 시작');
  console.log('Activity ID:', activityId);

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const userUuid = await getCurrentUserId();
    if (!userUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    // Activity 조회
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userUuid)
      .single();

    if (activityError || !activity) {
      console.error('Activity 조회 실패:', activityError);
      throw new Error(`Failed to get activity: ${activityError?.message || 'Activity not found'}`);
    }

    const activityData = activity as Activity;

    // 1. 타이밍 검증: performed_at과 created_at 비교
    const performedAt = new Date(activityData.performed_at);
    const createdAt = new Date(activityData.created_at);
    const timeDiffMinutes = Math.floor(
      (createdAt.getTime() - performedAt.getTime()) / (1000 * 60)
    );

    let timingStatus: 'perfect' | 'good' | 'late';
    let timingMessage: string;

    if (timeDiffMinutes <= 30) {
      timingStatus = 'perfect';
      timingMessage = `미팅 직후 입력 (Perfect)`;
    } else if (timeDiffMinutes <= 120) {
      timingStatus = 'good';
      timingMessage = `${Math.floor(timeDiffMinutes / 60)}시간 후 입력 (Good)`;
    } else {
      timingStatus = 'late';
      timingMessage = `${Math.floor(timeDiffMinutes / 60)}시간 후 입력 (Late)`;
    }

    // 2. RTR 로직: 태그 기반 점수 계산
    const positiveTagIds = getPositiveTags().map((tag) => tag.id);
    const negativeTagIds = getNegativeTags().map((tag) => tag.id);

    const positiveTagCount = activityData.tags?.filter((tag) =>
      positiveTagIds.includes(tag as any)
    ).length || 0;
    const negativeTagCount = activityData.tags?.filter((tag) =>
      negativeTagIds.includes(tag as any)
    ).length || 0;

    // RTR 점수 계산: 긍정 태그 +10점, 부정 태그 -10점, sentiment_score 반영
    let rtrScore = 50; // 기본값
    rtrScore += positiveTagCount * 10;
    rtrScore -= negativeTagCount * 10;

    // sentiment_score 반영 (0-100 스케일)
    if (activityData.sentiment_score !== null) {
      rtrScore = Math.round((rtrScore + activityData.sentiment_score) / 2);
    }

    rtrScore = Math.max(0, Math.min(100, rtrScore)); // 0-100 범위로 제한

    let rtrMessage: string;
    if (positiveTagCount > 0) {
      rtrMessage = `긍정 태그 ${positiveTagCount}개 감지 (+${positiveTagCount * 10}점 보정)`;
    } else if (negativeTagCount > 0) {
      rtrMessage = `부정 태그 ${negativeTagCount}개 감지 (-${negativeTagCount * 10}점 보정)`;
    } else {
      rtrMessage = '태그 없음 (기본 점수)';
    }

    // 3. 다음 행동 추천
    let nextActionRecommended: string;
    let nextActionDate: string | undefined;

    if (activityData.next_action_date) {
      const nextActionDateObj = new Date(activityData.next_action_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysUntilNextAction = Math.ceil(
        (nextActionDateObj.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilNextAction < 0) {
        nextActionRecommended = '재방문 필요 (예정일 경과)';
        nextActionDate = activityData.next_action_date;
      } else if (daysUntilNextAction <= 7) {
        nextActionRecommended = `${daysUntilNextAction}일 후 샘플 전달 예정 (PHR 안전)`;
        nextActionDate = activityData.next_action_date;
      } else {
        nextActionRecommended = `${daysUntilNextAction}일 후 다음 활동 예정`;
        nextActionDate = activityData.next_action_date;
      }
    } else {
      nextActionRecommended = '다음 활동 예정일 미입력 (Dead Lead 위험)';
    }

    // 위험 감지: 부정 태그가 2개 이상이면 매니저 동행 권장
    if (negativeTagCount >= 2) {
      nextActionRecommended = '매니저 동행 방문 권장';
    }

    const analysis: ActivityAnalysis = {
      timingVerification: {
        status: timingStatus,
        message: timingMessage,
      },
      rtrLogic: {
        score: rtrScore,
        message: rtrMessage,
      },
      nextAction: {
        recommended: nextActionRecommended,
        date: nextActionDate,
      },
    };

    console.log('분석 결과:', analysis);
    console.groupEnd();

    return analysis;
  } catch (error) {
    console.error('getActivityAnalysis 에러:', error);
    console.groupEnd();
    throw error;
  }
}

