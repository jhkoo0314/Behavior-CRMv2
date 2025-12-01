/**
 * @file app/sign-up/[[...sign-up]]/page.tsx
 * @description Clerk 인증 회원가입 페이지
 *
 * 이 페이지는 Clerk의 SignUp 컴포넌트를 사용하여 사용자 회원가입을 처리합니다.
 * [[...sign-up]] catch-all 라우트를 사용하여 Clerk의 모든 인증 경로를 처리합니다.
 *
 * 주요 기능:
 * - Clerk SignUp 컴포넌트 렌더링
 * - 회원가입 성공 시 랜딩 페이지로 리다이렉트
 * - 로그인 페이지로 이동 링크 제공
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 컴포넌트
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/"
        signInUrl="/sign-in"
      />
    </div>
  );
}

