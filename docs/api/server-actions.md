# Server Actions API 문서

이 문서는 Behavior-Driven CRM의 모든 Server Actions에 대한 API 참조입니다.

## 목차

- [Activities](#activities)
- [Accounts](#accounts)
- [Contacts](#contacts)
- [Behavior Scores](#behavior-scores)
- [Outcomes](#outcomes)
- [Prescriptions](#prescriptions)
- [Coaching Signals](#coaching-signals)
- [Competitor Signals](#competitor-signals)
- [Analytics Cache](#analytics-cache)

---

## Activities

### createActivity

Activity(활동)를 생성합니다.

**위치**: `actions/activities/create-activity.ts`

**파라미터**:
```typescript
interface CreateActivityInput {
  account_id: string;              // 병원 ID (필수)
  contact_id?: string | null;       // 담당자 ID (선택)
  type: ActivityType;              // 활동 타입: 'visit' | 'call' | 'message' | 'presentation' | 'follow_up'
  behavior: BehaviorType;           // 행동 타입: 'approach' | 'contact' | 'visit' | 'presentation' | 'question' | 'need_creation' | 'demonstration' | 'follow_up'
  description: string;              // 설명 (필수, 최대 5000자)
  quality_score: number;            // 품질 점수 (0-100)
  quantity_score: number;           // 양 점수 (0-100)
  duration_minutes?: number;        // 상담 시간 (분, 선택)
  performed_at?: Date | string;     // 수행 일시 (선택, 기본값: 현재 시간)
}
```

**반환값**: `Promise<Activity>`

**에러**:
- `Unauthorized`: 인증되지 않은 사용자
- `User not found`: 사용자를 찾을 수 없음
- `Invalid account_id`: 잘못된 account_id
- `Invalid activity type`: 잘못된 활동 타입
- `Invalid behavior type`: 잘못된 행동 타입
- `Description is required`: 설명이 없음
- `Description is too long`: 설명이 5000자 초과
- `Quality score must be between 0 and 100`: 품질 점수 범위 오류
- `Quantity score must be between 0 and 100`: 양 점수 범위 오류

**예시**:
```typescript
import { createActivity } from '@/actions/activities/create-activity';

const activity = await createActivity({
  account_id: 'account-uuid',
  type: 'visit',
  behavior: 'approach',
  description: '병원 방문 및 초기 접촉',
  quality_score: 80,
  quantity_score: 70,
  duration_minutes: 30,
  performed_at: new Date(),
});
```

**참고사항**:
- Activity 생성 시 자동으로 경쟁사 신호를 감지합니다.
- Activity 생성 시 관련 캐시가 자동으로 무효화됩니다.

---

### getActivities

사용자의 Activity 목록을 조회합니다.

**위치**: `actions/activities/get-activities.ts`

**파라미터**:
```typescript
interface GetActivitiesInput {
  startDate?: Date | string;    // 시작일 (선택)
  endDate?: Date | string;      // 종료일 (선택)
  accountId?: string;           // 병원 ID 필터 (선택)
  type?: ActivityType;          // 활동 타입 필터 (선택)
  limit?: number;               // 페이지 크기 (기본값: 50)
  offset?: number;              // 페이지 오프셋 (기본값: 0)
}
```

**반환값**: `Promise<Activity[]>`

---

### updateActivity

Activity를 수정합니다.

**위치**: `actions/activities/update-activity.ts`

**파라미터**:
```typescript
interface UpdateActivityInput {
  id: string;                   // Activity ID (필수)
  // createActivity와 동일한 필드들 (모두 선택)
}
```

**반환값**: `Promise<Activity>`

**에러**:
- `Unauthorized`: 인증되지 않은 사용자
- `Activity not found`: Activity를 찾을 수 없음
- `Permission denied`: 본인의 Activity만 수정 가능

---

### deleteActivity

Activity를 삭제합니다.

**위치**: `actions/activities/delete-activity.ts`

**파라미터**:
```typescript
interface DeleteActivityInput {
  id: string;                   // Activity ID (필수)
}
```

**반환값**: `Promise<void>`

---

## Accounts

### createAccount

병원(Account)을 생성합니다.

**위치**: `actions/accounts/create-account.ts`

**파라미터**:
```typescript
interface CreateAccountInput {
  name: string;                 // 병원명 (필수, 최대 200자)
  address?: string;             // 주소 (선택, 최대 500자)
  phone?: string;               // 전화번호 (선택, 최대 20자, 숫자와 하이픈만)
  type: 'general_hospital' | 'hospital' | 'clinic' | 'pharmacy';  // 병원 타입 (필수)
  specialty?: string;           // 진료과 (선택, 최대 100자)
  patient_count?: number;       // 환자 수 (선택, 0-10,000,000)
  revenue?: number;             // 매출 (선택, 0-1,000,000,000,000)
  notes?: string;               // 메모 (선택, 최대 2000자)
}
```

**반환값**: `Promise<Account>`

---

## Behavior Scores

### calculateAndSaveBehaviorScores

Behavior Score를 계산하고 저장합니다.

**위치**: `actions/behavior-scores/calculate-and-save.ts`

**파라미터**:
```typescript
interface CalculateAndSaveInput {
  periodStart: Date | string;   // 기간 시작일 (필수)
  periodEnd: Date | string;     // 기간 종료일 (필수)
}
```

**반환값**: `Promise<BehaviorScoreResult[]>`

**참고사항**:
- 8개 Behavior 타입별로 점수를 계산합니다.
- 기존 데이터는 자동으로 삭제되고 새 데이터로 교체됩니다.

---

## Outcomes

### calculateAndSaveOutcome

Outcome를 계산하고 저장합니다.

**위치**: `actions/outcomes/calculate-and-save.ts`

**파라미터**:
```typescript
interface CalculateAndSaveOutcomeInput {
  periodStart: Date | string;    // 기간 시작일 (필수)
  periodEnd: Date | string;      // 기간 종료일 (필수)
  periodType: PeriodType;        // 기간 타입: 'daily' | 'weekly' | 'monthly'
  accountId?: string;            // 병원 ID (선택)
}
```

**반환값**: `Promise<Outcome>`

**참고사항**:
- HIR, 전환률, 필드 성장률, 처방 기반 성과지수를 모두 계산합니다.
- Outcome 계산 시 관련 캐시가 자동으로 무효화됩니다.

---

## Analytics Cache

### getCachedAnalytics

캐시된 분석 데이터를 조회합니다.

**위치**: `actions/analytics-cache/get-cached-analytics.ts`

**파라미터**:
```typescript
interface GetCachedAnalyticsInput {
  cacheKey: string;              // 캐시 키 (필수)
}
```

**반환값**: `Promise<AnalyticsCache | null>`

**참고사항**:
- 만료된 캐시는 자동으로 삭제되고 null을 반환합니다.

---

### saveCachedAnalytics

분석 데이터를 캐싱합니다.

**위치**: `actions/analytics-cache/save-cached-analytics.ts`

**파라미터**:
```typescript
interface SaveCachedAnalyticsInput {
  cacheKey: string;              // 캐시 키 (필수)
  data: Record<string, unknown>; // 캐시 데이터 (필수)
  periodStart?: Date | string;   // 기간 시작일 (선택)
  periodEnd?: Date | string;     // 기간 종료일 (선택)
  ttlHours?: number;             // TTL (시간, 선택, 기본값: 캐시 타입에 따라 자동 설정)
}
```

**반환값**: `Promise<AnalyticsCache>`

**TTL 기본값**:
- 실시간 데이터 (`realtime`, `dashboard`): 5분
- 일별 집계 (`daily`, `day`): 1시간
- 주별/월별 집계 (`weekly`, `monthly`): 24시간
- 기타: 1시간

---

## 에러 처리

모든 Server Actions는 다음과 같은 공통 에러를 발생시킬 수 있습니다:

- `Unauthorized`: 인증되지 않은 사용자
- `User not found`: 사용자를 찾을 수 없음
- `Permission denied`: 권한이 없음

에러는 `Error` 객체로 throw되며, 클라이언트에서 try-catch로 처리해야 합니다.

---

## 로깅

모든 Server Actions는 구조화된 로깅을 사용합니다:
- 실행 시작/종료 로그
- 실행 시간 측정
- 에러 발생 시 상세 로그

개발 환경에서는 콘솔에 상세한 로그가 출력됩니다.

