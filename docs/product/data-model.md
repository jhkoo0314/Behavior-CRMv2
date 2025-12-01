# Behavior-Driven CRM v2.1 - 데이터 모델 설계 문서

> 기획안(plan.md)과 PRD(prd.md)를 바탕으로 작성된 상세 데이터 모델 설계서

---

## 📋 목차

1. [개요](#개요)
2. [테이블 목록](#테이블-목록)
3. [상세 테이블 설계](#상세-테이블-설계)
4. [ENUM 타입 정의](#enum-타입-정의)
5. [테이블 관계도](#테이블-관계도)
6. [결정 필요 사항](#결정-필요-사항)

---

## 개요

이 문서는 Behavior-Driven CRM v2.1의 데이터베이스 스키마를 설계하기 위한 상세 데이터 모델 정의서입니다.

### 핵심 개념

- **Behavior Layer**: 영업사원의 실제 행동 데이터 (8개 지표)
- **Outcome Layer**: 행동이 만든 성과 데이터 (4개 지표)
- **자동 분석**: Behavior → Outcome 연결 분석

### 데이터 보존 정책

- 활동 기록: 5년 보존
- 음성 파일: 제외 (PRD에서 명시)
- 분석 캐시: TTL 기반 자동 삭제

---

## 테이블 목록

### Core 테이블 (10개)

1. **users** (기존 테이블, 수정 필요)
2. **accounts** - 병원 정보
3. **contacts** - 의사/스탭 정보
4. **activities** - 행동 데이터 (Behavior Layer)
5. **behavior_scores** - 자동 계산된 행동 점수
6. **prescriptions** - 처방/성과 원천 데이터
7. **outcomes** - 성과 데이터 (Outcome Layer)
8. **coaching_signals** - 경고 및 코칭 알림
9. **competitor_signals** - 경쟁사 활동 기록
10. **analytics_cache** - 계산된 지표 캐싱

---

## 상세 테이블 설계

### 1. users (기존 테이블 수정)

**목적**: Clerk 인증과 연동되는 사용자 정보

**기존 컬럼**:
- `id` (UUID, PK)
- `clerk_id` (TEXT, UNIQUE)
- `name` (TEXT)
- `created_at` (TIMESTAMPTZ)

**추가 필요 컬럼**:
- `role` (ENUM) - 사용자 역할
  - 값: 'salesperson', 'manager', 'head_manager'
  - 기본값: 'salesperson'
- `team_id` (TEXT, nullable) - 팀 식별자 (팀장 조회용)
- `updated_at` (TIMESTAMPTZ)

**인덱스**:
- `clerk_id` (UNIQUE)
- `role`
- `team_id`

**RLS**: 개발 중 비활성화, 프로덕션에서 활성화

---

### 2. accounts (병원)

**목적**: 병원 정보 저장

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `name` | TEXT | NOT NULL | 병원명 | ✅ |
| `address` | TEXT | | 주소 | ✅ |
| `phone` | TEXT | | 전화번호 | ✅ |
| `hospital_type` | ENUM? TEXT? | | 병원 타입 | ⚠️ 결정 필요 |
| `specialty` | TEXT[] | | 진료과 목록 | ✅ |
| `patient_count` | INTEGER? TEXT? | | 환자 수 | ⚠️ 결정 필요 |
| `revenue` | DECIMAL? TEXT? | | 매출 규모 | ⚠️ 결정 필요 |
| `latitude` | DECIMAL(10,8) | nullable | 위도 (GPS) | ⚠️ 결정 필요 |
| `longitude` | DECIMAL(11,8) | nullable | 경도 (GPS) | ⚠️ 결정 필요 |
| `notes` | TEXT | | 병원 특성 메모 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `updated_at` | TIMESTAMPTZ | | 수정일시 | ✅ |

**인덱스**:
- `name` (검색용)
- `address` (검색용)
- `hospital_type` (필터링용)
- `(latitude, longitude)` (GPS 검색용, 결정 시)

**RLS**: 개발 중 비활성화

**결정 필요 사항**:
- [ ] `hospital_type`: ENUM으로 할지, TEXT로 할지
  - 제안: ENUM ('general_hospital', 'hospital', 'clinic', 'pharmacy')
- [ ] `patient_count`: 정확한 숫자 vs 범위 (대/중/소)
  - 제안: INTEGER (정확한 숫자) 또는 ENUM ('large', 'medium', 'small')
- [ ] `revenue`: 정확한 금액 vs 범위
  - 제안: DECIMAL(15,2) (정확한 금액) 또는 ENUM ('high', 'medium', 'low')
- [ ] GPS 좌표 저장 여부 (자동 방문 기록 기능용)
  - 제안: 저장 (향후 자동 방문 기록 기능을 위해)

---

### 3. contacts (담당자)

**목적**: 의사/스탭 정보 저장

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `account_id` | UUID | FK → accounts.id | 병원 ID | ✅ |
| `name` | TEXT | NOT NULL | 이름 | ✅ |
| `role` | TEXT | | 역할 (의사, 약사, 스탭 등) | ⚠️ 결정 필요 |
| `phone` | TEXT | | 전화번호 | ✅ |
| `email` | TEXT | | 이메일 | ✅ |
| `specialty` | TEXT | | 전문 분야 (의사인 경우) | ✅ |
| `notes` | TEXT | | 메모 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `updated_at` | TIMESTAMPTZ | | 수정일시 | ✅ |

**인덱스**:
- `account_id` (FK)
- `name` (검색용)
- `role` (필터링용)

**RLS**: 개발 중 비활성화

**결정 필요 사항**:
- [ ] `role`: ENUM으로 할지, TEXT로 할지
  - 제안: TEXT (유연성 확보) 또는 ENUM ('doctor', 'pharmacist', 'staff', 'other')

---

### 4. activities (행동 데이터)

**목적**: 영업사원의 실제 행동 기록 (Behavior Layer의 원천 데이터)

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `user_id` | TEXT | FK → users.clerk_id | 영업사원 ID | ✅ |
| `account_id` | UUID | FK → accounts.id | 병원 ID | ✅ |
| `contact_id` | UUID | FK → contacts.id, nullable | 담당자 ID | ✅ |
| `activity_type` | ENUM | NOT NULL | 활동 타입 | ✅ |
| `behavior_type` | ENUM | NOT NULL | Behavior Layer 지표 | ✅ |
| `description` | TEXT | | 상담 내용/설명 | ✅ |
| `quality_score` | INTEGER | | 품질 점수 | ⚠️ 결정 필요 |
| `quantity_score` | INTEGER | | 양 점수 | ⚠️ 결정 필요 |
| `latitude` | DECIMAL(10,8) | nullable | 위도 (GPS) | ⚠️ 결정 필요 |
| `longitude` | DECIMAL(11,8) | nullable | 경도 (GPS) | ⚠️ 결정 필요 |
| `duration_minutes` | INTEGER | nullable | 상담 시간 (분) | ⚠️ 결정 필요 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `updated_at` | TIMESTAMPTZ | | 수정일시 | ✅ |

**인덱스**:
- `user_id` (사용자별 조회)
- `account_id` (병원별 조회)
- `created_at` (날짜별 조회)
- `behavior_type` (Behavior 타입별 조회)
- `activity_type` (활동 타입별 조회)
- `(user_id, created_at)` (복합 인덱스)

**RLS**: 개발 중 비활성화

**결정 필요 사항**:
- [ ] `quality_score`, `quantity_score` 범위
  - 제안: INTEGER, 범위 1-10 또는 0-100
  - 기획안: "숙제 점수처럼 행동 강도/다양성/질을 점수로 보여줌"
  - 제안: 1-10 (간단함) 또는 0-100 (세밀함)
- [ ] GPS 좌표 저장 여부
  - 제안: 저장 (자동 방문 기록 기능용, 기획안 6.1 참조)
- [ ] `duration_minutes` 저장 여부
  - 제안: 저장 (상담 시간 분석용)

**ENUM 타입**:
- `activity_type`: 'visit', 'call', 'message', 'presentation', 'follow_up'
- `behavior_type`: 'approach', 'contact', 'visit', 'presentation', 'question', 'need_creation', 'demonstration', 'follow_up'

---

### 5. behavior_scores (행동 점수)

**목적**: 자동 계산된 행동 점수 (Behavior Layer 집계)

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `user_id` | TEXT | FK → users.clerk_id | 영업사원 ID | ✅ |
| `behavior_type` | ENUM | NOT NULL | Behavior Layer 지표 | ✅ |
| `intensity_score` | DECIMAL(5,2) | | 행동 강도 점수 (0-100) | ✅ |
| `diversity_score` | DECIMAL(5,2) | | 행동 다양성 점수 (0-100) | ✅ |
| `quality_score` | DECIMAL(5,2) | | 행동 질 점수 (0-100) | ✅ |
| `period_start` | DATE | NOT NULL | 집계 기간 시작일 | ✅ |
| `period_end` | DATE | NOT NULL | 집계 기간 종료일 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |

**인덱스**:
- `user_id`
- `behavior_type`
- `period_start`
- `(user_id, period_start, period_end)` (복합 인덱스)

**RLS**: 개발 중 비활성화

**계산 로직** (기획안 6.3 참조):
- **행동 강도(Intensity)**: 방문 + 콜 + 메시지 + 자료전달 * 가중치
- **행동 다양성(Diversity)**: 행동 종류 개수
- **행동 질(Quality)**: follow-up율 + 의사 반응 + 고민 해결 여부
- **점수 표준화**: 0~100점 스케일

---

### 6. prescriptions (처방)

**목적**: 처방/성과 원천 데이터 (Outcome Layer 계산용)

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `account_id` | UUID | FK → accounts.id | 병원 ID | ✅ |
| `contact_id` | UUID | FK → contacts.id, nullable | 담당자 ID | ✅ |
| `product_name` | TEXT | NOT NULL | 제품명 | ✅ |
| `product_code` | TEXT | nullable | 제품 코드/ID | ⚠️ 결정 필요 |
| `quantity` | DECIMAL(10,2) | NOT NULL | 처방량 | ⚠️ 결정 필요 |
| `quantity_unit` | TEXT | | 처방량 단위 | ⚠️ 결정 필요 |
| `prescription_date` | DATE | NOT NULL | 처방일 | ✅ |
| `price` | DECIMAL(15,2) | nullable | 가격 | ⚠️ 결정 필요 |
| `notes` | TEXT | | 메모 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `updated_at` | TIMESTAMPTZ | | 수정일시 | ✅ |

**인덱스**:
- `account_id`
- `prescription_date`
- `product_name` (검색용)
- `(account_id, prescription_date)` (복합 인덱스)

**RLS**: 개발 중 비활성화

**결정 필요 사항**:
- [ ] `product_code` 저장 여부
  - 제안: 저장 (제품 관리 시스템과 연동 시 필요)
- [ ] `quantity` 단위
  - 제안: `quantity_unit` 컬럼 추가 (예: 'box', 'bottle', 'tablet')
- [ ] `price` 저장 여부
  - 제안: 저장 (매출 분석용)

---

### 7. outcomes (성과 데이터)

**목적**: Outcome Layer 지표 (Behavior Layer의 결과)

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `user_id` | TEXT | FK → users.clerk_id | 영업사원 ID | ✅ |
| `account_id` | UUID | FK → accounts.id, nullable | 병원 ID (병원별 집계 시) | ⚠️ 결정 필요 |
| `hir_score` | DECIMAL(5,2) | | HIR (High-Impact Rate) | ✅ |
| `conversion_rate` | DECIMAL(5,2) | | 전환률 (%) | ✅ |
| `field_growth_rate` | DECIMAL(5,2) | | 필드 성장률 (%) | ✅ |
| `prescription_index` | DECIMAL(5,2) | | 처방 기반 성과지수 | ✅ |
| `period_type` | ENUM | NOT NULL | 기간 단위 | ⚠️ 결정 필요 |
| `period_start` | DATE | NOT NULL | 집계 기간 시작일 | ✅ |
| `period_end` | DATE | NOT NULL | 집계 기간 종료일 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |

**인덱스**:
- `user_id`
- `account_id` (nullable)
- `period_start`
- `period_type`
- `(user_id, period_start, period_end)` (복합 인덱스)

**RLS**: 개발 중 비활성화

**결정 필요 사항**:
- [ ] `account_id` nullable 여부
  - 제안: nullable (사용자 전체 집계 vs 병원별 집계 구분)
- [ ] `period_type` ENUM 값
  - 제안: ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')

**Outcome Layer 지표 설명** (PRD 3.2 참조):
- **HIR (High-Impact Rate)**: 행동 품질의 평균지표
- **전환률(Conversion Rate)**: 행동 → 성과 전환율
- **필드 성장률(Field Growth Rate)**: 필드별 성장률
- **처방 기반 성과지수(Prescription Outcome Index)**: 처방량 기반 성과지수

---

### 8. coaching_signals (코칭 신호)

**목적**: 경고 및 코칭 알림

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `user_id` | TEXT | FK → users.clerk_id | 영업사원 ID | ✅ |
| `signal_type` | ENUM | NOT NULL | 신호 타입 | ✅ |
| `priority` | ENUM | NOT NULL | 우선순위 | ✅ |
| `message` | TEXT | NOT NULL | 경고 메시지 | ✅ |
| `recommended_action` | TEXT | | 추천 코칭 액션 | ✅ |
| `account_id` | UUID | FK → accounts.id, nullable | 관련 병원 ID | ✅ |
| `contact_id` | UUID | FK → contacts.id, nullable | 관련 담당자 ID | ⚠️ 결정 필요 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `resolved_at` | TIMESTAMPTZ | nullable | 해결일시 | ✅ |

**인덱스**:
- `user_id`
- `priority`
- `created_at`
- `signal_type`
- `(user_id, priority, created_at)` (복합 인덱스)

**RLS**: 개발 중 비활성화

**ENUM 타입**:
- `signal_type`: 'behavior_lack', 'relationship_decline', 'competitor_activity', 'conversion_lack', 'interest_drop', 'weak_behavior'
- `priority`: 'high', 'medium', 'low'

**코칭 신호 유형** (기획안 6.4 참조):
- 행동 부족 경보
- 관계 악화 경보
- 경쟁사 등장 경보
- 전환 행동 부족 경보
- 병원 관심도 급하락 경보
- 사원별 취약 행동 경보

**결정 필요 사항**:
- [ ] `contact_id` 저장 여부
  - 제안: 저장 (담당자별 코칭 신호용)

---

### 9. competitor_signals (경쟁사 신호)

**목적**: 경쟁사 활동 기록

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `account_id` | UUID | FK → accounts.id | 병원 ID | ✅ |
| `contact_id` | UUID | FK → contacts.id, nullable | 담당자 ID | ✅ |
| `competitor_name` | TEXT | NOT NULL | 경쟁사 이름 | ✅ |
| `signal_type` | ENUM | NOT NULL | 신호 타입 | ✅ |
| `description` | TEXT | | 상세 설명 | ✅ |
| `detected_at` | TIMESTAMPTZ | NOT NULL | 탐지일시 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |

**인덱스**:
- `account_id`
- `detected_at`
- `competitor_name` (검색용)
- `signal_type`

**RLS**: 개발 중 비활성화

**ENUM 타입**:
- `signal_type`: 'mention', 'price_inquiry', 'preference_change', 'sample_request'

**경쟁사 탐지 기준** (기획안 6.5 참조):
- 의사 멘트: "요즘 ○○사에서 …"
- 가격/샘플 관련 문의
- 특정 제품선호도 변화
- 상담 내용 패턴에서 경쟁사 단어 등장

---

### 10. analytics_cache (분석 캐시)

**목적**: 계산된 지표 캐싱 (성능 최적화)

**컬럼 설계**:

| 컬럼명 | 타입 | 제약 | 설명 | 결정 필요 |
|--------|------|------|------|-----------|
| `id` | UUID | PK | 고유 식별자 | ✅ |
| `user_id` | TEXT | FK → users.clerk_id, nullable | 영업사원 ID (사용자별 캐시) | ⚠️ 결정 필요 |
| `cache_key` | TEXT | NOT NULL | 캐시 키 | ✅ |
| `cache_data` | JSONB | NOT NULL | 캐시 데이터 | ✅ |
| `period_start` | DATE | nullable | 기간 시작일 | ✅ |
| `period_end` | DATE | nullable | 기간 종료일 | ✅ |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성일시 | ✅ |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 만료일시 | ✅ |

**인덱스**:
- `user_id` (nullable)
- `cache_key`
- `expires_at` (만료된 캐시 정리용)

**RLS**: 개발 중 비활성화

**캐시 전략**:
- TTL: 기본 1시간 (변경 가능)
- 자동 정리: 만료된 캐시는 주기적으로 삭제

**결정 필요 사항**:
- [ ] `user_id` nullable 여부
  - 제안: nullable (전체 통계 캐시 vs 사용자별 캐시 구분)

---

## ENUM 타입 정의

### activity_type (활동 타입)

```sql
CREATE TYPE activity_type AS ENUM (
  'visit',        -- 방문
  'call',         -- 전화
  'message',      -- 메시지
  'presentation', -- 프레젠테이션
  'follow_up'     -- 후속 관리
);
```

### behavior_type (Behavior Layer 지표)

```sql
CREATE TYPE behavior_type AS ENUM (
  'approach',        -- 접근
  'contact',         -- 컨택
  'visit',           -- 대면
  'presentation',    -- 프레젠테이션
  'question',        -- 질문/탐색
  'need_creation',  -- 필요성 자극
  'demonstration',  -- 시연/자료제공
  'follow_up'       -- 후속관리
);
```

### user_role (사용자 역할)

```sql
CREATE TYPE user_role AS ENUM (
  'salesperson',  -- 영업사원
  'manager',      -- 팀장/관리자
  'head_manager'  -- 본부 관리자
);
```

### hospital_type (병원 타입) - 결정 필요

```sql
CREATE TYPE hospital_type AS ENUM (
  'general_hospital', -- 종합병원
  'hospital',         -- 병원
  'clinic',           -- 의원
  'pharmacy'          -- 약국
);
```

### coaching_signal_type (코칭 신호 타입)

```sql
CREATE TYPE coaching_signal_type AS ENUM (
  'behavior_lack',      -- 행동 부족 경보
  'relationship_decline', -- 관계 악화 경보
  'competitor_activity',  -- 경쟁사 등장 경보
  'conversion_lack',      -- 전환 행동 부족 경보
  'interest_drop',        -- 병원 관심도 급하락 경보
  'weak_behavior'        -- 사원별 취약 행동 경보
);
```

### signal_priority (신호 우선순위)

```sql
CREATE TYPE signal_priority AS ENUM (
  'high',    -- 높음
  'medium',  -- 중간
  'low'      -- 낮음
);
```

### competitor_signal_type (경쟁사 신호 타입)

```sql
CREATE TYPE competitor_signal_type AS ENUM (
  'mention',          -- 언급
  'price_inquiry',    -- 가격 문의
  'preference_change', -- 선호도 변화
  'sample_request'    -- 샘플 요청
);
```

### period_type (기간 단위)

```sql
CREATE TYPE period_type AS ENUM (
  'daily',     -- 일별
  'weekly',    -- 주별
  'monthly',   -- 월별
  'quarterly', -- 분기별
  'yearly'     -- 연별
);
```

---

## 테이블 관계도

```
users (1) ──< (N) activities
users (1) ──< (N) behavior_scores
users (1) ──< (N) outcomes
users (1) ──< (N) coaching_signals
users (1) ──< (N) analytics_cache

accounts (1) ──< (N) contacts
accounts (1) ──< (N) activities
accounts (1) ──< (N) prescriptions
accounts (1) ──< (N) outcomes (nullable)
accounts (1) ──< (N) coaching_signals (nullable)
accounts (1) ──< (N) competitor_signals

contacts (1) ──< (N) activities (nullable)
contacts (1) ──< (N) prescriptions (nullable)
contacts (1) ──< (N) coaching_signals (nullable)
contacts (1) ──< (N) competitor_signals (nullable)
```

---

## 결정 필요 사항 요약

### 높은 우선순위 (스키마 설계 전 결정 필요)

1. **accounts 테이블**
   - [ ] `hospital_type`: ENUM vs TEXT
   - [ ] `patient_count`: INTEGER vs ENUM 범위
   - [ ] `revenue`: DECIMAL vs ENUM 범위
   - [ ] GPS 좌표 저장 여부

2. **activities 테이블**
   - [ ] `quality_score`, `quantity_score` 범위 (1-10 vs 0-100)
   - [ ] GPS 좌표 저장 여부
   - [ ] `duration_minutes` 저장 여부

3. **prescriptions 테이블**
   - [ ] `product_code` 저장 여부
   - [ ] `quantity_unit` 컬럼 추가 여부
   - [ ] `price` 저장 여부

4. **outcomes 테이블**
   - [ ] `account_id` nullable 여부
   - [ ] `period_type` ENUM 값 정의

5. **contacts 테이블**
   - [ ] `role`: ENUM vs TEXT

### 중간 우선순위 (구현 중 결정 가능)

6. **coaching_signals 테이블**
   - [ ] `contact_id` 저장 여부

7. **analytics_cache 테이블**
   - [ ] `user_id` nullable 여부

---

## 다음 단계

1. ✅ 이 문서 검토 및 결정 사항 논의
2. ⏳ 결정 사항 확정
3. ⏳ 최종 스키마 설계
4. ⏳ 마이그레이션 파일 작성
5. ⏳ TypeScript 타입 생성

---

## 참고 문서

- [기획안 (plan.md)](plan.md)
- [PRD (prd.md)](prd.md)
- [구현 계획 (todo.md)](todo.md)

