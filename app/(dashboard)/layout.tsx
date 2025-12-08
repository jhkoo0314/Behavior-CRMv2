/**
 * 대시보드 라우트 그룹 레이아웃
 *
 * - AppLayout 적용
 * - 발표용: 인증 체크 없음
 */

import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
}
