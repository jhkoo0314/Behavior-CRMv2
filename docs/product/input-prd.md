기존의 **분석/대시보드 중심 PRD**와 **SQL 스키마**를 기반으로, 영업사원이 데이터를 입력하는 **"입력 시스템(Input System)"** 구축을 위한 상세 PRD입니다.

이 문서는 **"최소한의 터치로 최대한의 데이터를 남긴다"**는 UX 철학을 바탕으로 작성되었습니다.

---

# 📝 **Behavior-Driven CRM - User Input PRD**

## 1. 개요 (Overview)

### 1.1 목적
영업사원이 현장(Field)에서 **행동(Activity), 성과(Outcome), 고객(Account), 경쟁사 정보(Signal)**를 즉시 기록할 수 있는 입력 인터페이스를 구축한다.

### 1.2 핵심 UX 원칙
1.  **Mobile First**: 이동 중(차 안, 도보) 한 손 조작이 가능해야 한다.
2.  **Speed**: 하나의 기록을 남기는 데 **30초**를 넘기지 않는다.
3.  **Context Aware**: 날짜, 담당자 등 추론 가능한 정보는 자동 입력(Default)한다.
4.  **Immediate Feedback**: 입력 즉시 대시보드에 반영되는 듯한 경험(Optimistic UI)을 제공한다.

---

## 2. 필수 구현 기능 목록 (Feature List)

| 우선순위 | 기능명 | 연결 테이블 | 설명 |
| :-- | :--- | :--- | :--- |
| **P0** | **활동 기록 (Activity Log)** | `activities` | 방문, 전화 등 영업 활동 기록 (가장 빈번함) |
| **P1** | **성과 입력 (Log Outcome)** | `prescriptions` | 처방 및 매출 실적 등록 (매출 발생 시) |
| **P1** | **병원/담당자 등록** | `accounts`, `contacts` | 신규 거래처 및 의사 정보 등록 |
| **P2** | **경쟁사 신호 제보** | `competitor_signals` | 경쟁사 동향 파악 시 간편 입력 |

---

## 3. 상세 요구사항 (Functional Specs)

### 3.1 활동 기록 (Log Activity) - ⭐️ 핵심

영업사원이 가장 많이 사용할 기능입니다. **Shadcn Drawer(Bottom Sheet)** 형태를 권장합니다.

#### 3.1.1 입력 필드 명세
| 라벨 | UI 컴포넌트 | SQL 매핑 | 로직/제약조건 |
| :--- | :--- | :--- | :--- |
| **대상 병원** | `Combobox` (Search) | `account_id` | 필수. 병원명 검색. 최근 방문 병원 상단 노출. |
| **담당자** | `Select` / `Chips` | `contact_id` | 선택. 병원 선택 시 해당 병원 소속 의사만 필터링. |
| **활동 유형** | `Radio Group` (Button형) | `type` | 필수. (방문, 전화, 메시지, PT, 후속관리) 아이콘 활용 추천. |
| **행동 목적** | `Select` | `behavior` | 필수. 8대 지표 선택. |
| **내용** | `Textarea` | `description` | 선택. |
| **품질 점수** | `Slider` | `quality_score` | 0~100점. 기본값 50. 슬라이더로 드래그. |
| **양적 점수** | `Slider` | `quantity_score` | 0~100점. 기본값 50. |
| **소요 시간** | `Input` (Number) | `duration_minutes` | 분 단위. `Step` 버튼(-10, +10) 제공. |
| **수행 일시** | `DatePicker` | `performed_at` | 기본값: `NOW()` (현재 시간). 수정 가능. |

#### 3.1.2 UI/UX 가이드
*   **Step UI**: 한 화면에 입력이 많으면 부담스러우므로 2단계로 분리 가능.
    *   1단계: 누구를 만나서 무엇(Type/Behavior)을 했나?
    *   2단계: 점수(Score)와 내용(Description) 입력.
*   **Smart Selection**: '방문' 선택 시 소요시간 기본값 30분, '전화' 선택 시 5분 자동 세팅.

---

### 3.2 성과 입력 (Log Outcome/Prescription)

매출이나 처방 실적을 입력합니다. **이 성과가 어떤 활동 덕분인지 연결**하는 것이 핵심입니다.

#### 3.2.1 입력 필드 명세
| 라벨 | UI 컴포넌트 | SQL 매핑 | 로직/제약조건 |
| :--- | :--- | :--- | :--- |
| **대상 병원** | `Combobox` | `account_id` | 필수. |
| **제품명** | `Select` / `Combobox` | `product_name` | 필수. 미리 정의된 제품 목록 사용 권장. |
| **수량** | `Input` (Number) | `quantity` | 필수. |
| **단위** | `Select` | `quantity_unit` | Box, Bottle 등 (기본값: Box). |
| **금액(단가)** | `Input` (Number) | `price` | 선택. 자동 계산 기능 있으면 좋음. |
| **날짜** | `DatePicker` | `prescription_date` | 필수. |
| **결정적 활동** | `Combobox` (Async) | `related_activity_id` | **중요.** 해당 병원의 최근 30일 활동 리스트를 불러와 선택하게 함. (없음 선택 가능) |

