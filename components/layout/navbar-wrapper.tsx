/**
 * Navbar 래퍼 컴포넌트
 * 
 * Navbar는 이제 클라이언트 컴포넌트이므로 직접 import 가능
 * 경로 확인은 Navbar 내부에서 처리
 * 시연 모드일 때는 Clerk 없이도 동작하도록 처리
 */

'use client';

import Navbar from '@/components/Navbar';

export function NavbarWrapper() {
  // 시연 모드일 때는 Navbar를 렌더링하지 않거나 에러 처리
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  
  // 시연 모드일 때는 Navbar를 렌더링하지 않음 (대시보드에서만 사용)
  if (isDemoMode) {
    return null;
  }
  
  return <Navbar />;
}

