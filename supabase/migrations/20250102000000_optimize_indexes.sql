/**
 * 데이터베이스 인덱스 최적화 마이그레이션
 * 
 * 자주 사용되는 쿼리 패턴을 기반으로 복합 인덱스 추가
 * - activities: 사용자별 활동 조회 최적화
 * - outcomes: 기간별 성과 조회 최적화
 * - behavior_scores: 행동 점수 조회 최적화
 */

-- activities 테이블 복합 인덱스
-- 사용자별 활동 조회 최적화 (가장 빈번한 쿼리)
CREATE INDEX IF NOT EXISTS idx_activities_user_performed_at 
ON activities(user_id, performed_at DESC);

-- 계정별 활동 조회 최적화
CREATE INDEX IF NOT EXISTS idx_activities_account_performed_at 
ON activities(account_id, performed_at DESC);

-- outcomes 테이블 복합 인덱스
-- 사용자별 기간별 성과 조회 최적화
CREATE INDEX IF NOT EXISTS idx_outcomes_user_period 
ON outcomes(user_id, period_type, period_start DESC);

-- 계정별 성과 조회 최적화
CREATE INDEX IF NOT EXISTS idx_outcomes_account_period 
ON outcomes(account_id, period_type, period_start DESC) 
WHERE account_id IS NOT NULL;

-- behavior_scores 테이블 복합 인덱스
-- 사용자별 행동 점수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_behavior_scores_user_behavior_period 
ON behavior_scores(user_id, behavior, period_start DESC);

-- coaching_signals 테이블 인덱스
-- 사용자별 우선순위별 신호 조회 최적화
CREATE INDEX IF NOT EXISTS idx_coaching_signals_user_priority 
ON coaching_signals(user_id, priority, is_resolved, created_at DESC);

-- competitor_signals 테이블 인덱스
-- 계정별 경쟁사 신호 조회 최적화
CREATE INDEX IF NOT EXISTS idx_competitor_signals_account_detected 
ON competitor_signals(account_id, detected_at DESC);

-- analytics_cache 테이블 인덱스
-- 캐시 조회 최적화
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_key_expires 
ON analytics_cache(user_id, cache_key, expires_at) 
WHERE expires_at > NOW();

-- 기존 단일 컬럼 인덱스 확인 및 유지
-- (필요한 경우에만 유지, 불필요한 중복 인덱스는 제거하지 않음)

