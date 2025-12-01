/* =========================================================================
   1. 초기화 (RESET)
   - 개발용: 기존 테이블을 모두 삭제하고 새로 시작합니다.
   - 주의: public 스키마는 삭제하지 않습니다 (권한 문제 방지)
   ========================================================================= */

-- 기존 테이블 삭제 (CASCADE로 외래키 제약조건도 함께 삭제)
DROP TABLE IF EXISTS "analytics_cache" CASCADE;
DROP TABLE IF EXISTS "competitor_signals" CASCADE;
DROP TABLE IF EXISTS "coaching_signals" CASCADE;
DROP TABLE IF EXISTS "prescriptions" CASCADE;
DROP TABLE IF EXISTS "outcomes" CASCADE;
DROP TABLE IF EXISTS "behavior_scores" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "contacts" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;

-- 확장 기능 활성화 (UUID 생성 및 암호화)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- public 스키마에 대한 권한 명시적 부여 (Supabase service_role 사용자)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;


/* =========================================================================
   2. 유틸리티 함수 (Trigger Function)
   - 레코드 수정 시 updated_at 컬럼을 자동으로 현재 시간으로 변경
   ========================================================================= */
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


/* =========================================================================
   3. 테이블 생성 및 RLS 비활성화 (Schema & Security)
   ========================================================================= */

-- [1] Users (사용자 정보)
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'salesperson',
    "team_id" TEXT, -- 팀 정보는 없을 수 있으므로 NULL 허용
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "uq_users_clerk_id" UNIQUE ("clerk_id"),
    CONSTRAINT "uq_users_email" UNIQUE ("email"),
    CONSTRAINT "chk_users_role" CHECK ("role" IN ('salesperson', 'manager', 'head_manager'))
);
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "users" IS 'Clerk 인증과 연동되는 사용자 정보';


-- [2] Accounts (병원 정보) - 좌표 삭제됨
CREATE TABLE "accounts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT, -- 전화번호는 문자가 포함될 수 있음 (INT -> TEXT)
    "type" TEXT NOT NULL DEFAULT 'clinic',
    "specialty" TEXT,
    "patient_count" INT DEFAULT 0,
    "revenue" BIGINT DEFAULT 0, -- 금액은 범위가 큼 (INT -> BIGINT)
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "chk_accounts_type" CHECK ("type" IN ('general_hospital', 'hospital', 'clinic', 'pharmacy'))
);
ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "accounts" IS '고객 병원 정보';


-- [3] Contacts (담당자 정보)
CREATE TABLE "contacts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL, -- FK 타입 수정 (TEXT -> UUID)
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT, -- (INT -> TEXT)
    "email" TEXT,
    "specialty" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_contacts_account" FOREIGN KEY ("account_id") 
        REFERENCES "accounts"("id") ON DELETE CASCADE
);
ALTER TABLE "contacts" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "contacts" IS '병원 내 의사 및 스탭 정보';


-- [4] Activities (행동 데이터) - 좌표 삭제됨
CREATE TABLE "activities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL, -- (TEXT -> UUID)
    "account_id" UUID NOT NULL, -- (TEXT -> UUID)
    "contact_id" UUID, -- 담당자 없는 방문 가능 (TEXT -> UUID, NULL Allowed)
    "type" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "quality_score" INT DEFAULT 0,
    "quantity_score" INT DEFAULT 0,
    "duration_minutes" INT DEFAULT 0,
    "performed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_activities_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_activities_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_activities_contact" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL,

    CONSTRAINT "chk_activities_type" CHECK ("type" IN ('visit', 'call', 'message', 'presentation', 'follow_up')),
    CONSTRAINT "chk_activities_behavior" CHECK ("behavior" IN ('approach', 'contact', 'visit', 'presentation', 'question', 'need_creation', 'demonstration', 'follow_up')),
    CONSTRAINT "chk_activities_scores" CHECK ("quality_score" BETWEEN 0 AND 100 AND "quantity_score" BETWEEN 0 AND 100)
);
ALTER TABLE "activities" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "activities" IS '영업사원의 실제 행동 기록';


-- [5] Behavior Scores (행동 점수 집계)
CREATE TABLE "behavior_scores" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL, -- (TEXT -> UUID)
    "behavior" TEXT NOT NULL,
    "intensity_score" INT DEFAULT 0,
    "diversity_score" INT DEFAULT 0,
    "quality_score" INT DEFAULT 0,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_behavior_scores_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "uq_behavior_scores_calc" UNIQUE ("user_id", "behavior", "period_start", "period_end")
);
ALTER TABLE "behavior_scores" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "behavior_scores" IS '기간별 자동 계산된 행동 지표 점수';


