/**
 * 날짜/기간 유틸리티 함수
 * 
 * 기간 계산, 날짜 포맷팅 등 날짜 관련 유틸리티 제공
 */

/**
 * 기간 계산 함수
 * 
 * @param days 일수
 * @returns 시작일과 종료일을 포함한 Date 객체 배열 [startDate, endDate]
 */
export function getDateRange(days: number): [Date, Date] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return [startDate, endDate];
}

/**
 * 최근 N일 기간 계산
 * 
 * @param days 일수 (기본값: 7)
 * @returns 시작일과 종료일
 */
export function getRecentDaysRange(days: number = 7): { start: Date; end: Date } {
  const [start, end] = getDateRange(days);
  return { start, end };
}

/**
 * 최근 7일 기간
 */
export function getLast7Days() {
  return getRecentDaysRange(7);
}

/**
 * 최근 30일 기간
 */
export function getLast30Days() {
  return getRecentDaysRange(30);
}

/**
 * 최근 90일 기간
 */
export function getLast90Days() {
  return getRecentDaysRange(90);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 * 
 * @param date Date 객체
 * @returns YYYY-MM-DD 형식 문자열
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * 
 * @param date Date 객체
 * @returns YYYY년 MM월 DD일 형식 문자열
 */
export function formatDateKorean(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 상대적 시간으로 포맷팅 (예: "3일 전", "1주 전")
 * 
 * @param date Date 객체
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주 전`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}년 전`;
  }
}

/**
 * 두 날짜 사이의 일수 계산
 * 
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 일수
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 기간 타입에 따른 시작일과 종료일 계산
 * 
 * @param periodType 기간 타입
 * @returns 시작일과 종료일
 */
export function getPeriodDates(
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (periodType) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      // 이번 주 월요일
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarterly':
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth((quarter + 1) * 3);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}






