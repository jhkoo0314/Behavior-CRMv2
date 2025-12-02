/**
 * @file app/page.tsx
 * @description Behavior CRM 랜딩 페이지 (게이트웨이)
 *
 * 이 페이지는 사용자가 로그인 후 처음 보는 메인 게이트웨이 페이지입니다.
 * 주요 기능:
 * 1. 시스템 상태 표시
 * 2. 사용자 프로필 정보 표시
 * 3. 활동 기록 및 대시보드 접근 링크
 * 4. HIR 지수 및 성과 표시
 * 5. 빠른 링크 (고객 관리, 성과 리포트 등)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현하여 서버에서 사용자 정보 및 HIR 지수 계산
 * - Clerk 인증 확인 (미인증 시 리다이렉트)
 * - Supabase에서 사용자 정보 조회
 * - calculateHIR 함수로 최근 30일 HIR 지수 계산
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증 확인
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/lib/analytics/calculate-hir: HIR 계산
 * - next/link: 라우팅
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/get-user-id";
import { calculateHIR } from "@/lib/analytics/calculate-hir";
import Image from "next/image";

// SVG 차트 컴포넌트
function ChartGraphic() {
  return (
    <svg
      viewBox="0 0 200 100"
      className="w-full h-full drop-shadow-md"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#10b981", stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>
      {/* Green Line */}
      <path
        d="M0,80 C50,80 50,40 100,40 C150,40 150,10 200,10"
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        className="chart-line"
      />
      {/* Area Fill */}
      <path
        d="M0,80 C50,80 50,40 100,40 C150,40 150,10 200,10 V100 H0 Z"
        fill="url(#gradient)"
        opacity="0.1"
      />
    </svg>
  );
}

