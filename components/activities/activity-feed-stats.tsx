/**
 * Activity Feed 통계 카드 컴포넌트
 * 
 * 이번 주 활동 수, 평균 HIR, 재방문 요망 수를 표시합니다.
 */

import { getActivityStats } from '@/actions/activities/get-activity-stats';

export async function ActivityFeedStats() {
  const stats = await getActivityStats();

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {/* 이번 주 활동 수 */}
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <span className="text-2xl font-extrabold block mb-1 text-blue-600">
          {stats.weeklyActivityCount}건
        </span>
        <span className="text-xs text-muted-foreground font-semibold">
          이번 주 활동
        </span>
      </div>

      {/* 평균 HIR */}
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <span className="text-2xl font-extrabold block mb-1 text-green-600">
          {stats.averageHIR}%
        </span>
        <span className="text-xs text-muted-foreground font-semibold">
          평균 HIR(정직)
        </span>
      </div>

      {/* 재방문 요망 수 */}
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <span className="text-2xl font-extrabold block mb-1 text-red-600">
          {stats.revisitNeededCount}건
        </span>
        <span className="text-xs text-muted-foreground font-semibold">
          재방문 요망
        </span>
      </div>
    </div>
  );
}

