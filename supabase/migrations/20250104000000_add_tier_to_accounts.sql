/**
 * accounts 테이블에 tier 필드 추가
 * 
 * Strategic Account Manager 기능을 위해 계정의 중요도 등급을 저장합니다.
 * - S: 핵심 고객 (Strategic)
 * - A: 주요 고객 (Important)
 * - B: 일반 고객 (Standard)
 * - RISK: 이탈 위험 고객
 */

-- tier 컬럼 추가
ALTER TABLE accounts
ADD COLUMN tier TEXT DEFAULT 'B' NOT NULL;

-- tier 제약 조건 추가
ALTER TABLE accounts
ADD CONSTRAINT chk_accounts_tier CHECK (tier IN ('S', 'A', 'B', 'RISK'));

-- tier 인덱스 추가 (필터링 성능 향상)
CREATE INDEX idx_accounts_tier ON accounts(tier);

-- 코멘트 추가
COMMENT ON COLUMN accounts.tier IS '계정 중요도 등급 (S: 핵심, A: 주요, B: 일반, RISK: 이탈 위험)';

