# Server Actions

이 디렉토리는 Next.js Server Actions를 포함합니다.

## 디렉토리 구조

각 도메인별로 하위 디렉토리를 생성합니다:

- `activities/` - Activity 관련 Server Actions
- `accounts/` - Account 관련 Server Actions
- `contacts/` - Contact 관련 Server Actions
- `behavior-scores/` - Behavior Score 관련 Server Actions
- `outcomes/` - Outcome 관련 Server Actions
- `prescriptions/` - Prescription 관련 Server Actions
- `coaching-signals/` - Coaching Signal 관련 Server Actions
- `competitor-signals/` - Competitor Signal 관련 Server Actions
- `analytics-cache/` - Analytics Cache 관련 Server Actions

## 공통 패턴

모든 Server Action은 다음 패턴을 따릅니다:

1. 인증 확인 (Clerk)
2. 권한 체크 (필요시)
3. Supabase 클라이언트 생성
4. 데이터베이스 작업 수행
5. 에러 처리 및 반환

## 예시

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { checkRole } from '@/lib/auth/check-role';

export async function getActivities() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClerkSupabaseClient();
  
  // users 테이블에서 UUID 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    throw new Error('User not found');
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('performed_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
```

