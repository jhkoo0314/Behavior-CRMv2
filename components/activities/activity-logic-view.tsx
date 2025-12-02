'use client';

/**
 * Activity 로직 뷰 컴포넌트
 * 
 * 서버 분석 결과를 표시하는 확장 가능한 뷰입니다.
 */

import { useEffect, useState } from 'react';
import { getActivityAnalysis } from '@/actions/activities/get-activity-analysis';
import type { ActivityAnalysis } from '@/actions/activities/get-activity-analysis';
import { Loader2 } from 'lucide-react';

interface ActivityLogicViewProps {
  activityId: string;
  isExpanded: boolean;
}

export function ActivityLogicView({
  activityId,
  isExpanded,
}: ActivityLogicViewProps) {
  const [analysis, setAnalysis] = useState<ActivityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && !analysis && !isLoading) {
      setIsLoading(true);
      setError(null);

      getActivityAnalysis(activityId)
        .then((data) => {
          setAnalysis(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Activity 분석 조회 실패:', err);
          setError(err instanceof Error ? err.message : '분석 조회 실패');
          setIsLoading(false);
        });
    }
  }, [isExpanded, activityId, analysis, isLoading]);

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-border text-xs text-muted-foreground">
      <p className="font-semibold mb-2">
        <span className="mr-1">🤖</span>
        Server Analysis:
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span>분석 중...</span>
        </div>
      )}

      {error && (
        <div className="text-red-600">
          <span>오류:</span> {error}
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-1">
          {/* 타이밍 검증 */}
          <div className="flex justify-between">
            <span>• 타이밍 검증:</span>
            <span
              className={
                analysis.timingVerification.status === 'perfect'
                  ? 'text-green-600'
                  : analysis.timingVerification.status === 'good'
                    ? 'text-blue-600'
                    : 'text-yellow-600'
              }
            >
              {analysis.timingVerification.message}
            </span>
          </div>

          {/* RTR 로직 */}
          <div className="flex justify-between">
            <span>• RTR 로직:</span>
            <span>
              {analysis.rtrLogic.message} (점수: {analysis.rtrLogic.score})
            </span>
          </div>

          {/* 다음 행동 */}
          <div className="flex justify-between">
            <span>• 다음 행동:</span>
            <span>
              {analysis.nextAction.recommended}
              {analysis.nextAction.date && ` (${analysis.nextAction.date})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

