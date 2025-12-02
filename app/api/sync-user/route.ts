import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Clerk에서 이메일 주소 가져오기
    const email =
      clerkUser.emailAddresses[0]?.emailAddress ||
      clerkUser.username ||
      null;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Supabase에서 기존 사용자 정보 조회 (role 확인용)
    const supabase = getServiceRoleClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    // Supabase에 이미 role이 있으면 그것을 사용, 없으면 Clerk 메타데이터에서 읽기
    let role: string;
    if (existingUser?.role) {
      // Supabase에 이미 role이 있으면 그것을 우선 사용
      role = existingUser.role;
      console.log('📌 기존 Supabase role 사용:', role);
    } else {
      // Supabase에 role이 없으면 Clerk 메타데이터에서 읽기 (없으면 기본값 'salesperson')
      role =
        (clerkUser.publicMetadata?.role as string) ||
        (clerkUser.privateMetadata?.role as string) ||
        'salesperson';
      console.log('📌 Clerk 메타데이터에서 role 읽기:', role);
    }

    // role 유효성 검증
    const validRoles = ['salesperson', 'manager', 'head_manager'];
    const userRole = validRoles.includes(role) ? role : 'salesperson';

    // Supabase에 사용자 정보 동기화
    console.group("🔐 [Sync User] Supabase 동기화 시작");
    console.log("📋 사용자 정보:", {
      clerk_id: clerkUser.id,
      email: email,
      name: clerkUser.fullName || clerkUser.username || email.split("@")[0] || "Unknown",
      role: userRole,
      team_id: (clerkUser.publicMetadata?.team_id as string) || null,
    });

    // supabase는 위에서 이미 생성됨
    console.log("✅ Service Role 클라이언트 생성 완료");

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: clerkUser.id,
          email: email,
          name:
            clerkUser.fullName ||
            clerkUser.username ||
            email.split("@")[0] ||
            "Unknown",
          role: userRole,
          team_id: (clerkUser.publicMetadata?.team_id as string) || null,
        },
        {
          onConflict: "clerk_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase sync error:", error);
      console.error("📊 Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to sync user", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 사용자 동기화 성공:", data);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
