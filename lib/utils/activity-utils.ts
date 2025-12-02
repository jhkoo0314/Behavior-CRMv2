/**
 * Activity 관련 유틸리티 함수
 * 
 * 날짜별 그룹핑, HIR 점수 계산, 시간 표시 등의 유틸리티 함수를 제공합니다.
 */

import type { Activity } from '@/types/database.types';
import { ACTIVITY_TAGS, getPositiveTags, getNegativeTags } from '@/constants/activity-tags';

/**
 * 날짜별 그룹 키를 생성합니다.
 * 
 * @param date 날짜
 * @returns 그룹 키 ("오늘", "어제", "N일 전", "YYYY-MM-DD")
 */
export function getDateGroupKey(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    // YYYY-MM-DD 형식
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * 날짜별로 Activity를 그룹핑합니다.
 * 
 * @param activities Activity 배열
 * @returns 날짜별로 그룹핑된 Activity 맵
 */
export function groupActivitiesByDate(
  activities: Activity[]
): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();

  for (const activity of activities) {
    const groupKey = getDateGroupKey(activity.performed_at);
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(activity);
  }

  // 날짜 순서 정렬 (최신순)
  const sortedGroups = new Map<string, Activity[]>();
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    // "오늘", "어제", "N일 전" 우선, 그 다음 날짜
    if (a === '오늘') return -1;
    if (b === '오늘') return 1;
    if (a === '어제') return -1;
    if (b === '어제') return 1;
    if (a.includes('일 전') && b.includes('일 전')) {
      const aDays = parseInt(a);
      const bDays = parseInt(b);
      return aDays - bDays;
    }
    if (a.includes('일 전')) return -1;
    if (b.includes('일 전')) return 1;
    return b.localeCompare(a); // 날짜는 내림차순
  });

  for (const key of sortedKeys) {
    sortedGroups.set(key, grouped.get(key)!);
  }

  return sortedGroups;
}

/**
 * Activity의 HIR 점수를 계산합니다 (휴리스틱).
 * 
 * 긍정 태그 수, outcome, sentiment_score를 기반으로 계산합니다.
 * 
 * @param activity Activity 객체
 * @returns HIR 점수 (0-100)
 */
export function calculateActivityHIR(activity: Activity): number {
  let hirScore = 50; // 기본값

  // 1. Outcome 기반 점수
  if (activity.outcome === 'won') {
    hirScore += 30;
  } else if (activity.outcome === 'ongoing') {
    hirScore += 10;
  } else if (activity.outcome === 'lost') {
    hirScore -= 20;
  }

  // 2. 태그 기반 점수
  const positiveTagIds = getPositiveTags().map((tag) => tag.id);
  const negativeTagIds = getNegativeTags().map((tag) => tag.id);

  const positiveTagCount = activity.tags?.filter((tag) =>
    positiveTagIds.includes(tag as any)
  ).length || 0;
  const negativeTagCount = activity.tags?.filter((tag) =>
    negativeTagIds.includes(tag as any)
  ).length || 0;

  hirScore += positiveTagCount * 10;
  hirScore -= negativeTagCount * 10;

  // 3. sentiment_score 반영
  if (activity.sentiment_score !== null) {
    hirScore = Math.round((hirScore + activity.sentiment_score) / 2);
  }

  // 4. dwell_time_seconds 반영 (입력 시간이 짧을수록 높은 점수)
  if (activity.dwell_time_seconds !== null) {
    // 30초 이내: +10점, 60초 이내: +5점, 120초 이상: -5점
    if (activity.dwell_time_seconds <= 30) {
      hirScore += 10;
    } else if (activity.dwell_time_seconds <= 60) {
      hirScore += 5;
    } else if (activity.dwell_time_seconds >= 120) {
      hirScore -= 5;
    }
  }

  // 0-100 범위로 제한
  return Math.max(0, Math.min(100, Math.round(hirScore)));
}

/**
 * 온도 표시 클래스를 결정합니다.
 * 
 * @param temperature 온도 (0-100)
 * @returns Tailwind CSS 클래스
 */
export function getTemperatureClass(temperature: number | null): string {
  if (temperature === null) {
    return 'text-muted-foreground';
  }

  if (temperature >= 70) {
    return 'text-red-600'; // hot
  } else if (temperature >= 40) {
    return 'text-yellow-600'; // warm
  } else {
    return 'text-blue-600'; // cold
  }
}

/**
 * 온도 표시 아이콘을 결정합니다.
 * 
 * @param temperature 온도 (0-100)
 * @returns 아이콘 텍스트
 */
export function getTemperatureIcon(temperature: number | null): string {
  if (temperature === null) {
    return '🌡️';
  }

  if (temperature >= 70) {
    return '🔥';
  } else if (temperature >= 40) {
    return '🌡️';
  } else {
    return '🧊';
  }
}

/**
 * 상대 시간을 표시합니다.
 * 
 * @param date 날짜
 * @returns 상대 시간 문자열 ("방금 전", "N분 전", "N시간 전", "N일 전")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    // 일주일 이상이면 날짜 표시
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * 시간을 HH:MM 형식으로 표시합니다.
 * 
 * @param date 날짜
 * @returns 시간 문자열 ("14:30")
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 태그의 타입을 반환합니다.
 * 
 * @param tagId 태그 ID
 * @returns 태그 타입 ('pos' | 'neg' | 'neu')
 */
export function getTagType(tagId: string): 'pos' | 'neg' | 'neu' {
  const tag = ACTIVITY_TAGS.find((t) => t.id === tagId);
  return tag?.type || 'neu';
}

