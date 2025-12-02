'use client';

/**
 * @file components/Navbar.tsx
 * @description Behavior CRM 헤더 컴포넌트
 *
 * 이 컴포넌트는 모든 페이지 상단에 표시되는 헤더입니다.
 * 주요 기능:
 * 1. 로고 및 플랫폼 설명
 * 2. 사용자 프로필 정보 표시 (인증된 경우)
 *
 * 핵심 구현 로직:
 * - 클라이언트 컴포넌트로 구현하여 경로 확인 및 조건부 렌더링
 * - Clerk useUser 훅으로 사용자 정보 조회
 * - 대시보드 경로에서는 자동으로 숨김
 *
 * @dependencies
 * - @clerk/nextjs: useUser 훅
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 */

import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
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
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const supabase = useClerkSupabaseClient();
  const [department, setDepartment] = useState<string>('영업팀');

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

  // 부서 정보 가져오기
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchDepartment = async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role, team_id')
          .eq('clerk_id', user.id)
          .single();

        if (userData) {
          if (userData.role === 'manager' || userData.role === 'head_manager') {
            setDepartment('관리팀');
          }
        }
      } catch (error) {
        console.error('부서 정보 조회 실패:', error);
      }
    };

    fetchDepartment();
  }, [isLoaded, user, supabase]);

  // 대시보드 경로에서는 렌더링하지 않음
  if (isDashboardRoute) {
    return null;
  }

  const userName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    null;
  const userInitials = getInitials(userName || '사용자');
  const userImageUrl = user?.imageUrl || null;

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

      {/* 사용자 프로필 (인증된 경우에만 표시) */}
      {isLoaded && userName && (
        <UserProfile
          userName={userName}
          userInitials={userInitials}
          userImageUrl={userImageUrl}
          department={department}
        />
      )}
    </header>
  );
}
