/**
 * 파이프라인 상태 결정 유틸리티 함수
 * 
 * activities의 outcome 필드를 기반으로 파이프라인 상태를 결정합니다.
 */

import type { Activity } from '@/types/database.types';

/**
 * 파이프라인 상태 타입
 */
export type PipelineStatus = 'negotiation' | 'opportunity' | 'at_risk' | null;

/**
 * activities 배열을 기반으로 파이프라인 상태를 결정합니다.
 * 
 * 규칙:
 * - 'ongoing' outcome이 있고 최근 14일 이내 활동이면 'negotiation' (협상 중)
 * - 'ongoing' outcome이 있지만 14일 이상 지났으면 'opportunity' (기회 발굴)
 * - 'lost' outcome이 있거나 14일 이상 미방문이면 'at_risk' (이탈 위험)
 * - 그 외는 null
 * 
 * @param activities Account의 activities 배열 (최신순 정렬 권장)
 * @param daysSinceLastVisit 마지막 방문으로부터 경과 일수
 * @returns 파이프라인 상태
 */
export function getPipelineStatus(
  activities: Activity[],
  daysSinceLastVisit: number | null
): PipelineStatus {
  if (activities.length === 0) {
    // 활동 기록이 없고 14일 이상 미방문이면 이탈 위험
    if (daysSinceLastVisit !== null && daysSinceLastVisit >= 14) {
      return 'at_risk';
    }
    return null;
  }

  // 가장 최근 활동의 outcome 확인
  const latestActivity = activities[0];

  // outcome이 'won'이면 협상 완료 상태 (null 반환)
  if (latestActivity.outcome === 'won') {
    return null;
  }

  // outcome이 'ongoing'인 경우
  if (latestActivity.outcome === 'ongoing') {
    const daysSinceActivity = daysSinceLastVisit || 0;
    if (daysSinceActivity < 14) {
      return 'negotiation'; // 최근 활동이면 협상 중
    } else {
      return 'opportunity'; // 오래된 활동이면 기회 발굴
    }
  }

  // outcome이 'lost'이거나 14일 이상 미방문이면 이탈 위험
  if (latestActivity.outcome === 'lost') {
    return 'at_risk';
  }

  // outcome이 null이고 14일 이상 미방문이면 이탈 위험
  if (daysSinceLastVisit !== null && daysSinceLastVisit >= 14) {
    return 'at_risk';
  }

  return null;
}

/**
 * 파이프라인 상태를 한글 라벨로 변환합니다.
 * 
 * @param status 파이프라인 상태
 * @returns 한글 라벨
 */
export function getPipelineStatusLabel(status: PipelineStatus): string {
  switch (status) {
    case 'negotiation':
      return '협상 중';
    case 'opportunity':
      return '기회 발굴';
    case 'at_risk':
      return '이탈 위험';
    default:
      return '-';
  }
}

