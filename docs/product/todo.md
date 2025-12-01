# Behavior-Driven CRM v2.1 - 상세 구현 계획

> 기획안(plan.md)과 PRD(prd.md)를 바탕으로 작성된 웹 빌드 구현 계획서

---

## 📋 목차

1. [스프린트 1: 초기 스키마 + Auth + 기본 UI](#스프린트-1-초기-스키마--auth--기본-ui)
2. [스프린트 2: Behavior Layer 구축](#스프린트-2-behavior-layer-구축)
3. [스프린트 3: Outcome Layer 구축](#스프린트-3-outcome-layer-구축)
4. [스프린트 4: 분석 대시보드](#스프린트-4-분석-대시보드)
5. [스프린트 5: Growth Map + AI 추천](#스프린트-5-growth-map--ai-추천)
6. [스프린트 6: QA 및 파이롯 운영](#스프린트-6-qa-및-파이롯-운영)
7. [스프린트 7: 사용자 입력 시스템 개선 (PRD 기반)](#스프린트-7-사용자-입력-시스템-개선-prd-기반)

---

## 스프린트 1: 초기 스키마 + Auth + 기본 UI ✅ **완료**

**목표**: 프로젝트 기반 구조 구축 및 핵심 데이터 모델 설계

### 1.1 데이터베이스 스키마 설계 및 마이그레이션

#### 1.1.1 Core 테이블 생성

- [x] `accounts` 테이블 생성 (crm_schema.sql에 포함됨)
  - [x] 컬럼: id, name, address, phone, type, specialty, patient_count, revenue, notes, created_at, updated_at
  - [x] 인덱스: name
  - [x] RLS 비활성화 (개발 단계)
- [x] `contacts` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, account_id (FK), name, role, phone, email, specialty, notes, created_at, updated_at
  - [x] 인덱스: account_id
  - [x] RLS 비활성화 (개발 단계)

- [x] `activities` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, user_id (FK to users.id), account_id (FK), contact_id (FK, nullable), type, behavior, description, quality_score, quantity_score, duration_minutes, performed_at, created_at, updated_at
  - [x] type: ENUM ('visit', 'call', 'message', 'presentation', 'follow_up')
  - [x] behavior: ENUM ('approach', 'contact', 'visit', 'presentation', 'question', 'need_creation', 'demonstration', 'follow_up')
  - [x] 인덱스: user_id, account_id, performed_at
  - [x] RLS 비활성화 (개발 단계)

- [x] `outcomes` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, user_id (FK), account_id (FK, nullable), hir_score, conversion_rate, field_growth_rate, prescription_index, period_type, period_start, period_end, created_at
  - [x] 인덱스: user_id, account_id, period_start
  - [x] RLS 비활성화 (개발 단계)

- [x] `prescriptions` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, account_id (FK), contact_id (FK, nullable), related_activity_id (FK, nullable), product_name, product_code, quantity, quantity_unit, price, prescription_date, notes, created_at, updated_at
  - [x] 인덱스: account_id, prescription_date
  - [x] RLS 비활성화 (개발 단계)

- [x] `behavior_scores` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, user_id (FK), behavior, intensity_score, diversity_score, quality_score, period_start, period_end, created_at
  - [x] behavior: TEXT (8개 Behavior Layer 지표)
  - [x] 인덱스: user_id, behavior, period_start
  - [x] RLS 비활성화 (개발 단계)

- [x] `coaching_signals` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, user_id (FK), account_id (FK, nullable), contact_id (FK, nullable), type, priority, message, recommended_action, is_resolved, resolved_at, created_at
  - [x] type: TEXT
  - [x] priority: ENUM ('high', 'medium', 'low')
  - [x] 인덱스: user_id, priority
  - [x] RLS 비활성화 (개발 단계)

- [x] `competitor_signals` 테이블 생성 (crm_schema.sql에 포함됨)

  - [x] 컬럼: id, account_id (FK), contact_id (FK, nullable), competitor_name, type, description, detected_at, created_at
  - [x] type: TEXT
  - [x] 인덱스: account_id, detected_at
  - [x] RLS 비활성화 (개발 단계)

- [x] `analytics_cache` 테이블 생성 (crm_schema.sql에 포함됨)
  - [x] 컬럼: id, user_id (FK, nullable), cache_key, data (JSONB), period_start, period_end, expires_at, created_at
  - [x] 인덱스: user_id, cache_key, expires_at
  - [x] RLS 비활성화 (개발 단계)

#### 1.1.2 마이그레이션 파일 작성

- [x] `supabase/migrations/crm_schema.sql` 생성
- [x] 모든 테이블 생성 SQL 통합
- [x] 외래 키 제약 조건 추가
- [x] 마이그레이션 테스트 (스키마 파일 작성 완료)

### 1.2 프로젝트 기본 구조 설정

#### 1.2.1 디렉토리 구조 생성

- [x] `types/` 디렉토리 생성
  - [x] `database.types.ts` - Supabase 타입 정의
  - [x] `behavior.types.ts` - Behavior Layer 타입
  - [x] `outcome.types.ts` - Outcome Layer 타입
- [x] `actions/` 디렉토리 생성

  - [x] Server Actions 기본 구조 준비

- [x] `constants/` 디렉토리 생성
  - [x] `behavior-types.ts` - Behavior Layer 8개 지표 상수
  - [x] `outcome-types.ts` - Outcome Layer 4개 지표 상수
  - [x] `activity-types.ts` - Activity 타입 상수
  - [x] `user-roles.ts` - 사용자 역할 상수

#### 1.2.2 TypeScript 타입 정의

- [x] `types/database.types.ts` 작성
  - [x] 모든 테이블 타입 정의
  - [ ] Supabase 자동 생성 타입과 통합 (마이그레이션 실행 후)
- [x] `types/behavior.types.ts` 작성
  - [x] BehaviorType enum
  - [x] ActivityType enum
  - [x] BehaviorScore 인터페이스
- [x] `types/outcome.types.ts` 작성
  - [x] Outcome 인터페이스
  - [x] HIR, 전환률, 성장률, 처방지수 타입

### 1.3 인증 및 권한 구조

#### 1.3.1 사용자 역할 관리

- [x] `users` 테이블에 `role` 컬럼 추가
  - [x] role: TEXT with CHECK ('salesperson', 'manager', 'head_manager')
  - [x] 마이그레이션 작성 (crm_schema.sql에 포함됨)
- [x] Clerk Metadata와 역할 동기화
  - [x] `app/api/sync-user/route.ts` 수정
  - [x] Clerk 사용자 메타데이터에서 role 읽기

#### 1.3.2 권한 체크 유틸리티

- [x] `lib/auth/check-role.ts` 생성
  - [x] 현재 사용자 역할 확인 함수
  - [x] 역할별 접근 권한 체크 함수
- [x] `lib/auth/permissions.ts` 생성
  - [x] 역할별 접근 권한 매트릭스 정의
  - [x] 데이터 접근 권한 체크 함수

### 1.4 기본 UI 컴포넌트

#### 1.4.1 레이아웃 컴포넌트

- [x] `components/layout/app-layout.tsx` 생성

  - [x] 사이드바 네비게이션
  - [x] 헤더 (사용자 정보, 알림)
  - [x] 모바일 반응형 처리 (Sheet 컴포넌트 사용)

- [x] `components/layout/sidebar.tsx` 생성
  - [x] 메뉴 항목: Dashboard, Analysis, Growth, Activities, Outcomes, Manager
  - [x] 역할별 메뉴 표시/숨김 로직
- [x] `components/layout/header.tsx` 생성
  - [x] 사용자 프로필 드롭다운
  - [x] 알림 아이콘 (향후 구현 준비)
  - [x] 모바일 메뉴 토글 버튼

#### 1.4.2 공통 컴포넌트

- [x] `components/ui/card.tsx` (shadcn 설치)
- [x] `components/ui/button.tsx` (shadcn 설치)
- [x] `components/ui/input.tsx` (shadcn 설치)
- [x] `components/ui/select.tsx` (shadcn 설치)
- [x] `components/ui/badge.tsx` (shadcn 설치)
- [x] `components/ui/table.tsx` (shadcn 설치)
- [x] `components/ui/dropdown-menu.tsx` (shadcn 설치)
- [x] `components/ui/sheet.tsx` (shadcn 설치)
- [x] `components/ui/skeleton.tsx` (shadcn 설치)

#### 1.4.3 차트 라이브러리 설정

- [x] Recharts 설치: `pnpm add recharts`
- [x] `components/charts/chart-wrapper.tsx` 생성
  - [x] 공통 차트 래퍼 컴포넌트
  - [x] 로딩 상태 처리 (Skeleton UI)
  - [x] 에러 상태 처리
  - [x] 빈 데이터 상태 처리

### 1.5 기본 페이지 라우팅

#### 1.5.1 페이지 구조 생성

- [x] `app/(dashboard)/layout.tsx` 생성
  - [x] AppLayout 적용
  - [x] 인증 체크 (Clerk)
  - [x] 사용자 동기화 확인
- [x] `app/(dashboard)/dashboard/page.tsx` 생성
  - [x] 기본 대시보드 페이지 (임시)
  - [x] PRD 4.1 구조 준비 (Behavior Quality Score, Outcome Layer 지표, Behavior-Outcome 관계 지도 영역)
- [x] `app/(dashboard)/analysis/page.tsx` 생성
  - [x] 분석 페이지 (임시)
  - [x] PRD 4.2 구조 준비 (차트 영역)
- [x] `app/(dashboard)/growth/page.tsx` 생성
  - [x] 성장 맵 페이지 (임시)
  - [x] PRD 4.3 구조 준비 (트렌드 차트 영역)
- [x] `app/(dashboard)/activities/page.tsx` 생성
  - [x] 활동 기록 페이지 (임시)
- [x] `app/(dashboard)/outcomes/page.tsx` 생성
  - [x] 성과 리포트 페이지 (임시)
- [x] `app/(dashboard)/manager/page.tsx` 생성
  - [x] 관리자 대시보드 페이지 (권한 체크 포함)

#### 1.5.2 유틸리티 함수

- [x] `lib/supabase/get-user-id.ts` 생성
  - [x] Clerk clerk_id로 users 테이블에서 UUID id 조회
  - [x] 캐싱 고려
- [x] `lib/utils/date.ts` 생성
  - [x] 기간 계산 함수 (7일, 30일 등)
  - [x] 날짜 포맷팅 함수

---

## 스프린트 2: Behavior Layer 구축 ✅ **완료**

**목표**: 영업사원의 행동 데이터 수집 및 저장 시스템 구축

### 2.1 Activity 기록 기능 ✅ **완료**

#### 2.1.1 Activity 입력 폼

- [x] `components/activities/activity-form.tsx` 생성
  - [x] 활동 타입 선택 (visit, call, message, presentation, follow_up)
  - [x] Behavior 타입 선택 (8개 지표)
  - [x] 병원(Account) 선택
  - [x] 담당자(Contact) 선택
  - [x] 설명 입력
  - [x] 품질 점수 입력 (0-100)
  - [x] 양 점수 입력 (0-100)
  - [x] React Hook Form + Zod 검증

#### 2.1.2 Activity Server Actions

- [x] `actions/activities/create-activity.ts` 생성
  - [x] Activity 생성 로직
  - [x] Supabase 클라이언트 사용
  - [x] 에러 처리
- [x] `actions/activities/get-activities.ts` 생성

  - [x] 사용자별 Activity 조회
  - [x] 필터링 (날짜, 타입, 병원)
  - [x] 페이지네이션

- [x] `actions/activities/update-activity.ts` 생성

  - [x] Activity 수정 로직
  - [x] 권한 체크 (본인만 수정 가능)

- [x] `actions/activities/delete-activity.ts` 생성
  - [x] Activity 삭제 로직
  - [x] 권한 체크

#### 2.1.3 Activity 목록 페이지

- [x] `app/(dashboard)/activities/page.tsx` 구현
  - [x] Activity 목록 표시 (Table)
  - [x] 필터링 UI
  - [x] 페이지네이션
  - [x] Activity 추가 버튼
- [x] `components/activities/activity-list.tsx` 생성
  - [x] Activity 목록 컴포넌트
  - [x] 정렬 기능
  - [x] 수정/삭제 액션

### 2.2 Account (병원) 관리 ✅ **완료**

#### 2.2.1 Account CRUD Server Actions

- [x] `actions/accounts/create-account.ts` 생성
- [x] `actions/accounts/get-accounts.ts` 생성
- [x] `actions/accounts/update-account.ts` 생성
- [x] `actions/accounts/delete-account.ts` 생성

#### 2.2.2 Account 관리 UI

- [x] `components/accounts/account-form.tsx` 생성
  - [x] 병원 정보 입력 폼
  - [x] 병원 타입, 환자 수, 매출 등
- [x] `components/accounts/account-list.tsx` 생성
  - [x] 병원 목록 표시
  - [x] 검색 기능
- [x] `app/(dashboard)/accounts/page.tsx` 생성
  - [x] Account 관리 페이지

### 2.3 Contact (담당자) 관리 ✅ **완료**

#### 2.3.1 Contact CRUD Server Actions

- [x] `actions/contacts/create-contact.ts` 생성
- [x] `actions/contacts/get-contacts.ts` 생성
- [x] `actions/contacts/update-contact.ts` 생성
- [x] `actions/contacts/delete-contact.ts` 생성

#### 2.3.2 Contact 관리 UI

- [x] `components/contacts/contact-form.tsx` 생성
- [x] `components/contacts/contact-list.tsx` 생성
- [x] Account 상세 페이지에 Contact 목록 표시 (Activity 폼에서 Account 선택 시 해당 Contact만 표시)

### 2.4 Behavior Score 계산 엔진 ✅ **완료**

#### 2.4.1 Behavior Score 계산 함수

- [x] `lib/analytics/calculate-behavior-scores.ts` 생성
  - [x] 행동 강도(Intensity) 계산
    - [x] 방문 + 콜 + 메시지 + 자료전달 \* 가중치
  - [x] 행동 다양성(Diversity) 계산
    - [x] 행동 종류 개수
  - [x] 행동 질(Quality) 계산
    - [x] follow-up율 + 의사 반응 + 고민 해결 여부
  - [x] 0~100점 스케일로 표준화

#### 2.4.2 Behavior Score 저장 로직

- [x] `actions/behavior-scores/calculate-and-save.ts` 생성
  - [x] 주기별 Behavior Score 계산
  - [x] `behavior_scores` 테이블에 저장
  - [x] 기간별 집계 (7일, 30일)

#### 2.4.3 Behavior Score 조회

- [x] `actions/behavior-scores/get-behavior-scores.ts` 생성
  - [x] 사용자별 Behavior Score 조회
  - [x] 기간별 필터링

---

## 스프린트 3: Outcome Layer 구축 ✅ **완료**

**목표**: 행동 데이터를 기반으로 성과 지표 계산 및 저장

### 3.1 Outcome 계산 엔진 ✅ **완료**

#### 3.1.1 HIR (High-Impact Rate) 계산

- [x] `lib/analytics/calculate-hir.ts` 생성
  - [x] HIR 계산 알고리즘 구현
  - [x] Behavior Layer와 Outcome Layer 연결 로직
  - [x] 병원별, 기간별 HIR 계산

#### 3.1.2 전환률(Conversion Rate) 계산

- [x] `lib/analytics/calculate-conversion-rate.ts` 생성
  - [x] 행동 → 성과 전환율 계산
  - [x] 처방 증가율 기반 계산

#### 3.1.3 필드 성장률(Field Growth Rate) 계산

- [x] `lib/analytics/calculate-field-growth.ts` 생성
  - [x] 필드별 성장률 계산
  - [x] 전년 대비, 전월 대비 비교

#### 3.1.4 처방 기반 성과지수 계산

- [x] `lib/analytics/calculate-prescription-index.ts` 생성
  - [x] 처방량 기반 성과지수 계산
  - [x] 가중치 적용

### 3.2 Prescription (처방) 관리 ✅ **완료**

#### 3.2.1 Prescription CRUD

- [x] `actions/prescriptions/create-prescription.ts` 생성
- [x] `actions/prescriptions/get-prescriptions.ts` 생성
- [x] `actions/prescriptions/update-prescription.ts` 생성
- [x] `actions/prescriptions/delete-prescription.ts` 생성

#### 3.2.2 Prescription 입력 UI

- [x] `components/prescriptions/prescription-form.tsx` 생성
  - [x] 처방 정보 입력 폼
  - [x] 제품명, 수량, 처방일 등
- [x] `components/prescriptions/prescription-list.tsx` 생성
  - [x] 처방 목록 표시 및 수정/삭제 기능

### 3.3 Outcome 자동 계산 및 저장 ✅ **완료**

#### 3.3.1 Outcome 계산 및 저장 로직

- [x] `actions/outcomes/calculate-and-save.ts` 생성
  - [x] 주기별 Outcome 계산 (일별, 주별, 월별)
  - [x] 모든 Outcome 지표 계산
  - [x] `outcomes` 테이블에 저장

#### 3.3.2 Outcome 조회

- [x] `actions/outcomes/get-outcomes.ts` 생성
  - [x] 사용자별 Outcome 조회
  - [x] 기간별 필터링
  - [x] 병원별 필터링

### 3.4 Behavior-Outcome 관계 분석 ✅ **완료**

#### 3.4.1 상관관계 분석 함수

- [x] `lib/analytics/analyze-behavior-outcome-correlation.ts` 생성
  - [x] 어떤 행동이 성과에 가장 큰 영향을 미치는지 분석
  - [x] 가중치 계산

#### 3.4.2 Analytics Cache 시스템

- [x] `actions/analytics-cache/get-cached-analytics.ts` 생성
  - [x] 캐시된 분석 데이터 조회
  - [x] 캐시 만료 체크
- [x] `actions/analytics-cache/save-cached-analytics.ts` 생성
  - [x] 계산된 분석 데이터 캐싱
  - [x] TTL 설정

---

## 스프린트 4: 분석 대시보드 ✅ **완료**

**목표**: Behavior-Outcome 통합 대시보드 및 분석 페이지 구현

### 4.1 메인 대시보드 (Main Dashboard) ✅ **완료**

#### 4.1.1 Behavior Quality Score 차트 ✅ **완료**

- [x] `components/dashboard/behavior-quality-chart.tsx` 생성
  - [x] RadarChart 구현 (Recharts)
  - [x] 8개 Behavior 지표 표시
  - [x] 최근 7일/30일 선택
  - [x] 데이터 로딩 상태 처리

#### 4.1.2 Outcome Layer 핵심지표 카드 ✅ **완료**

- [x] `components/dashboard/outcome-stat-cards.tsx` 생성
  - [x] HIR, 전환률, 성장률, 처방지수 Stat Cards
  - [x] Trend Sparkline (작은 트렌드 그래프)
  - [x] 전일/전주/전월 대비 변화율 표시

#### 4.1.3 Behavior-Outcome 관계 지도 ✅ **완료**

- [x] `components/dashboard/behavior-outcome-map.tsx` 생성
  - [x] TreeMap 구현 (Recharts)
  - [x] 어떤 행동이 성과에 가장 큰 영향 미치는지 시각화
  - [x] 인터랙티브 호버 효과

#### 4.1.4 메인 대시보드 페이지 통합 ✅ **완료**

- [x] `app/(dashboard)/dashboard/page.tsx` 구현
  - [x] 모든 대시보드 컴포넌트 통합
  - [x] 데이터 fetching (Server Actions)
  - [x] 로딩 상태 처리
  - [x] 에러 처리

### 4.2 분석 페이지 (Analysis Dashboard) ✅ **완료**

#### 4.2.1 HIR ↔ 성장률 상관도 차트 ✅ **완료**

- [x] `components/analysis/hir-growth-scatter.tsx` 생성
  - [x] ScatterChart 구현
  - [x] X축: HIR, Y축: 필드 성장률
  - [x] 버블 크기: 전체 활동량
  - [x] 툴팁 표시

#### 4.2.2 고객 세분화 및 HIR 비교 ✅ **완료**

- [x] `components/analysis/customer-segmentation.tsx` 생성
  - [x] PieChart: 고객군 비율 분포
  - [x] BarChart: 고객군별 HIR 비교
  - [x] 병원 타입별 세분화

#### 4.2.3 활동 볼륨 × 품질 Matrix ✅ **완료**

- [x] `components/analysis/volume-quality-heatmap.tsx` 생성
  - [x] Grid Heatmap 구현 (커스텀)
  - [x] X축: 활동 볼륨, Y축: 품질
  - [x] 색상으로 강도 표시
  - [x] 각 셀 호버 시 상세 정보

#### 4.2.4 처방 기반 성과 Funnel Chart ✅ **완료**

- [x] `components/analysis/prescription-funnel.tsx` 생성
  - [x] BarChart로 Funnel 구현
  - [x] 행동 → 고객 반응 → 처방량 변화 → 성과
  - [x] 각 단계별 전환율 표시

#### 4.2.5 분석 페이지 통합 ✅ **완료**

- [x] `app/(dashboard)/analysis/page.tsx` 구현
  - [x] 모든 분석 차트 통합
  - [x] 필터링 옵션 (향후 구현 예정)
  - [x] 데이터 export 기능 (향후)

### 4.3 관리자 대시보드 (Manager Dashboard) ✅ **완료**

#### 4.3.1 팀원 행동 점수 순위 ✅ **완료**

- [x] `components/manager/team-behavior-ranking.tsx` 생성
  - [x] 팀원별 Behavior Score 순위표
  - [x] 정렬 기능
  - [x] 상세 보기 링크

#### 4.3.2 팀원 위험도 리스트 ✅ **완료**

- [x] `components/manager/team-risk-list.tsx` 생성
  - [x] Coaching Signals 기반 위험도 표시
  - [x] 우선순위별 필터링
  - [x] 코칭 추천 액션 표시

#### 4.3.3 병원 위험 지도 ✅ **완료**

- [x] `components/manager/hospital-risk-map.tsx` 생성
  - [x] 리스트 형태로 위험 병원 표시
  - [x] 위험 신호 개수 및 우선순위 표시
  - [x] 지도 기반 병원 위험도 표시 (향후)

#### 4.3.4 경쟁사 활동 히트맵 ✅ **완료**

- [x] `components/manager/competitor-heatmap.tsx` 생성
  - [x] 경쟁사 활동 히트맵
  - [x] 병원별 경쟁사 활동 표시
  - [x] 경쟁사별 그룹화 및 활동량 표시

#### 4.3.5 팀 목표 달성 현황 ✅ **완료**

- [x] `components/manager/team-goals.tsx` 생성
  - [x] 팀 전체 목표 vs 실제 달성도
  - [x] 진행률 표시
  - [x] 4개 지표별 목표 달성도 (HIR, 전환률, 성장률, 처방지수)

#### 4.3.6 관리자 대시보드 페이지 ✅ **완료**

- [x] `app/(dashboard)/manager/page.tsx` 생성
  - [x] 역할 체크 (manager, head_manager만 접근)
  - [x] 모든 관리자 컴포넌트 통합

---

## 스프린트 5: Growth Map + AI 추천 ✅ **완료**

**목표**: 개인 성장 맵 및 AI 기반 코칭 추천 시스템

### 5.1 영업사원 개별 성장 맵 ✅ **완료**

#### 5.1.1 행동 품질 트렌드 차트 ✅ **완료**

- [x] `components/growth/behavior-trend-chart.tsx` 생성
  - [x] 라인 차트: 8개 Behavior 지표별 트렌드
  - [x] 기간 선택 (7일, 30일, 90일)
  - [x] 비교 모드 (이전 기간과 비교)
- [x] `actions/behavior-scores/get-behavior-scores-trend.ts` 생성
  - [x] 기간별 Behavior Score를 일별/주별로 집계하여 반환

#### 5.1.2 Outcome Layer 변화 차트 ✅ **완료**

- [x] `components/growth/outcome-trend-chart.tsx` 생성
  - [x] 라인 차트: HIR, 전환률, 성장률, 처방지수 트렌드
  - [x] 목표선 표시 (평균값 기준)
  - [ ] 예측선 (향후)

#### 5.1.3 성장 맵 페이지 ✅ **완료**

- [x] `app/(dashboard)/growth/page.tsx` 구현
  - [x] 모든 성장 차트 통합
  - [ ] 개인 목표 설정 기능 (향후 구현)
  - [ ] 성장 리포트 생성 (향후 구현)

### 5.2 AI 기반 코칭 추천 ✅ **완료**

#### 5.2.1 코칭 신호 생성 로직 ✅ **완료**

- [x] `lib/analytics/generate-coaching-signals.ts` 생성
  - [x] 행동 부족 경보 감지
  - [x] 관계 악화 경보 감지
  - [x] 경쟁사 등장 경보 감지
  - [x] 전환 행동 부족 경보 감지
  - [x] 병원 관심도 급하락 경보 감지
  - [x] 사원별 취약 행동 경보 감지
  - [x] 우선순위 계산 (High/Medium/Low)

#### 5.2.2 코칭 추천 액션 생성 ✅ **완료**

- [x] `lib/analytics/generate-coaching-actions.ts` 생성
  - [x] 신호 타입별 추천 액션 생성
  - [x] 템플릿 기반 메시지 생성
  - [x] 개인화된 코칭 문구

#### 5.2.3 코칭 신호 저장 및 조회 ✅ **완료**

- [x] `actions/coaching-signals/generate-and-save.ts` 생성
  - [x] 주기별 코칭 신호 생성 (일별)
  - [x] `coaching_signals` 테이블에 저장
- [x] `actions/coaching-signals/get-signals.ts` 수정
  - [x] 사용자별 코칭 신호 조회 (일반 사용자도 자신의 신호 조회 가능)
  - [x] 우선순위별 필터링
  - [x] 해결/미해결 필터링
- [x] `actions/coaching-signals/resolve-signal.ts` 생성
  - [x] 코칭 신호 해결 처리

#### 5.2.4 코칭 신호 UI ✅ **완료**

- [x] `components/coaching/coaching-signals-list.tsx` 생성
  - [x] 코칭 신호 목록 표시
  - [x] 우선순위별 색상 표시
  - [x] 추천 액션 표시
  - [x] 해결 처리 기능

### 5.3 경쟁사 활동 자동 탐지 ✅ **완료**

#### 5.3.1 경쟁사 신호 감지 로직 ✅ **완료**

- [x] `lib/analytics/detect-competitor-signals.ts` 생성
  - [x] Activity description에서 경쟁사 키워드 탐지
  - [x] 의사 멘트 패턴 분석
  - [x] 가격/샘플 관련 문의 감지
  - [x] 제품 선호도 변화 감지

#### 5.3.2 경쟁사 신호 저장 ✅ **완료**

- [x] `actions/competitor-signals/detect-and-save.ts` 생성
  - [x] Activity 생성 시 자동 감지
  - [x] `competitor_signals` 테이블에 저장
- [x] `actions/activities/create-activity.ts` 수정
  - [x] Activity 생성 후 경쟁사 신호 자동 감지

#### 5.3.3 경쟁사 신호 UI

- [ ] `components/competitor/competitor-signals-list.tsx` 생성 (선택적, 관리자 대시보드에 이미 존재)
  - [ ] 경쟁사 활동 목록 표시
  - [ ] 병원별 필터링
  - [ ] 위험도 표시

### 5.4 Next Best Action 추천 ✅ **완료**

#### 5.4.1 다음 행동 추천 알고리즘 ✅ **완료**

- [x] `lib/analytics/recommend-next-action.ts` 생성
  - [x] 병원별, 담당자별 추천 행동 계산
  - [x] Behavior-Outcome 상관관계 기반
  - [x] 최근 활동 패턴 분석

#### 5.4.2 Next Best Action UI ✅ **완료**

- [x] `components/recommendations/next-best-action.tsx` 생성
  - [x] 추천 행동 카드 표시
  - [x] 병원별 추천 목록
  - [x] 추천 이유 표시
- [x] `actions/recommendations/get-next-best-actions.ts` 생성
- [x] Growth 페이지에 통합

---

## 스프린트 6: QA 및 파이롯 운영

**목표**: 품질 보증, 성능 최적화, 초기 사용자 테스트

### 6.1 성능 최적화

#### 6.1.1 데이터베이스 최적화

- [x] 인덱스 최적화
  - [x] 쿼리 성능 분석
  - [x] 필요한 인덱스 추가 (복합 인덱스 추가 완료)
  - [ ] 불필요한 인덱스 제거 (향후 성능 모니터링 후 결정)
- [ ] 쿼리 최적화
  - [ ] N+1 쿼리 문제 해결
  - [ ] JOIN 최적화
  - [ ] 집계 쿼리 최적화

#### 6.1.2 프론트엔드 최적화

- [ ] React Query 캐싱 전략 (계획에서 제외됨 - React Query 도입 안 함)
  - [ ] 적절한 staleTime 설정
  - [ ] 캐시 무효화 전략
- [x] 코드 스플리팅

  - [x] 차트 컴포넌트 lazy loading
  - [x] 페이지별 코드 스플리팅

- [ ] 이미지 최적화
  - [ ] Next.js Image 컴포넌트 사용
  - [ ] 적절한 이미지 포맷 사용

#### 6.1.3 Analytics Cache 최적화

- [x] 캐시 전략 개선
  - [x] 자주 사용되는 분석 데이터 캐싱
  - [x] TTL 조정 (캐시 타입별 자동 설정)
  - [x] 캐시 무효화 로직 (Activity/Outcome 생성 시 자동 무효화)

### 6.2 에러 처리 및 로깅

#### 6.2.1 에러 바운더리

- [x] `components/error-boundary.tsx` 생성
  - [x] 전역 에러 처리
  - [x] 사용자 친화적 에러 메시지

#### 6.2.2 로깅 시스템

- [x] 클라이언트 로깅
  - [x] 주요 기능 실행 로그
  - [x] 에러 로그
- [x] 서버 로깅
  - [x] Server Actions 실행 로그
  - [x] 데이터베이스 쿼리 로그

### 6.3 테스트

#### 6.3.1 단위 테스트

- [x] 계산 함수 테스트
  - [x] Behavior Score 계산 테스트 (기본 테스트 작성 완료)
  - [ ] Outcome 계산 테스트 (향후 추가)
  - [ ] 코칭 신호 생성 테스트 (향후 추가)

#### 6.3.2 통합 테스트

- [ ] Server Actions 테스트
  - [ ] Activity CRUD 테스트
  - [ ] Outcome 계산 및 저장 테스트

#### 6.3.3 E2E 테스트 (선택)

- [ ] 주요 사용자 플로우 테스트
  - [ ] Activity 생성 플로우
  - [ ] 대시보드 조회 플로우

### 6.4 문서화

#### 6.4.1 API 문서

- [x] Server Actions 문서화
  - [x] JSDoc 주석 추가 (주요 Server Actions에 추가)
  - [x] 파라미터 및 반환값 설명 (docs/api/server-actions.md 생성)

#### 6.4.2 사용자 가이드

- [ ] 주요 기능 사용법 문서
- [ ] FAQ 작성

### 6.5 보안 검토

#### 6.5.1 RLS 정책 검토

- [ ] 개발 환경 RLS 비활성화 확인
- [ ] 프로덕션 RLS 정책 설계
  - [ ] 영업사원: 자신의 데이터만
  - [ ] 팀장: 팀원 데이터 조회
  - [ ] 본부장: 전체 데이터 조회

#### 6.5.2 입력 검증

- [x] 모든 입력 폼 검증 강화 (Zod 스키마 강화, Server Actions 검증 추가)
- [x] SQL 인젝션 방지 확인 (Supabase가 자동 처리, 재확인 완료)
- [x] XSS 방지 확인 (React 자동 이스케이프, Zod 검증 추가)

### 6.6 모바일 최적화

#### 6.6.1 반응형 디자인 검토

- [ ] 모바일 화면 테스트
- [ ] 터치 인터랙션 최적화
- [ ] 모바일 네비게이션 개선

#### 6.6.2 모바일 성능

- [ ] 모바일 로딩 속도 최적화
- [ ] 이미지 최적화
- [ ] 번들 크기 최적화

### 6.7 파이롯 운영 준비

#### 6.7.1 초기 데이터 준비

- [x] 샘플 데이터 생성 스크립트 (scripts/generate-sample-data.ts 생성)
- [ ] 테스트 계정 생성 (수동 작업 가이드 필요)

#### 6.7.2 모니터링 설정

- [ ] 에러 모니터링 (Sentry 등) (로깅 시스템이 모니터링 도구 연동 준비됨)
- [ ] 성능 모니터링
- [ ] 사용자 행동 분석 (선택)

#### 6.7.3 피드백 수집 시스템

- [x] 피드백 폼 추가 (components/feedback/feedback-form.tsx 생성)
- [ ] 사용자 설문 준비 (향후)

---

## 스프린트 7: 사용자 입력 시스템 개선 (PRD 기반)

**목표**: PRD(`docs/product/input-prd.md`) 요구사항에 맞춰 영업사원의 현장 데이터 입력 경험을 개선

**핵심 원칙**: "최소한의 터치로 최대한의 데이터를 남긴다"

- Mobile First: 한 손 조작 가능
- Speed: 30초 이내 입력 완료
- Context Aware: 자동 입력 및 스마트 기본값
- Immediate Feedback: Optimistic UI 및 Toast 알림

### 7.1 필수 UI 컴포넌트 추가 ✅ **완료**

#### 7.1.1 shadcn/ui 컴포넌트 설치 ✅ **완료**

- [x] `components/ui/slider.tsx` 설치
  - [x] shadcn CLI로 설치: `pnpx shadcn@latest add slider`
  - [x] 품질/양적 점수 입력용 (0-100)
- [x] `components/ui/radio-group.tsx` 설치
  - [x] shadcn CLI로 설치: `pnpx shadcn@latest add radio-group`
  - [x] 활동 유형 선택용 (Button 스타일)
- [x] `components/ui/popover.tsx` 설치
  - [x] shadcn CLI로 설치: `pnpx shadcn@latest add popover`
  - [x] Combobox 구현용
- [x] `components/ui/command.tsx` 설치
  - [x] shadcn CLI로 설치: `pnpx shadcn@latest add command`
  - [x] Combobox 검색 기능용
- [x] `sonner` 패키지 설치
  - [x] `pnpm add sonner`
  - [x] Toast 알림 시스템용
  - [x] `components/ui/sonner.tsx` 생성 (Toaster 컴포넌트)

#### 7.1.2 공통 컴포넌트 구현 ✅ **완료**

- [x] `components/ui/combobox.tsx` 생성
  - [x] Popover + Command 조합
  - [x] 검색 가능한 선택 컴포넌트
  - [x] 최근 방문 항목 상단 노출 기능
  - [x] Account(병원) 검색용으로 최적화
- [ ] `components/ui/date-picker.tsx` 생성 (선택적)
  - [ ] DatePicker 컴포넌트 (현재는 Input type="date" 사용 중)
  - [ ] 향후 개선 시 사용

### 7.2 Activity Form PRD 준수 개선 (P0 - 최우선) ✅ **완료**

#### 7.2.1 Drawer (Bottom Sheet) 적용 ✅ **완료**

- [x] `components/activities/activity-drawer.tsx` 생성
  - [x] Sheet 컴포넌트를 `side="bottom"`으로 사용
  - [x] 모바일에서 하단에서 올라오는 형태
  - [x] Handle 바 추가 (드래그 가능)
  - [x] 키보드 올라올 때 UI 깨짐 방지
- [x] `components/activities/activity-form.tsx` 리팩토링
  - [x] Drawer 내부에서 사용 가능하도록 수정
  - [x] 기존 Dialog/Dialog 기반 구조 제거

#### 7.2.2 UI 컴포넌트 교체 ✅ **완료**

- [x] 병원 선택: Select → Combobox
  - [x] 검색 기능 추가
  - [x] 최근 방문 병원 상단 노출
  - [x] `actions/accounts/get-recent-accounts.ts` 생성 (최근 방문 병원 조회)
- [x] 활동 유형: Select → Radio Group (Button 스타일)
  - [x] 방문, 전화, 메시지, PT, 후속관리
  - [x] 한 줄에 배치 (모바일 최적화)
- [x] 품질/양적 점수: Input (Number) → Slider
  - [x] 0-100 범위 슬라이더
  - [x] 기본값 50
  - [x] 현재 값 표시 (예: "품질 점수: 75점")
  - [x] 드래그로 빠른 조정 가능
- [x] 소요 시간: Input 개선
  - [x] Step 버튼 추가 (-10, +10)
  - [x] 빠른 조정 가능

#### 7.2.3 Step UI (2단계) 구현 ✅ **완료**

- [x] Step 1: 기본 정보
  - [x] 병원 선택 (Combobox)
  - [x] 담당자 선택 (Select, 병원 선택 시 자동 필터링)
  - [x] 활동 유형 (Radio Group)
  - [x] 행동 목적 (Select)
- [x] Step 2: 상세 정보
  - [x] 품질 점수 (Slider)
  - [x] 양적 점수 (Slider)
  - [x] 내용 (Textarea, 선택사항)
  - [x] 소요 시간 (Input with Step buttons)
  - [x] 수행 일시 (Input type="datetime-local", 기본값: 현재 시간)
- [x] Step 네비게이션
  - [x] "다음" 버튼 (Step 1 → Step 2)
  - [x] "이전" 버튼 (Step 2 → Step 1)
  - [x] 진행 표시 (1/2, 2/2)

#### 7.2.4 Smart Selection 로직 ✅ **완료**

- [x] 활동 유형별 기본값 자동 설정
  - [x] '방문' 선택 시: `duration_minutes` 기본값 30분
  - [x] '전화' 선택 시: `duration_minutes` 기본값 5분
  - [x] '메시지' 선택 시: `duration_minutes` 기본값 0분
- [x] Context Aware 기본값
  - [x] `performed_at`: 기본값 현재 시간
  - [x] 최근 방문 병원 상단 노출
  - [x] 병원 선택 시 해당 병원의 담당자 목록 자동 로드

#### 7.2.5 Zod 스키마 수정 ✅ **완료**

- [x] `description` 필드를 선택사항으로 변경
  - [x] 현재: 필수 (`min(1)`)
  - [x] 변경: 선택사항 (`.optional()`)
- [x] 검증 규칙 PRD 준수 확인
  - [x] `quality_score`, `quantity_score`: `.min(0).max(100)` ✅
  - [x] `duration_minutes`: `.min(0)` ✅
  - [x] `type`: ENUM 값 일치 확인 ✅

### 7.3 Toast 알림 시스템 구현 ✅ **완료**

#### 7.3.1 Toaster 설정 ✅ **완료**

- [x] `app/layout.tsx`에 Toaster 추가
  - [x] `components/ui/sonner.tsx` import
  - [x] `<Toaster />` 컴포넌트 추가
- [x] Toast 스타일 커스터마이징
  - [x] 한국어 메시지
  - [x] 모바일 최적화 (하단 표시, position="bottom-center")

#### 7.3.2 Activity Form에 Toast 적용 ✅ **완료**

- [x] 저장 성공 시
  - [x] `toast.success("활동이 기록되었습니다")`
  - [x] 폼 리셋 (`form.reset()`)
  - [x] Drawer 닫기
- [x] 저장 실패 시
  - [x] `toast.error("저장에 실패했습니다")`
  - [x] 에러 메시지 상세 표시
- [x] 네트워크 오류 시
  - [x] `toast.error("네트워크 오류가 발생했습니다")`
  - [ ] 로컬 스토리지 임시 저장 고려 (향후)

### 7.4 Prescription Form 개선 (P1) ✅ **완료**

#### 7.4.1 제품명 입력 개선 ✅ **완료**

- [x] 제품명: Input → Select/Combobox
  - [x] 미리 정의된 제품 목록 사용
  - [x] `constants/products.ts` 생성 (제품 목록 상수)
  - [x] 검색 가능한 Combobox로 구현
- [ ] 자동 계산 기능 (선택적)
  - [ ] 수량 × 단가 = 총액 계산
  - [ ] 실시간 업데이트

#### 7.4.2 관련 활동 선택 개선 ✅ **완료**

- [x] 최근 30일 활동 필터링
  - [x] `actions/activities/get-recent-activities.ts` 생성
  - [x] `account_id` 기준 최근 30일 활동만 조회
  - [x] 날짜 + 설명 미리보기
- [x] Combobox로 변경 (현재 Select)
  - [x] 검색 가능
  - [x] 활동 설명 미리보기

### 7.5 경쟁사 신호 수동 입력 폼 (P2) ✅ **완료**

#### 7.5.1 경쟁사 신호 입력 폼 생성 ✅ **완료**

- [x] `components/competitor/competitor-signal-form.tsx` 생성
  - [x] 대상 병원 (Combobox, 필수)
  - [x] 경쟁사명 (Input, 필수)
  - [x] 신호 유형 (Select, 필수)
    - [x] 언급, 가격문의, 선호도변화 등
  - [x] 상세 내용 (Textarea, 필수)
- [x] `constants/competitor-signal-types.ts` 생성
  - [x] 신호 유형 상수 정의
  - [x] 라벨 매핑

#### 7.5.2 경쟁사 신호 Server Action ✅ **완료**

- [x] `actions/competitor-signals/create-competitor-signal.ts` 생성
  - [x] 수동 입력 경쟁사 신호 저장
  - [x] 자동 감지와 구분 (수동 입력 플래그)
- [ ] `actions/competitor-signals/get-competitor-signals.ts` 수정
  - [ ] 수동 입력 신호도 포함 (기존 함수가 이미 모든 신호를 조회하므로 수정 불필요)

#### 7.5.3 경쟁사 신호 입력 UI ✅ **완료**

- [ ] `app/(dashboard)/competitor-signals/page.tsx` 생성 (선택적)
  - [ ] 경쟁사 신호 목록
  - [ ] 수동 입력 버튼
- [x] Drawer 형태로 입력 폼 표시
  - [x] 빠른 입력 가능
  - [x] 모바일 최적화 (폼 컴포넌트 완료, Drawer 통합은 선택적)

### 7.6 모바일 최적화 ✅ **완료**

#### 7.6.1 입력 폼 모바일 UX 개선 ✅ **완료**

- [x] 키보드 올라올 때 UI 깨짐 방지
  - [x] Drawer 높이 조정 (h-[90vh] max-h-[90vh])
  - [x] 스크롤 가능하도록 설정 (overflow-y-auto)
  - [x] pb-safe 클래스 추가
- [x] 터치 인터랙션 최적화
  - [x] 버튼 크기 최소 44px × 44px (min-h-[44px] min-w-[44px])
  - [x] Slider 터치 영역 확대 (touch-manipulation, px-2)
- [x] 한 손 조작 최적화
  - [x] 주요 버튼 하단 배치
  - [x] 저장 버튼 하단 고정 (pb-safe)

#### 7.6.2 반응형 디자인 ✅ **완료**

- [x] 데스크탑: Dialog 유지 (선택적) - 기존 Dialog는 제거하고 Drawer로 통일
- [x] 모바일: Drawer (Bottom Sheet) 필수
- [x] 화면 크기별 분기 처리
  - [x] Drawer를 기본으로 사용 (모든 화면에서 일관된 UX)

### 7.7 Optimistic UI 구현 ✅ **완료**

#### 7.7.1 Activity 생성 Optimistic Update ✅ **완료**

- [x] Activity 목록에 즉시 추가
  - [x] 서버 응답 전 UI 업데이트 (임시 Activity 생성)
  - [x] 실패 시 롤백 (임시 항목 제거, Drawer 다시 열기)
- [ ] 대시보드 데이터 즉시 반영
  - [ ] 캐시 무효화 대신 Optimistic Update
  - [ ] 또는 캐시 무효화 + 즉시 재조회 (향후 구현)

#### 7.7.2 로딩 상태 개선 ✅ **완료**

- [x] 버튼 로딩 상태
  - [x] `isSubmitting` 상태 표시
  - [x] "저장 중..." 텍스트
  - [x] 버튼 비활성화
- [ ] Skeleton UI (선택적)
  - [ ] 목록 업데이트 시 Skeleton 표시 (향후 구현)

### 7.8 테스트 및 검증

#### 7.8.1 모바일 테스트

- [ ] 실제 모바일 기기에서 테스트
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] 입력 플로우 테스트
  - [ ] Activity 입력 30초 이내 완료 가능한지 확인
  - [ ] 한 손 조작 가능한지 확인
  - [ ] 키보드 올라올 때 UI 깨짐 없는지 확인

#### 7.8.2 사용성 테스트

- [ ] 실제 영업사원 대상 테스트 (파이롯)
- [ ] 피드백 수집
- [ ] 개선 사항 반영

### 7.9 문서화

#### 7.9.1 사용자 가이드

- [ ] Activity 입력 가이드 작성
  - [ ] Step별 설명
  - [ ] 각 필드 설명
  - [ ] 팁 및 트릭
- [ ] 모바일 사용 가이드
  - [ ] 빠른 입력 방법
  - [ ] 단축키/제스처 (있는 경우)

#### 7.9.2 개발자 문서

- [ ] 새로운 컴포넌트 사용법
  - [ ] Combobox 사용 예시
  - [ ] Drawer 사용 예시
  - [ ] Toast 사용 예시
- [ ] PRD 준수 체크리스트
  - [ ] 각 폼이 PRD 요구사항 충족하는지 확인

---

## 📝 참고사항

### 기술 스택

- **Next.js 15.5.6** + **React 19**
- **Supabase** (PostgreSQL, RLS, Edge Functions)
- **Clerk** (Auth)
- **shadcn/ui** + **Tailwind CSS v4**
- **Recharts** (차트)

### 중요 제약사항

- ✅ **음성 기능 제외**: PRD에서 명시적으로 제외
- ✅ **모바일 우선**: 80-90% 기능은 모바일에서 해결
- ✅ **RLS 개발 중 비활성화**: 프로덕션 전환 시 활성화 필요

### 데이터 모델 핵심

- **Behavior Layer**: 8개 지표 (Approach, Contact, Visit, Presentation, Question, Need Creation, Demonstration, Follow-up)
- **Outcome Layer**: 4개 지표 (HIR, 전환률, 필드 성장률, 처방 기반 성과지수)

### 다음 단계

각 스프린트 완료 후 다음 스프린트로 진행하며, 필요시 이전 스프린트로 돌아가 수정/보완합니다.

### 스프린트 7 관련 참고 문서

- **PRD 문서**: `docs/product/input-prd.md`
  - 사용자 입력 시스템 상세 요구사항
  - UI/UX 가이드라인
  - 기술 구현 명세
- **현재 구현 상태**: 스프린트 2에서 기본 Activity Form 구현 완료
- **개선 목표**: PRD 요구사항 100% 준수
  - Mobile First 원칙
  - 30초 이내 입력 완료
  - Context Aware 자동 입력
  - Immediate Feedback (Optimistic UI)
