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
import { HospitalRiskMap } from '@/components/manager/hospital-risk-map';
import { CompetitorHeatmap } from '@/components/manager/competitor-heatmap';
import { TeamGoals } from '@/components/manager/team-goals';

export default async function ManagerPage() {
  // 관리자만 접근 가능
  await requireAnyRole([USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER]);

  return (
    <div className="min-w-0 w-full space-y-6">
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

      {/* 병원 위험 지도 및 경쟁사 활동 */}
      <div className="grid gap-6 md:grid-cols-2">
        <HospitalRiskMap />
        <CompetitorHeatmap />
      </div>

      {/* 팀 목표 달성 현황 */}
      <TeamGoals />
    </div>
  );
}

