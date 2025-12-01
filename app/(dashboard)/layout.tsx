/**
 * 대시보드 라우트 그룹 레이아웃
 * 
 * - AppLayout 적용
 * - Clerk 인증 체크 (미인증 시 리다이렉트)
 * - 사용자 동기화 확인
 */

import { auth, redirectToSignIn } from '@clerk/nextjs/server';
import { AppLayout } from '@/components/layout/app-layout';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 확인
  const { userId } = await auth();

  if (!userId) {
    redirectToSignIn();
    return null;
  }

  // 사용자 동기화 확인
  const supabase = await createClerkSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, clerk_id')
    .eq('clerk_id', userId)
    .single();

  // 사용자가 없으면 동기화 필요 (SyncUserProvider가 처리)
  // 여기서는 레이아웃만 렌더링

  return <AppLayout>{children}</AppLayout>;
}

