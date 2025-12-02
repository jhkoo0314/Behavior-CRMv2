/**
 * 관리자 섹션 공통 Mock 데이터
 * 
 * 모든 관리자 컴포넌트가 동일한 데이터를 사용하도록 공유 Mock 데이터를 제공합니다.
 * 시연용으로 고정된 값을 사용하여 일관성을 유지합니다.
 */

import type { TeamKPIs } from '@/actions/manager/get-team-kpis';
import type { User } from '@/types/database.types';
import type { CompetitorSignal, CoachingSignal, Account } from '@/types/database.types';

/**
 * 팀 KPI Mock 데이터
 */
export const mockTeamKPIs: TeamKPIs = {
  behaviorScore: {
    current: 71,
    previous: 68,
    change: 4, // (71 - 68) / 68 * 100 ≈ 4%
  },
  avgHir: {
    current: 75,
    previous: 72,
    change: 4, // (75 - 72) / 72 * 100 ≈ 4%
  },
  activePipeline: {
    current: 0,
    previous: 0,
    change: 0,
  },
  goalForecast: {
    current: 88,
    previous: 85,
    change: 4, // (88 - 85) / 85 * 100 ≈ 4%
  },
};

/**
 * 팀원 목록 Mock 데이터
 */
export const mockTeamMembers: User[] = [
  {
    id: 'mock-user-1',
    clerk_id: 'mock-clerk-1',
    name: '김영수',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock-user-2',
    clerk_id: 'mock-clerk-2',
    name: '이지은',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'mock-user-3',
    clerk_id: 'mock-clerk-3',
    name: '박민준',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 'mock-user-4',
    clerk_id: 'mock-clerk-4',
    name: '최수진',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-04T00:00:00Z',
  },
  {
    id: 'mock-user-5',
    clerk_id: 'mock-clerk-5',
    name: '정호영',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 'mock-user-6',
    clerk_id: 'mock-clerk-6',
    name: '강미영',
    role: 'salesperson',
    team_id: 'team-1',
    created_at: '2024-01-06T00:00:00Z',
  },
];

/**
 * 팀원 메트릭 Mock 데이터 (CoachingPriorityList용)
 */
export interface MockMemberMetrics {
  userId: string;
  hir: number;
  rtr: number;
  bcr: number;
  phr: number;
  totalScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskReason?: string;
}

export const mockMemberMetrics: MockMemberMetrics[] = [
  {
    userId: 'mock-user-1',
    hir: 55,
    rtr: 45,
    bcr: 50,
    phr: 40,
    totalScore: 48,
    riskLevel: 'high',
    riskReason: 'RTR 급락 / 방문량 저조',
  },
  {
    userId: 'mock-user-2',
    hir: 60,
    rtr: 55,
    bcr: 58,
    phr: 52,
    totalScore: 56,
    riskLevel: 'medium',
    riskReason: 'PHR 관리 부실 (Dead Lead)',
  },
  {
    userId: 'mock-user-3',
    hir: 85,
    rtr: 82,
    bcr: 88,
    phr: 80,
    totalScore: 84,
    riskLevel: 'low',
  },
  {
    userId: 'mock-user-4',
    hir: 90,
    rtr: 88,
    bcr: 92,
    phr: 85,
    totalScore: 89,
    riskLevel: 'low',
  },
  {
    userId: 'mock-user-5',
    hir: 78,
    rtr: 75,
    bcr: 80,
    phr: 72,
    totalScore: 76,
    riskLevel: 'low',
  },
  {
    userId: 'mock-user-6',
    hir: 70,
    rtr: 65,
    bcr: 68,
    phr: 62,
    totalScore: 66,
    riskLevel: 'medium',
    riskReason: 'BCR 저조 / 루틴 부재',
  },
];

/**
 * 경쟁사 신호 Mock 데이터
 */
export const mockCompetitorSignals: CompetitorSignal[] = [
  {
    id: 'mock-competitor-1',
    account_id: '1',
    competitor_name: '경쟁사A',
    type: 'visit',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-2',
    account_id: '2',
    competitor_name: '경쟁사A',
    type: 'presentation',
    detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-3',
    account_id: '3',
    competitor_name: '경쟁사B',
    type: 'visit',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-4',
    account_id: '1',
    competitor_name: '경쟁사B',
    type: 'visit',
    detected_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-5',
    account_id: '4',
    competitor_name: '경쟁사A',
    type: 'proposal',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-6',
    account_id: '2',
    competitor_name: '경쟁사A',
    type: 'visit',
    detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-competitor-7',
    account_id: '5',
    competitor_name: '경쟁사C',
    type: 'call',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

/**
 * 코칭 신호 Mock 데이터
 */
export const mockCoachingSignals: CoachingSignal[] = [
  {
    id: 'mock-coaching-1',
    user_id: 'mock-user-1',
    account_id: '3',
    priority: 'high',
    message: 'RTR 급락 / 방문량 저조',
    is_resolved: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-coaching-2',
    user_id: 'mock-user-2',
    account_id: '6',
    priority: 'medium',
    message: 'PHR 관리 부실 (Dead Lead)',
    is_resolved: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-coaching-3',
    user_id: 'mock-user-6',
    account_id: '2',
    priority: 'medium',
    message: 'BCR 저조 / 루틴 부재',
    is_resolved: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * 팀 평균 지표 Mock 데이터 (TeamBalanceRadar용)
 */
export const mockTeamAverageMetrics = {
  hir: 73,
  rtr: 68,
  bcr: 73,
  phr: 65,
};