---

### 3.3 병원 및 담당자 등록 (Create Account & Contact)

신규 거래처를 등록합니다.

#### 3.3.1 병원 정보 (Account)
| 라벨 | UI 컴포넌트 | SQL 매핑 | 로직 |
| :--- | :--- | :--- | :--- |
| **병원명** | `Input` | `name` | 필수. |
| **유형** | `Select` | `type` | 종합병원/의원/약국 등. |
| **전화번호** | `Input` | `phone` | 하이픈 자동 포맷팅. |
| **주소** | `Input` | `address` | 도로명 주소 검색 API 연동 권장. |
| **매출규모** | `Input` | `revenue` | 숫자만 입력. |

#### 3.3.2 담당자 정보 (Contact) - 병원 등록 후 이어서 등록
| 라벨 | UI 컴포넌트 | SQL 매핑 | 로직 |
| :--- | :--- | :--- | :--- |
| **이름** | `Input` | `name` | 필수. |
| **역할** | `Input` | `role` | 원장, 실장, 페이닥터 등. |
| **연락처** | `Input` | `phone` | |

---

### 3.4 경쟁사 신호 제보 (Competitor Signal)

현장에서 경쟁사 정보를 빠르게 제보합니다.

#### 3.4.1 입력 필드 명세
| 라벨 | UI 컴포넌트 | SQL 매핑 | 로직 |
| :--- | :--- | :--- | :--- |
| **대상 병원** | `Combobox` | `account_id` | 필수. |
| **경쟁사명** | `Input` | `competitor_name` | 필수. |
| **신호 유형** | `Select` | `type` | 언급, 가격문의, 선호도변화 등. |
| **상세 내용** | `Textarea` | `description` | 구체적인 상황 묘사. |

---

## 4. 기술 구현 명세 (Technical Specs)

### 4.1 폼 관리 및 유효성 검사
*   **Library**: `react-hook-form` + `zod`
*   **Validation Rules (Zod Schema)**:
    *   `quality_score`, `quantity_score`: `.min(0).max(100)`
    *   `duration_minutes`: `.min(0)`
    *   `name`: `.min(1, "필수 입력 항목입니다")`
    *   `type`: SQL ENUM(또는 Check Constraint) 값과 일치해야 함.

### 4.2 UI 라이브러리 조합 (Shadcn + Tailwind v4)
*   **Drawer (Bottom Sheet)**: 모바일에서의 입력 폼은 `Dialog` 대신 `Drawer`를 사용하여 하단에서 올라오게 구현 (한 손 조작 용이).
*   **Form**: `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` 컴포넌트 사용.
*   **Popover + Command**: 병원 검색(`Combobox`) 구현 시 사용.
*   **Toast**: 저장 성공/실패 시 피드백 (`sonner` 추천).

### 4.3 데이터 처리 흐름
1.  **Client**: 폼 제출 (`onSubmit`)
2.  **Validation**: Zod 스키마 검증
3.  **Supabase Client**: `supabase.from('table').insert(data)` 호출
4.  **Error Handling**:
    *   네트워크 오류 시: `toast.error("저장에 실패했습니다")` 및 로컬 스토리지 임시 저장 고려.
    *   유효성 오류 시: 해당 필드 아래 붉은색 텍스트 노출.
5.  **Success**:
    *   폼 리셋 (`form.reset()`)
    *   `toast.success("기록되었습니다")`
    *   관련 쿼리 키 무효화 (`queryClient.invalidateQueries`) → 대시보드 데이터 갱신.

---

## 5. 화면 와이어프레임 구조 (예시)

### [화면: 활동 기록 (Activity Drawer)]

```text
+-----------------------------------+
|  [Handle]                         |
|  활동 기록하기                     |
|                                   |
|  [ 병원 검색 (Combobox)        ]  | <- 계정 선택
|  [ 담당자 선택 (Select)        ]  | <- 자동 필터링
|                                   |
|  활동 유형                        |
|  (O)방문  ( )전화  ( )메시지       | <- Radio Group (Button Style)
|                                   |
|  행동 지표                        |
|  [ ▼ 필요성 자극 (Need Creation) ] | <- Select
|                                   |
|  품질 점수: 75점                   |
|  [-------O-----------------]      | <- Slider
|                                   |
|  내용                             |
|  [ 텍스트 입력 영역             ]  |
|                                   |
|  [     저장하기 (Button)      ]   |
+-----------------------------------+
```

---

## 6. 개발 체크리스트

1.  [ ] `zod` 스키마 정의 (`schemas/activity.ts` 등)
2.  [ ] 공통 컴포넌트 확인 (`Combobox`, `DatePicker`, `Drawer`)
3.  [ ] `useForm` 훅 세팅 및 `defaultValues` 설정
4.  [ ] Supabase Insert 로직 작성 (`actions/activity.ts` 또는 API Route)
5.  [ ] 모바일 뷰포트에서 키보드가 올라올 때 UI 깨짐 확인
6.  [ ] 로딩 상태(`isSubmitting`) 처리 및 버튼 비활성화