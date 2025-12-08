/**
 * Next Best Action 추천 컴포넌트
 * 
 * 병원별 추천 행동을 카드 형태로 표시합니다.
 * PRD 5.4.2 참고: Next Best Action UI
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getNextBestActions } from '@/actions/recommendations/get-next-best-actions';
import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import type { NextBestAction } from '@/lib/analytics/recommend-next-action';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NextBestAction() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recommendations, setRecommendations] = useState<NextBestAction[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecommendations() {
      console.group('NextBestAction: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const data = await getNextBestActions({ limit: 5 });
        console.log('조회된 추천 행동 수:', data.length);
        setRecommendations(data);
      } catch (err) {
        console.error('추천 행동 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchRecommendations();
  }, []);

  const handleCreateActivity = () => {
    router.push('/activities');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 행동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
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
          <CardTitle>추천 행동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">추천 행동을 불러올 수 없습니다</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 행동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              추천할 행동이 없습니다. 활동을 기록하면 추천이 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>추천 행동</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={`${rec.account_id}-${index}`}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">우선순위 {rec.priority}</Badge>
                    <h4 className="font-semibold">{rec.account_name}</h4>
                    {rec.contact_name && (
                      <span className="text-sm text-muted-foreground">
                        ({rec.contact_name})
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      추천 행동: {BEHAVIOR_TYPE_LABELS[rec.recommended_behavior]}
                    </p>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateActivity}
                className="w-full"
              >
                활동 기록하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}






