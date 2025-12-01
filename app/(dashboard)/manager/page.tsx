/**
 * 관리자 대시보드 페이지
 * 
 * 팀장/본부 관리자용 대시보드
 * PRD 4.3 참고
 */

import { requireAnyRole } from '@/lib/auth/check-role';
import { USER_ROLES } from '@/constants/user-roles';
import { TeamBehaviorRanking } from '@/components/manager/team-behavior-ranking';
import { TeamRiskList } from '@/components/manager/team-risk-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* 팀원 행동 점수 순위 */}
        <TeamBehaviorRanking />

        {/* 팀원 위험도 리스트 */}
        <TeamRiskList />
      </div>

      {/* 향후 추가될 기능들 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>병원 위험 지도</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              병원 위험 지도 기능은 향후 구현 예정입니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>경쟁사 활동 히트맵</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              경쟁사 활동 히트맵 기능은 향후 구현 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

