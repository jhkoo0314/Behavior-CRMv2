/**
 * Account Mock 데이터
 * 
 * 개발 및 UI 테스트를 위한 Mock 데이터입니다.
 * 실제 Server Actions 구현 전까지 사용됩니다.
 */

import type { AccountStats, AccountWithMetrics, RiskAlert } from '@/types/database.types';

/**
 * Mock 통계 데이터
 */
export const mockAccountStats: AccountStats = {
  totalAccounts: 124,
  activeAccounts: 98,
  coverage: 68, // 이번 달 방문한 고객 수 / 전체 고객 수 (%)
  sTierFocus: 85, // S-Tier 계정 수 / 전체 계정 수 (%)
  riskAccounts: 12, // 14일 이상 미방문 계정 수
};

/**
 * Mock Account 목록 데이터 (메트릭 포함)
 */
export const mockAccountsWithMetrics: AccountWithMetrics[] = [
  {
    id: '1',
    name: '서울대학교병원',
    address: '서울시 종로구 대학로 101',
    phone: '02-2072-2114',
    type: 'general_hospital',
    specialty: '순환기내과',
    patient_count: 50000,
    revenue: 5000000000,
    notes: null,
    tier: 'S',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    rtr: 85,
    lastVisitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
    daysSinceLastVisit: 2,
    pipelineStatus: 'negotiation',
    region: '혜화/종로',
    contacts: '김철수 교수 외 3명',
  },
  {
    id: '2',
    name: '연세세브란스',
    address: '서울시 서대문구 연세로 50-1',
    phone: '02-2228-5800',
    type: 'general_hospital',
    specialty: '약제팀',
    patient_count: 45000,
    revenue: 4500000000,
    notes: null,
    tier: 'A',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    rtr: 60,
    lastVisitDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
    daysSinceLastVisit: 5,
    pipelineStatus: 'opportunity',
    region: '신촌/서대문',
    contacts: '박지민 과장',
  },
  {
    id: '3',
    name: '강남성모병원',
    address: '서울시 강남구 테헤란로 82',
    phone: '02-2258-5800',
    type: 'hospital',
    specialty: '내분비내과',
    patient_count: 30000,
    revenue: 3000000000,
    notes: null,
    tier: 'RISK',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z',
    rtr: 30,
    lastVisitDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35일 전
    daysSinceLastVisit: 35,
    pipelineStatus: 'at_risk',
    region: '강남/서초',
    contacts: '최영희 교수',
  },
  {
    id: '4',
    name: '삼성서울병원',
    address: '서울시 강남구 일원로 81',
    phone: '02-3410-2114',
    type: 'general_hospital',
    specialty: '정형외과',
    patient_count: 60000,
    revenue: 6000000000,
    notes: null,
    tier: 'S',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    rtr: 90,
    lastVisitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    daysSinceLastVisit: 1,
    pipelineStatus: 'negotiation',
    region: '강남/서초',
    contacts: '이영수 교수 외 2명',
  },
  {
    id: '5',
    name: '아산병원',
    address: '서울시 송파구 올림픽로 43길 88',
    phone: '02-3010-3114',
    type: 'general_hospital',
    specialty: '신경외과',
    patient_count: 55000,
    revenue: 5500000000,
    notes: null,
    tier: 'A',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-18T00:00:00Z',
    rtr: 75,
    lastVisitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    daysSinceLastVisit: 3,
    pipelineStatus: 'negotiation',
    region: '송파/잠실',
    contacts: '정민호 교수',
  },
  {
    id: '6',
    name: '세브란스병원',
    address: '서울시 종로구 새문안로 5길 20',
    phone: '02-2001-2001',
    type: 'general_hospital',
    specialty: '소아과',
    patient_count: 40000,
    revenue: 4000000000,
    notes: null,
    tier: 'B',
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
    rtr: 55,
    lastVisitDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8일 전
    daysSinceLastVisit: 8,
    pipelineStatus: 'opportunity',
    region: '혜화/종로',
    contacts: '한소영 교수',
  },
];

/**
 * Mock Risk Alert 데이터
 */
export const mockRiskAlerts: RiskAlert[] = [
  {
    accountId: '3',
    accountName: '강남성모병원',
    type: 'rtr_drop',
    message: '관계 온도가 급격히 하락했습니다.',
    severity: 'high',
  },
  {
    accountId: '7',
    accountName: '서울아산병원',
    type: 'no_visit',
    message: '14일 이상 방문하지 않았습니다.',
    severity: 'medium',
  },
  {
    accountId: '8',
    accountName: '고려대학교병원',
    type: 'rtr_drop',
    message: '관계 온도가 급격히 하락했습니다.',
    severity: 'high',
  },
];