// 사용자 이니셜 생성 함수
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default async function Home() {
  // 인증 확인
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Clerk에서 사용자 정보 가져오기
  let clerkUser;
  try {
    const client = await clerkClient();
    clerkUser = await client.users.getUser(userId);
  } catch (error) {
    console.error('Clerk 사용자 정보 조회 실패:', error);
    // Clerk 조회 실패 시 로그아웃 처리
    redirect("/sign-in");
  }

  let userName = "사용자";
  let userInitials = "U";
  let userImageUrl: string | null = null;
  let department = "영업팀";

  if (clerkUser) {
    // 이름 가져오기
    userName =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "사용자";
    userInitials = getInitials(userName);

    // 프로필 이미지 가져오기
    userImageUrl = clerkUser.imageUrl || null;

    // 부서 정보는 Clerk 메타데이터나 Supabase에서 가져오기
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

  // HIR 지수 계산 (최근 30일)
  let hirScore = 0;
  let hirChange = 0;
  let goalAchievement = 82;

  try {
    const userUuid = await getCurrentUserId();
    
    if (userUuid) {
      try {
        const periodEnd = new Date();
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - 30);

        hirScore = await calculateHIR(userUuid, periodStart, periodEnd);

        // 이전 기간과 비교 (간단히 더미 데이터 사용)
        // 실제로는 이전 기간의 HIR을 계산하여 비교해야 함
        hirChange = 12.5; // 더미 데이터

        // Goal Achievement는 HIR 기반으로 계산 (간단한 예시)
        goalAchievement = Math.min(100, Math.round((hirScore / 100) * 100));
      } catch (error) {
        console.error("HIR 계산 실패:", error);
        // 에러 발생 시 기본값 사용
      }
    }
  } catch (error) {
    console.error("사용자 ID 조회 실패:", error);
    // 사용자 ID 조회 실패 시 기본값 사용 (로그아웃 상태일 수 있음)
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased">
      {/* System Status Bar */}
      <div className="bg-dark-900 text-stone-400 text-xs py-1.5 px-6 flex justify-between items-center border-b border-stone-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            System Operational
          </span>
          <span className="text-stone-600">|</span>
          <span>Version 2.1.0 (Stable)</span>
        </div>
        <div className="font-mono opacity-80">SECURE CONNECTION</div>
      </div>

      {/* Main Layout */}
      <div className="min-h-[calc(100vh-32px)] flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 lg:py-0">
        {/* Dashboard Grid (Gateway) */}
        <main className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 1. Main Action Card (Left, Large) */}
          <div className="md:col-span-7 lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/50 p-8 flex flex-col justify-between relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-stone-50 rounded-bl-full z-0 transition-transform group-hover:scale-110"></div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-dark-900 mb-2">
                오늘의 영업 활동을 기록하세요
              </h2>
              <p className="text-stone-500 mb-8 max-w-md">
                필드에서의 모든 행동이 데이터 자산이 됩니다. <br />
                방문, 통화, 제안 등 핵심 행동 지표(KPI)를 지금 입력하세요.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/activities"
                  className="inline-flex items-center px-6 py-3.5 bg-dark-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 transition shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5 duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  활동 기록하기
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3.5 bg-white text-dark-900 border border-stone-300 text-sm font-semibold rounded-lg hover:bg-stone-50 transition"
                >
                  대시보드 입장
                </Link>
              </div>
            </div>

            {/* Abstract Financial Chart Graphic */}
            <div className="absolute bottom-6 right-8 w-48 h-24 hidden sm:block">
              <ChartGraphic />
            </div>
          </div>

          {/* 2. Insight Card (Right, Top) */}
          <div className="md:col-span-5 lg:col-span-4 bg-dark-900 text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <div className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-1">
                My Performance
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold">HIR 지수</h3>
                {hirChange > 0 && (
                  <span className="text-brand-500 font-bold text-lg">
                    ▲ {hirChange.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Goal Achievement</span>
                <span className="font-mono">{goalAchievement}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${goalAchievement}%` }}
                ></div>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                {hirScore > 0
                  ? "지난달 대비 행동 품질이 개선되었습니다."
                  : "데이터가 부족합니다. 활동을 기록해보세요."}
              </p>
            </div>
          </div>

          {/* 3. Notice / Quick Link (Bottom Full) */}
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Feature Link 1 */}
            <Link
              href="/accounts"
              className="group bg-white p-5 rounded-xl border border-stone-200 hover:border-brand-500 hover:ring-1 hover:ring-brand-500 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-stone-400 group-hover:text-brand-600">
                  바로가기
                </span>
              </div>
              <h4 className="font-bold text-dark-900">고객(Account) 관리</h4>
              <p className="text-xs text-stone-500 mt-1">
                병원 및 담당자 정보 업데이트
              </p>
            </Link>

            {/* Feature Link 2 */}
            <Link
              href="/outcomes"
              className="group bg-white p-5 rounded-xl border border-stone-200 hover:border-brand-500 hover:ring-1 hover:ring-brand-500 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-stone-400 group-hover:text-brand-600">
                  바로가기
                </span>
              </div>
              <h4 className="font-bold text-dark-900">성과 리포트</h4>
              <p className="text-xs text-stone-500 mt-1">
                월간 리포트 및 AI 코칭 확인
              </p>
            </Link>

            {/* System Notice */}
            <div className="bg-stone-100 p-5 rounded-xl border border-stone-200 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-dark-900 text-white">
                  공지
                </span>
                <span className="text-xs text-stone-500">2025.04.12</span>
              </div>
              <p className="text-sm font-medium text-stone-800 line-clamp-2">
                [업데이트] 경쟁사 신호 분석 기능이 추가되었습니다. 현장에서 적극
                활용 부탁드립니다.
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center border-t border-stone-200 pt-8 pb-8">
          <p className="text-xs text-stone-400 font-medium">
            © 2025 Company Name. All rights reserved. <br />
            Unauthorized access is prohibited.
          </p>
        </footer>
      </div>
    </div>
  );
}
