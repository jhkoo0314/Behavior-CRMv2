/**
 * 관리자 대시보드 페이지
 * 
 * 팀장/본부 관리자용 대시보드
 * 실제 기능은 스프린트 4에서 구현
 */

import { requireAnyRole } from '@/lib/auth/check-role';
import { USER_ROLES } from '@/constants/user-roles';

export default async function ManagerPage() {
  // 관리자만 접근 가능
  await requireAnyRole([USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          팀원 행동 점수, 위험도, 경쟁사 활동 등을 관리하세요.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          관리자 대시보드 기능은 스프린트 4에서 구현됩니다.
        </p>
      </div>
    </div>
  );
}