-- [6] Outcomes (성과 지표)
CREATE TABLE "outcomes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL, -- (TEXT -> UUID)
    "account_id" UUID, -- 전체 통계일 경우 NULL 가능 (TEXT -> UUID)
    "hir_score" INT DEFAULT 0,
    "conversion_rate" INT DEFAULT 0,
    "field_growth_rate" INT DEFAULT 0,
    "prescription_index" INT DEFAULT 0,
    "period_type" TEXT NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_outcomes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_outcomes_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "chk_outcomes_period" CHECK ("period_type" IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'))
);
ALTER TABLE "outcomes" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "outcomes" IS '행동의 결과로 나타난 성과 지표';


-- [7] Prescriptions (처방/매출)
CREATE TABLE "prescriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL, -- (TEXT -> UUID)
    "contact_id" UUID, -- (TEXT -> UUID)
    "related_activity_id" UUID, -- (TEXT -> UUID)
    "product_name" TEXT NOT NULL,
    "product_code" TEXT, -- 문자 포함 가능 (INT -> TEXT)
    "quantity" INT DEFAULT 0,
    "quantity_unit" TEXT DEFAULT 'box', -- 단위는 문자열 (INT -> TEXT)
    "price" BIGINT DEFAULT 0, -- (INT -> BIGINT)
    "prescription_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_prescriptions_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_prescriptions_contact" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_prescriptions_activity" FOREIGN KEY ("related_activity_id") REFERENCES "activities"("id") ON DELETE SET NULL
);
ALTER TABLE "prescriptions" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "prescriptions" IS '실제 성과 원천 데이터';


-- [8] Coaching Signals (코칭 알림)
CREATE TABLE "coaching_signals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL, -- (TEXT -> UUID)
    "account_id" UUID, -- (TEXT -> UUID)
    "contact_id" UUID, -- (TEXT -> UUID)
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommended_action" TEXT,
    "is_resolved" BOOLEAN DEFAULT FALSE, -- (TEXT -> BOOLEAN)
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_signals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_signals_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "chk_signals_priority" CHECK ("priority" IN ('high', 'medium', 'low'))
);
ALTER TABLE "coaching_signals" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "coaching_signals" IS 'AI 코칭 및 경고 알림';


-- [9] Competitor Signals (경쟁사 신호)
CREATE TABLE "competitor_signals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL, -- (TEXT -> UUID)
    "contact_id" UUID, -- (TEXT -> UUID)
    "competitor_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_comp_signals_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);
ALTER TABLE "competitor_signals" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "competitor_signals" IS '경쟁사 동향 기록';


-- [10] Analytics Cache (통계 캐시)
CREATE TABLE "analytics_cache" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID, -- (TEXT -> UUID)
    "cache_key" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb, -- (TEXT -> JSONB 최적화)
    "period_start" TIMESTAMPTZ,
    "period_end" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL, -- (DATETIME -> TIMESTAMPTZ)
    "created_at" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT "fk_cache_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
ALTER TABLE "analytics_cache" DISABLE ROW LEVEL SECURITY; -- RLS 비활성화 (개발용)
COMMENT ON TABLE "analytics_cache" IS '대시보드 성능용 통계 데이터 캐시';


/* =========================================================================
   4. 인덱스 생성 (Index Creation)
   - 조회 성능 최적화
   ========================================================================= */

-- 자주 조회되는 필드 및 외래키 인덱싱
CREATE INDEX "idx_users_clerk" ON "users" ("clerk_id");
CREATE INDEX "idx_accounts_name" ON "accounts" ("name");
CREATE INDEX "idx_contacts_account" ON "contacts" ("account_id");
CREATE INDEX "idx_activities_user_date" ON "activities" ("user_id", "performed_at" DESC);
CREATE INDEX "idx_activities_account" ON "activities" ("account_id");
CREATE INDEX "idx_prescriptions_account_date" ON "prescriptions" ("account_id", "prescription_date" DESC);
CREATE INDEX "idx_signals_unresolved" ON "coaching_signals" ("user_id") WHERE "is_resolved" = FALSE;
CREATE INDEX "idx_cache_key" ON "analytics_cache" ("cache_key");


/* =========================================================================
   5. 트리거 적용 (Triggers)
   - updated_at 자동 갱신 설정
   ========================================================================= */

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER set_timestamp_accounts BEFORE UPDATE ON "accounts" FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER set_timestamp_contacts BEFORE UPDATE ON "contacts" FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER set_timestamp_activities BEFORE UPDATE ON "activities" FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER set_timestamp_prescriptions BEFORE UPDATE ON "prescriptions" FOR EACH ROW EXECUTE PROCEDURE update_timestamp();