/**
 * 공통 차트 래퍼 컴포넌트
 * 
 * 모든 차트 컴포넌트에 공통으로 적용되는:
 * - 로딩 상태 처리
 * - 에러 상태 처리
 * - 빈 데이터 상태 처리
 * 
 * PRD 5.1 참고: 모든 차트는 클라이언트 렌더링 기반
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { ChartErrorBoundary } from '@/components/error-boundary';

interface ChartWrapperProps {
  title?: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartWrapper({
  title,
  description,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = '데이터가 없습니다.',
  children,
  className,
}: ChartWrapperProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    const errorMessage = error instanceof Error ? error.message : error;

    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">차트를 불러올 수 없습니다</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 빈 데이터 상태
  if (isEmpty) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 정상 상태
  return (
    <ChartErrorBoundary>
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    </ChartErrorBoundary>
  );
}

