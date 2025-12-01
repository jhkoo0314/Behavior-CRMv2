

---

# 📘 **Behavior-Driven CRM v2.1 — PRD (고도화 버전)**

*음성 기능 완전 제외*

---

# 1. 제품 개요 (Product Overview)

## 1.1 제품 정의

Behavior-Driven CRM v2.1은
**영업사원이 실제로 일하는 '행동 데이터(Behavior)'를 중심으로 성과를 분석하는 CRM 시스템**입니다.
즉, 단순히 “영업을 얼마나 했는지”가 아니라,
“어떤 행동을 했기 때문에 성과가 생겼는지”를 알려주는 CRM입니다.

쉽게 말하면:

> “많이 뛰었다”가 아니라
> “어떻게 뛰었기 때문에 점수를 땄는지”를 알려주는 축구 코치 같은 CRM.

---

# 2. 목표 및 문제 정의

## 2.1 해결하려는 문제

기존 CRM들은 아래처럼 문제를 가지고 있습니다:

| 기존 CRM 문제     | 설명                          |
| ------------- | --------------------------- |
| 입력만 많다        | 영업사원이 매번 기록해야 하며, 작성 부담이 크다 |
| 행동의 질을 모른다    | 어떤 행동이 성과를 만든 건지 알 수 없다     |
| 성과 데이터만 본다    | "결과"만 보고, 무엇이 원인인지 알 수 없다   |
| 관리자가 판단하기 어렵다 | 주관적인 판단이 많아 공정성과 효율성이 떨어짐   |

---

## 2.2 Behavior-Driven CRM v2.1 목표

| 목표                | 설명                        |
| ----------------- | ------------------------- |
| 행동 자체를 자동 수집/분석   | 행동 패턴 기반 CRM 구축           |
| 행동 품질 = 성과 품질로 연결 | 명확한 상관관계 제공               |
| 영업 성장 맵 제공        | “어떻게 하면 잘할 수 있는지”를 알려줌    |
| 성과 예측 기능 기반 구축    | 행동 기반으로 미래 성과를 예측하는 모델 준비 |

---

# 3. 핵심 개념: Behavior Layer → Outcome Layer

CRM은 총 2개의 Layer로 구성됩니다.

## 3.1 Behavior Layer(행동 레이어)

영업사원이 실제로 하는 행동을 데이터로 측정합니다.

### Behavior Layer 지표 (필수 8개)

1. **접근(Approach)**
2. **컨택(Contact)**
3. **대면(Visit)**
4. **프레젠테이션(Presentation)**
5. **질문/탐색(Actionable Questions)**
6. **필요성 자극(Need Creation)**
7. **시연/자료제공(Demonstration)**
8. **후속관리(Follow-up)**

각 행동은
“양(Quantity)” + “질(Quality)”로 동시에 측정합니다.

---

## 3.2 Outcome Layer(성과 레이어)

Behavior Layer가 모여 만들어내는 최종 성과입니다.

### Outcome Layer 핵심 4대 지표

1. **HIR (High-Impact Rate)**
2. **전환률(Conversion Rate)**
3. **필드 성장률(Field Growth Rate)**
4. **처방 기반 성과지수(Prescription Outcome Index)**

Outcome Layer는 결과지만,
그 결과가 **어떤 행동 때문에 생겼는지를 연결해주는 알고리즘**이 핵심입니다.

---

# 4. 기능 요구사항 (Functional Requirements)

---

# 4.1 메인 대시보드 (Behavior-Outcome 통합)

🎯 목표:
한 눈에 **현재 나의 행동 품질 + 성과 수준**을 이해하게 한다.

## 구성 요소 상세

### 1) Behavior Quality Score (행동품질 점수)

* 최근 7일 또는 30일 기준
* 행동 8개 항목 각각 점수화
* 시각화: **RadarChart**

### 2) Outcome Layer 핵심지표 4개

* HIR
* 전환률
* 성장률
* 처방 기반 성과지수
* 시각화: **Stat Cards + Trend Sparkline**

