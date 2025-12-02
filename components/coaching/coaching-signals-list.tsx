/**
 * 코칭 신호 목록 컴포넌트
 * 
 * 코칭 신호를 목록으로 표시하고 해결 처리할 수 있습니다.
 * PRD 5.2.4 참고: 코칭 신호 UI
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCoachingSignals } from '@/actions/coaching-signals/get-signals';
import { resolveCoachingSignal } from '@/actions/coaching-signals/resolve-signal';
import type { CoachingSignal } from '@/types/database.types';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface CoachingSignalsListProps {
  priority?: 'high' | 'medium' | 'low';
  isResolved?: boolean;
  limit?: number;
}

const PRIORITY_COLORS = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

const PRIORITY_LABELS = {
  high: '높음',
  medium: '보통',
  low: '낮음',
} as const;

export function CoachingSignalsList({
  priority,
  isResolved = false,
  limit = 10,
}: CoachingSignalsListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [signals, setSignals] = useState<CoachingSignal[]>([]);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchSignals() {
      console.group('CoachingSignalsList: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCoachingSignals({
          priority,
          isResolved,
          limit,
        });

        console.log('조회된 코칭 신호 수:', result.data.length);
        setSignals(result.data);
      } catch (err) {
        console.error('코칭 신호 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchSignals();
  }, [priority, isResolved, limit]);

  const handleResolve = async (signalId: string, resolved: boolean) => {
    console.group('CoachingSignalsList: 신호 해결 처리');
    console.log('신호 ID:', signalId, ', 해결:', resolved);

    setResolvingIds((prev) => new Set(prev).add(signalId));

    try {
      await resolveCoachingSignal({ signalId, resolved });
      // 신호 목록에서 제거하거나 상태 업데이트
      setSignals((prev) => prev.filter((s) => s.id !== signalId));
      console.log('신호 해결 처리 완료');
    } catch (err) {
      console.error('신호 해결 처리 실패:', err);
      alert('신호 해결 처리에 실패했습니다.');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
      console.groupEnd();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>코칭 신호</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
          <CardTitle>코칭 신호</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">코칭 신호를 불러올 수 없습니다</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>코칭 신호</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isResolved ? '해결된 코칭 신호가 없습니다.' : '코칭 신호가 없습니다.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>코칭 신호</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={PRIORITY_COLORS[signal.priority]}>
                      {PRIORITY_LABELS[signal.priority]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(signal.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h4 className="font-semibold">{signal.message}</h4>
                  {signal.recommended_action && (
                    <p className="text-sm text-muted-foreground">
                      추천 액션: {signal.recommended_action}
                    </p>
                  )}
                </div>
                {!isResolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(signal.id, true)}
                    disabled={resolvingIds.has(signal.id)}
                  >
                    {resolvingIds.has(signal.id) ? '처리 중...' : '해결'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



