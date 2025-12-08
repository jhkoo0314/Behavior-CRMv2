/**
 * Stats Overview 컴포넌트
 * 
 * Account 통계를 4개의 카드로 표시합니다.
 * - Total Accounts
 * - Coverage (이번 달 방문율)
 * - S-Tier 집중도
 * - Risk Accounts
 */

'use client';

import type { AccountStats } from '@/types/database.types';

interface StatsOverviewProps {
  stats: AccountStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Accounts */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Total Accounts
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-1">
          {stats.totalAccounts}
        </div>
        <div className="text-xs text-blue-600 flex items-center gap-1">
          <span>{stats.activeAccounts} Active</span>
        </div>
      </div>

      {/* Coverage */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Coverage (이번 달)
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-1">
          {stats.coverage}%
        </div>
        <div className="text-xs text-green-600 flex items-center gap-1">
          <span>▲ 5% 상승</span>
        </div>
      </div>

      {/* S-Tier 집중도 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          S-Tier 집중도
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-1">
          {stats.sTierFocus}%
        </div>
        <div className="text-xs text-gray-600">
          핵심 고객 관리 우수
        </div>
      </div>

      {/* Risk Accounts */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
        <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
          Risk Accounts
        </div>
        <div className="text-2xl font-extrabold text-red-600 mb-1">
          {stats.riskAccounts}
        </div>
        <div className="text-xs text-red-600">
          14일 이상 미방문
        </div>
      </div>
    </div>
  );
}




