/**
 * Activity 테이블에 새 필드 추가 마이그레이션
 * 
 * Behavior-Driven Activity Form을 위한 새 필드 추가:
 * - outcome: 활동 결과 (won/ongoing/lost)
 * - tags: 핵심 내용 태그 (JSONB 배열)
 * - sentiment_score: 관계 온도 (0-100)
 * - next_action_date: 다음 활동 예정일
 * - dwell_time_seconds: HIR 측정용 체류 시간
 */

-- outcome 컬럼 추가 (활동 결과)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS outcome TEXT;

-- outcome CHECK 제약 추가
ALTER TABLE activities 
ADD CONSTRAINT chk_activities_outcome 
CHECK (outcome IS NULL OR outcome IN ('won', 'ongoing', 'lost'));

-- tags 컬럼 추가 (핵심 내용 태그, JSONB 배열)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- sentiment_score 컬럼 추가 (관계 온도 0-100)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS sentiment_score INT;

-- sentiment_score CHECK 제약 추가
ALTER TABLE activities 
ADD CONSTRAINT chk_activities_sentiment_score 
CHECK (sentiment_score IS NULL OR (sentiment_score >= 0 AND sentiment_score <= 100));

-- next_action_date 컬럼 추가 (다음 활동 예정일)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS next_action_date DATE;

-- dwell_time_seconds 컬럼 추가 (HIR 측정용 체류 시간)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS dwell_time_seconds INT;

-- dwell_time_seconds CHECK 제약 추가 (음수 방지)
ALTER TABLE activities 
ADD CONSTRAINT chk_activities_dwell_time 
CHECK (dwell_time_seconds IS NULL OR dwell_time_seconds >= 0);

-- 코멘트 추가
COMMENT ON COLUMN activities.outcome IS '활동 결과: won(성공/긍정), ongoing(진행/보류), lost(거절/실패)';
COMMENT ON COLUMN activities.tags IS '핵심 내용 태그 배열 (JSONB)';
COMMENT ON COLUMN activities.sentiment_score IS '관계 온도 점수 (0-100)';
COMMENT ON COLUMN activities.next_action_date IS '다음 활동 예정일 (PHR 관리용)';
COMMENT ON COLUMN activities.dwell_time_seconds IS '폼 입력 체류 시간 (HIR 측정용, 초 단위)';

