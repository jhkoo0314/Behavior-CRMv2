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
 * - Server Component로 구현하여 서버에서 사용자 정보 조회
 * - 인증되지 않은 사용자도 접근 가능 (프로필만 숨김)
 * - Supabase에서 사용자 정보 조회
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증 확인
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/lib/supabase/get-user-id: 사용자 ID 조회
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/get-user-id";
import { UserProfile } from "@/components/UserProfile";

// 사용자 이니셜 생성 함수
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default async function Navbar() {
  // 인증 확인
  const { userId } = await auth();

  let userName: string | null = null;
  let userInitials = "U";
  let userImageUrl: string | null = null;
  let department = "영업팀";

  // 인증된 사용자인 경우에만 사용자 정보 가져오기
  if (userId) {
    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (clerkUser) {
      // 이름 가져오기
      userName =
        clerkUser.fullName ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        null;
      userInitials = getInitials(userName || "사용자");
      
      // 프로필 이미지 가져오기
      userImageUrl = clerkUser.imageUrl || null;

      // 부서 정보는 Supabase에서 가져오기
      const userUuid = await getCurrentUserId();
      if (userUuid) {
        const supabase = await createClerkSupabaseClient();
        const { data: user } = await supabase
          .from("users")
          .select("role, team_id")
          .eq("id", userUuid)
          .single();

        if (user) {
          if (user.role === "manager" || user.role === "head_manager") {
            department = "관리팀";
          }
        }
      }
    }
  }

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
      {userName && (
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
