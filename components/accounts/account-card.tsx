/**
 * Account Card 컴포넌트
 * 
 * Account 정보를 카드 형태로 표시합니다.
 * - Tier 배지
 * - 병원 정보 (이름, 지역, 담당자)
 * - 관계 온도 (RTR) 시각화
 * - 최근 방문일
 * - 파이프라인 상태
 * - 액션 버튼 (전화, 활동 기록)
 */

'use client';

import type { AccountWithMetrics } from '@/types/database.types';
import { getPipelineStatusLabel } from '@/lib/utils/get-pipeline-status';
import { Phone, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountCardProps {
  account: AccountWithMetrics;
  onCall?: (accountId: string) => void;
  onLogActivity?: (accountId: string) => void;
}

/**
 * Tier 배지 스타일
 */
function getTierBadgeStyle(tier: AccountWithMetrics['tier']) {
  switch (tier) {
    case 'S':
      return 'bg-gradient-to-br from-indigo-600 to-indigo-500';
    case 'A':
      return 'bg-blue-500';
    case 'B':
      return 'bg-slate-400';
    case 'RISK':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Tier 배지 텍스트
 */
function getTierBadgeText(tier: AccountWithMetrics['tier']) {
  switch (tier) {
    case 'S':
      return 'S';
    case 'A':
      return 'A';
    case 'B':
      return 'B';
    case 'RISK':
      return '!';
    default:
      return '?';
  }
}

/**
 * RTR 온도 바 색상
 */
function getRTROolor(rtr: number): string {
  if (rtr >= 70) return 'bg-red-500'; // 높은 온도 (빨강)
  if (rtr >= 50) return 'bg-orange-500'; // 중간 온도 (주황)
  return 'bg-blue-500'; // 낮은 온도 (파랑)
}

/**
 * RTR 텍스트 색상
 */
function getRTRTextColor(rtr: number): string {
  if (rtr >= 70) return 'text-red-600';
  if (rtr >= 50) return 'text-orange-600';
  return 'text-blue-600';
}

/**
 * 최근 방문일 포맷
 */
function formatLastVisit(daysSinceLastVisit: number | null): string {
  if (daysSinceLastVisit === null) return '방문 기록 없음';
  if (daysSinceLastVisit === 0) return '오늘';
  if (daysSinceLastVisit === 1) return '1일 전';
  return `${daysSinceLastVisit}일 전`;
}

export function AccountCard({ account, onCall, onLogActivity }: AccountCardProps) {
  const isRisk = account.tier === 'RISK' || account.daysSinceLastVisit !== null && account.daysSinceLastVisit >= 14;
  const cardBorderColor = isRisk ? 'border-red-200' : 'border-gray-200';
  const cardBgColor = isRisk ? 'bg-red-50' : 'bg-white';

  return (
    <div
      className={`rounded-xl p-5 border ${cardBorderColor} ${cardBgColor} shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Info */}
        <div className="flex items-center gap-4 flex-[2]">
          {/* Tier Badge */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 ${getTierBadgeStyle(account.tier)}`}
          >
            {getTierBadgeText(account.tier)}
          </div>

          {/* Account Info */}
          <div className="flex-1">
            <h3 className="text-base font-bold flex items-center gap-2 mb-1">
              {account.name}
              {account.region && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-normal text-gray-600">
                  {account.region}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {account.specialty || '진료과 미지정'}
              {account.contacts && ` | ${account.contacts}`}
            </p>
          </div>
        </div>

        {/* Middle: Metrics */}
        <div className="flex gap-6 items-center flex-[2]">
          {/* RTR */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-semibold">관계 온도 (RTR)</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getRTROolor(account.rtr)}`}
                  style={{ width: `${account.rtr}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${getRTRTextColor(account.rtr)}`}>
                {account.rtr}℃
              </span>
            </div>
          </div>

          {/* Last Visit */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-semibold">최근 방문</span>
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-bold ${
                  account.daysSinceLastVisit !== null && account.daysSinceLastVisit >= 14
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {formatLastVisit(account.daysSinceLastVisit)}
              </span>
              {account.daysSinceLastVisit !== null && account.daysSinceLastVisit < 14 && (
                <span className="text-xs text-gray-400">(Hir 100)</span>
              )}
            </div>
          </div>

          {/* Pipeline Status */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-semibold">파이프라인</span>
            <span
              className={`text-sm font-bold ${
                account.pipelineStatus === 'negotiation'
                  ? 'text-blue-600'
                  : account.pipelineStatus === 'at_risk'
                    ? 'text-red-600'
                    : 'text-gray-500'
              }`}
            >
              {getPipelineStatusLabel(account.pipelineStatus)}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex justify-end gap-2.5 flex-1">
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 border-gray-200 hover:border-gray-900 hover:text-gray-900"
            onClick={() => onCall?.(account.id)}
            title="전화"
          >
            <Phone className="size-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
            onClick={() => onLogActivity?.(account.id)}
            title="활동 기록"
          >
            <FileEdit className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}




