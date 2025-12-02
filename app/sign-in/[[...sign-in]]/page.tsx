/**
 * @file app/sign-in/[[...sign-in]]/page.tsx
 * @description Clerk 인증 로그인 페이지
 *
 * 이 페이지는 Clerk의 SignIn 컴포넌트를 사용하여 사용자 로그인을 처리합니다.
 * [[...sign-in]] catch-all 라우트를 사용하여 Clerk의 모든 인증 경로를 처리합니다.
 *
 * 주요 기능:
 * - Clerk SignIn 컴포넌트 렌더링
 * - 로그인 성공 시 랜딩 페이지로 리다이렉트
 * - 회원가입 페이지로 이동 링크 제공
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 컴포넌트
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

