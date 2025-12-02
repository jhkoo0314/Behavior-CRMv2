/**
 * Risk Alert Banner 컴포넌트
 * 
 * 관계 온도 급락 또는 미방문 위험 알림을 표시합니다.
 */

'use client';

import type { RiskAlert } from '@/types/database.types';
import { Button } from '@/components/ui/button';

interface RiskAlertBannerProps {
  alerts: RiskAlert[];
  onViewRisk?: () => void;
}

export function RiskAlertBanner({ alerts, onViewRisk }: RiskAlertBannerProps) {
  if (alerts.length === 0) {
    return null;
  }

  // 첫 번째 알림만 표시 (또는 여러 개를 요약)
  const primaryAlert = alerts[0];
  const additionalCount = alerts.length - 1;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
      <span className="text-lg">🚨</span>
      <div className="flex-1">
        <span className="text-sm font-semibold text-red-800">
          주의: '{primaryAlert.accountName}'
          {additionalCount > 0 && ` 외 ${additionalCount}곳`}의 관계 온도가 급격히 하락했습니다.
        </span>
      </div>
      {onViewRisk && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewRisk}
          className="text-xs bg-white border-red-300 text-red-800 hover:bg-red-100"
        >
          리스크 보기
        </Button>
      )}
    </div>
  );
}

