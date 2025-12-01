/**
 * 차트 데이터 변환 유틸리티 함수
 * 
 * 차트 컴포넌트에서 사용하는 데이터 변환 헬퍼 함수들
 */

import type { SparklineData, SparklineDataPoint } from '@/types/chart.types';

/**
 * 날짜를 포맷팅합니다.
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * 숫자를 포맷팅합니다.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 퍼센트를 포맷팅합니다.
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * 전일/전주/전월 대비 변화율을 계산합니다.
 */
export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Sparkline 데이터를 생성합니다.
 * 
 * @param dataPoints 날짜별 값 배열
 * @returns Sparkline 데이터
 */
export function createSparklineData(
  dataPoints: Array<{ date: Date | string; value: number }>
): SparklineData {
  if (dataPoints.length === 0) {
    return {
      data: [],
      currentValue: 0,
      previousValue: 0,
      changePercent: 0,
    };
  }

  // 날짜순으로 정렬
  const sorted = [...dataPoints].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateA.getTime() - dateB.getTime();
  });

  const sparklineData: SparklineDataPoint[] = sorted.map((point) => ({
    date: typeof point.date === 'string' ? point.date : point.date.toISOString(),
    value: point.value,
  }));

  const currentValue = sorted[sorted.length - 1]?.value || 0;
  const previousValue = sorted.length > 1 ? sorted[sorted.length - 2]?.value || 0 : currentValue;
  const changePercent = calculateChangePercent(currentValue, previousValue);

  return {
    data: sparklineData,
    currentValue,
    previousValue,
    changePercent,
  };
}

/**
 * 기간을 계산합니다.
 */
export function calculatePeriod(days: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * 이전 기간을 계산합니다.
 */
export function calculatePreviousPeriod(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start);
  previousEnd.setTime(previousEnd.getTime() - 1);
  
  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousStart.getTime() - duration);
  
  return { start: previousStart, end: previousEnd };
}