### 3) Behavior-Outcome 관계 지도

* 어떤 행동이 성과에 가장 큰 영향을 미치는지 시각화
* 시각화: **Chord Diagram 또는 Weighted Tree Map**

---

# 4.2 분석 페이지 (Analysis Dashboard)

이 페이지는 “왜 이런 성과가 나왔는지?”를 설명해줍니다.

## 포함되는 차트

### 1) HIR ↔ 성장률 상관도 (ScatterChart)

* X축: 행동 품질의 평균지표(HIR)
* Y축: 필드 성장률
* 버블 크기: 전체 활동량
* 목적:
  어떤 영업사원이 “적게 일해도 성과를 잘 내는지” 또는 “많이 일하는데 성과가 낮은지” 등 생산성 패턴 파악

---

### 2) 고객 세분화 및 HIR 비교 (PieChart + BarChart)

* PieChart: 고객군 비율 분포
* BarChart: 고객군별 HIR 비교
* 목적:
  어느 고객군에서 행동 품질(HIR)이 높고 낮은지 확인 → 전략 조정

---

### 3) 활동 볼륨 × 품질 Matrix

* 시각화: **Grid Heatmap**
* 목적:
  “많이 하지만 품질 낮음”
  “적게 하지만 품질 높음”
  등 행동 프로파일 분류

---

### 4) 처방 기반 성과 Funnel Chart

* 행동 → 고객 반응 → 처방량 변화 → 성과
* 목적:
  성과가 떨어지는 구간을 명확히 찾기 위함

---

# 4.3 영업사원 개별 성장 맵

### 포함 기능

* 행동 품질 트렌드 (라인 차트)
* Outcome Layer 변화 (HIR, 전환률 등)
* 성장 추천 액션 (AI 기반)

예:
“지난 30일 동안 질문·탐색 행동이 부족해졌습니다.
이 행동은 전환률에 매우 중요하므로 우선 개선이 필요합니다.”

---

# 5. 비기능 요구사항 (Non-functional)

## 5.1 성능 요구사항

* 대시보드 로딩시간 2초 이내
* Supabase RLS로 사용자 단위 데이터 보안 유지
* 모든 차트는 클라이언트 렌더링 기반

---

# 6. 시스템 아키텍처

## 6.1 기술 스택

* **Next.js 15.5.6**
* **React 19**
* **Supabase (PostgreSQL, RLS, Edge Functions)**
* **Clerk (Auth)**
* **shadcn/ui**
* **Tailwind CSS v4 (OKLCH 컬러 포맷 적용)**
* **Recharts (차트)**

---

# 7. 데이터 모델

### Core Tables

1. **users**
2. **activities (행동 데이터)**
3. **outcomes (성과 데이터)**
4. **prescriptions (처방/성과 원천 데이터)**
5. **analytics_cache (계산된 지표 캐싱)**

각 테이블의 컬럼과 관계 정의도 원하시면 바로 이어서 만들어드릴 수 있습니다.

---

# 8. 사용자 플로우 (UX Flow)

## 신규 사용자

대시보드 → 행동 기록 → 자동 분석 → 개인 성장 리포트 생성

## 관리자

팀 전체 대시보드 → 팀 분석 → 개별 프로필 브라우징 → 코칭 가이드 도출

---

# 9. 화면 설계 (UI/UX 구조)

## 페이지 구성

1. **Main Dashboard**
2. **Analysis Dashboard**
3. **Salesperson Growth Map**
4. **Activity Log**
5. **Outcome Report**

각 페이지별 와이어프레임도 요청하시면 **React + shadcn 코드 형태로** 바로 제공합니다.

---

# 10. 개발 스프린트 계획 (예시)

스프린트 1: 초기 스키마 + Auth + 기본 UI
스프린트 2: Behavior Layer 구축
스프린트 3: Outcome Layer 구축
스프린트 4: 분석 대시보드
스프린트 5: Growth Map + AI 추천
스프린트 6: QA 및 파이롯 운영

---


