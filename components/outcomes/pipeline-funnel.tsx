/**
 * 파이프라인 퍼널 컴포넌트
 * 
 * 제안, 협상, 마감 임박 단계별 건수와 비율을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPipelineSummary } from '@/actions/outcomes/get-pipeline-summary';
import { Clock } from 'lucide-react';
import type { PipelineStage } from '@/actions/outcomes/get-pipeline-summary';

const STAGE_COLORS = {
  proposal: '#94a3b8', // gray
  negotiation: '#3b82f6', // blue
  closing: '#10b981', // green
};

export function PipelineFunnel() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('PipelineFunnel: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const summary = await getPipelineSummary();
        console.log('파이프라인 단계:', summary.stages);
        console.log('전환율:', summary.conversionRate);
        setStages(summary.stages);
      } catch (err) {
        console.error('파이프라인 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            파이프라인 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            파이프라인 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            파이프라인 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  // 최대 건수 계산 (퍼센트 계산용)
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          파이프라인 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => {
            const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const color = STAGE_COLORS[stage.stage];

            return (
              <div key={stage.stage} className="flex items-center gap-3 text-sm">
                <div className="w-20 text-muted-foreground">{stage.stageLabel}</div>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right font-bold">{stage.count}건</div>
              </div>
            );
          })}
        </div>

        {/* 팁 메시지 */}
        {stages.length > 0 && (
          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <span className="font-semibold">💡 Tip:</span>{' '}
            {stages.find((s) => s.stage === 'negotiation')?.count &&
            stages.find((s) => s.stage === 'negotiation')!.count >= 7 ? (
              <>
                &apos;협상&apos; 단계에 {stages.find((s) => s.stage === 'negotiation')!.count}건이 몰려 있습니다.
                PHR 점수를 위해 이번 주 내로 2건 이상 클로징 시도가 필요합니다.
              </>
            ) : (
              '파이프라인을 관리하여 전환율을 높이세요.'
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

