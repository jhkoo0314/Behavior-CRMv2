# Scripts

이 디렉토리는 유틸리티 스크립트를 포함합니다.

## generate-sample-data.ts

파이롯 운영을 위한 샘플 데이터를 생성하는 스크립트입니다.

### 사용법

```bash
# 의존성 설치 (dotenv, tsx)
pnpm install

# 스크립트 실행
npx tsx scripts/generate-sample-data.ts
```

### 필요 환경 변수

`.env.local` 파일에 다음 환경 변수가 설정되어 있어야 합니다:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

### 생성되는 데이터

- 샘플 Account (10-15개)
- 샘플 Contact (각 Account당 2-3개)
- 샘플 Activity (최근 90일간, 사용자별 50-100개)
- 샘플 Prescription (최근 30일간)

### 주의사항

- 스크립트는 `users` 테이블의 첫 번째 사용자를 사용합니다.
- 먼저 로그인하여 사용자를 생성한 후 실행해야 합니다.

