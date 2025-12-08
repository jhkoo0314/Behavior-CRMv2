/**
 * Supabase 데이터베이스 타입 정의
 * 
 * 주의: 마이그레이션 실행 후 `supabase gen types`로 자동 생성된 타입으로 교체 예정
 * 현재는 수동으로 정의한 기본 타입
 */

/**
 * Users 테이블 타입
 */
export interface User {
  id: string; // UUID
  clerk_id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'head_manager';
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Accounts 테이블 타입
 */
export interface Account {
  id: string; // UUID
  name: string;
  address: string | null;
  phone: string | null;
  type: 'general_hospital' | 'hospital' | 'clinic' | 'pharmacy';
  specialty: string | null;
  patient_count: number;
  revenue: number;
  notes: string | null;
  tier: 'S' | 'A' | 'B' | 'RISK'; // 계정 중요도 등급
  created_at: string;
  updated_at: string;
}

/**
 * Contacts 테이블 타입
 */
export interface Contact {
  id: string; // UUID
  account_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Activities 테이블 타입
 */
export interface Activity {
  id: string; // UUID
  user_id: string; // UUID (users.id 참조)
  account_id: string;
  contact_id: string | null;
  type: 'visit' | 'call' | 'message' | 'presentation' | 'follow_up';
  behavior: 'approach' | 'contact' | 'visit' | 'presentation' | 'question' | 'need_creation' | 'demonstration' | 'follow_up';
  description: string;
  quality_score: number; // 0-100
  quantity_score: number; // 0-100
  duration_minutes: number;
  performed_at: string;
  // 새 필드 (Behavior-Driven Activity Form)
  outcome: 'won' | 'ongoing' | 'lost' | null; // 활동 결과
  tags: string[]; // 핵심 내용 태그 배열 (JSONB)
  sentiment_score: number | null; // 관계 온도 (0-100)
  next_action_date: string | null; // 다음 활동 예정일 (DATE)
  dwell_time_seconds: number | null; // HIR 측정용 체류 시간 (초)
  created_at: string;
  updated_at: string;
}

/**
 * Behavior Scores 테이블 타입
 */
export interface BehaviorScore {
  id: string; // UUID
  user_id: string;
  behavior: string;
  intensity_score: number;
  diversity_score: number;
  quality_score: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

/**
 * Outcomes 테이블 타입
 */
export interface Outcome {
  id: string; // UUID
  user_id: string;
  account_id: string | null;
  hir_score: number;
  conversion_rate: number;
  field_growth_rate: number;
  prescription_index: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  created_at: string;
}

/**
 * Prescriptions 테이블 타입
 */
export interface Prescription {
  id: string; // UUID
  account_id: string;
  contact_id: string | null;
  related_activity_id: string | null;
  product_name: string;
  product_code: string | null;
  quantity: number;
  quantity_unit: string;
  price: number;
  prescription_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Coaching Signals 테이블 타입
 */
export interface CoachingSignal {
  id: string; // UUID
  user_id: string;
  account_id: string | null;
  contact_id: string | null;
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  recommended_action: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

/**
 * Competitor Signals 테이블 타입
 */
export interface CompetitorSignal {
  id: string; // UUID
  account_id: string;
  contact_id: string | null;
  competitor_name: string;
  type: string;
  description: string | null;
  detected_at: string;
  created_at: string;
}

/**
 * Analytics Cache 테이블 타입
 */
export interface AnalyticsCache {
  id: string; // UUID
  user_id: string | null;
  cache_key: string;
  data: Record<string, unknown>; // JSONB
  period_start: string | null;
  period_end: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * Account 통계 데이터 타입
 */
export interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  coverage: number; // 이번 달 방문한 고객 수 / 전체 고객 수 (%)
  sTierFocus: number; // S-Tier 계정 수 / 전체 계정 수 (%)
  riskAccounts: number; // 14일 이상 미방문 계정 수
}

/**
 * Account 메트릭 포함 타입 (RTR, 최근 방문일, 파이프라인 상태)
 */
export interface AccountWithMetrics extends Account {
  rtr: number; // 관계 온도 (0-100)
  lastVisitDate: string | null; // 최근 방문일 (ISO string)
  daysSinceLastVisit: number | null; // 마지막 방문으로부터 경과 일수
  pipelineStatus: 'negotiation' | 'opportunity' | 'at_risk' | null; // 파이프라인 상태
  region: string | null; // 파싱된 지역 정보
  contacts: string | null; // 담당자 정보 (예: "김철수 교수 외 3명")
}

/**
 * Risk Alert 타입
 */
export interface RiskAlert {
  accountId: string;
  accountName: string;
  type: 'rtr_drop' | 'no_visit'; // RTR 급락 또는 미방문
  message: string;
  severity: 'high' | 'medium' | 'low';
}



