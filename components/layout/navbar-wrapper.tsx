/**
 * Navbar 래퍼 컴포넌트
 * 
 * Navbar는 이제 클라이언트 컴포넌트이므로 직접 import 가능
 * 경로 확인은 Navbar 내부에서 처리
 */

import Navbar from '@/components/Navbar';

export function NavbarWrapper() {
  return <Navbar />;
}

