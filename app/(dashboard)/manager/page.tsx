/**
 * 관리자 대시보드 페이지 (Coaching Cockpit)
 *
 * 팀장/본부 관리자용 대시보드
 * PRD 4.3 참고
 * 
 * 시연용: 모든 사용자가 접근 가능합니다.
 * 프로덕션 전환 시 역할 체크를 다시 활성화해야 합니다.
 */

import { CoachingCockpitHeader } from "@/components/manager/coaching-cockpit-header";
import { TeamKpiRow } from "@/components/manager/team-kpi-row";
import { CoachingPriorityList } from "@/components/manager/coaching-priority-list";
import { TeamBalanceRadar } from "@/components/manager/team-balance-radar";
import { MarketIntel } from "@/components/manager/market-intel";

export default async function ManagerPage() {
  return (
    <div className="min-w-0 w-full space-y-6 max-w-[1440px] mx-auto p-6">
      {/* Header */}
      <CoachingCockpitHeader />

      {/* KPI Row */}
      <TeamKpiRow />

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Coaching Priority List (2열 차지) */}
        <CoachingPriorityList />

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Balance Radar */}
          <TeamBalanceRadar />

          {/* Market Intel */}
          <MarketIntel />
        </div>
      </div>
    </div>
  );
}
