/**
 * 액션 큐 컴포넌트
 * 
 * 오늘의 추천 행동 목록을 표시합니다.
 * 오른쪽 사이드바 영역에 배치됩니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getNextBestActions } from '@/actions/recommendations/get-next-best-actions';
import type { NextBestAction } from '@/lib/analytics/recommend-next-action';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, Calendar } from 'lucide-react';

function getActionIcon(reason: string): { icon: React.ReactNode; bgColor: string; textColor: string } {
  const lowerReason = reason.toLowerCase();
  
  if (lowerReason.includes('phr') || lowerReason.includes('위험') || lowerReason.includes('접촉 없음')) {
    return {
      icon: <AlertCircle className="h-4 w-4" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    };
  } else if (lowerReason.includes('rtr') || lowerReason.includes('관계') || lowerReason.includes('하락')) {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    };
  } else {
    return {
      icon: <Calendar className="h-4 w-4" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    };
  }
}

function getActionButtonText(reason: string): string {
  const lowerReason = reason.toLowerCase();
  
  if (lowerReason.includes('phr') || lowerReason.includes('접촉 없음')) {
    return '방문 계획';
  } else if (lowerReason.includes('rtr') || lowerReason.includes('관계')) {
    return '원인 파악';
  } else if (lowerReason.includes('bcr') || lowerReason.includes('루틴')) {
    return '활동 입력';
  } else {
    return '활동 입력';
  }
}

export function ActionQueue() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actions, setActions] = useState<NextBestAction[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('ActionQueue: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const data = await getNextBestActions({ limit: 5 });
        console.log('조회된 추천 행동 수:', data.length);
        setActions(data);
      } catch (err) {
        console.error('추천 행동 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const handleActionClick = (action: NextBestAction) => {
    // 활동 생성 페이지로 이동 (account_id 전달)
    router.push(`/activities?account_id=${action.account_id}`);
  };

  // 긴급 액션 개수 계산
  const urgentCount = actions.filter((action) => {
    const lowerReason = action.reason.toLowerCase();
    return lowerReason.includes('phr') || lowerReason.includes('위험') || lowerReason.includes('접촉 없음');
  }).length;

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>오늘의 추천 행동</CardTitle>
          <CardDescription>점수를 올리기 위한 최적의 행동입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>오늘의 추천 행동</CardTitle>
          <CardDescription>점수를 올리기 위한 최적의 행동입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">추천할 행동이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>오늘의 추천 행동</CardTitle>
            <CardDescription>점수를 올리기 위한 최적의 행동입니다.</CardDescription>
          </div>
          {urgentCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {urgentCount}건 긴급
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        {actions.map((action, index) => {
          const iconInfo = getActionIcon(action.reason);
          const buttonText = getActionButtonText(action.reason);

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => handleActionClick(action)}
            >
              {/* 아이콘 */}
              <div className={`${iconInfo.bgColor} ${iconInfo.textColor} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                {iconInfo.icon}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{action.account_name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{action.reason}</p>
              </div>

              {/* 버튼 */}
              <Button
                size="sm"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action);
                }}
              >
                {buttonText}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

