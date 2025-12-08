'use client';

/**
 * @file components/Navbar.tsx
 * @description Behavior CRM 헤더 컴포넌트
 *
 * 이 컴포넌트는 모든 페이지 상단에 표시되는 헤더입니다.
 * 주요 기능:
 * 1. 로고 및 플랫폼 설명
 * 2. 사용자 프로필 정보 표시 (Mock 데이터 사용)
 *
 * 핵심 구현 로직:
 * - 클라이언트 컴포넌트로 구현하여 경로 확인 및 조건부 렌더링
 * - 대시보드 경로에서는 자동으로 숨김
 * - 발표용: Mock 사용자 데이터 사용
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserProfile } from '@/components/UserProfile';

// 사용자 이니셜 생성 함수
function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();

  // 대시보드 관련 경로에서는 Navbar 숨김
  const isDashboardRoute =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/accounts') ||
    pathname?.startsWith('/activities') ||
    pathname?.startsWith('/analysis') ||
    pathname?.startsWith('/feedback') ||
    pathname?.startsWith('/growth') ||
    pathname?.startsWith('/manager') ||
    pathname?.startsWith('/outcomes');

  // 대시보드 경로에서는 렌더링하지 않음
  if (isDashboardRoute) {
    return null;
  }

  // Mock 사용자 정보 사용
  const userName = '시연 사용자';
  const userInitials = getInitials(userName);
  const userImageUrl = null;
  const department = '영업팀';

  return (
    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-2">
          Internal Sales Platform
        </div>
        <Link href="/">
          <h1 className="text-4xl lg:text-5xl font-bold text-dark-900 tracking-tight">
            Behavior<span className="text-stone-400">CRM</span>
          </h1>
        </Link>
        <p className="mt-3 text-lg text-stone-600">
          데이터 기반 행동 분석 및 성과 관리 시스템
        </p>
      </div>

      {/* 사용자 프로필 */}
      <UserProfile
        userName={userName}
        userInitials={userInitials}
        userImageUrl={userImageUrl}
        department={department}
      />
    </header>
  );
}
