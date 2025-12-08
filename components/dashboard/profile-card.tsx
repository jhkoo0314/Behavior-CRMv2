/**
 * 프로필 카드 컴포넌트
 * 
 * 사용자 프로필, Total Score, 4개 지표(HIR, RTR, BCR, PHR)를 표시합니다.
 * 왼쪽 사이드바 영역에 배치됩니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { mockCurrentMetrics, mockPreviousMetrics, type BehaviorMetrics } from '@/lib/mock/dashboard-mock-data';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getRankBadge(totalScore: number): { text: string; className: string } {
  if (totalScore >= 90) {
    return { text: '🏆 상위 5% (Excellent)', className: 'bg-blue-50 text-blue-600' };
  } else if (totalScore >= 80) {
    return { text: '🏆 상위 12% (Excellent)', className: 'bg-blue-50 text-blue-600' };
  } else if (totalScore >= 70) {
    return { text: '⭐ 상위 30% (Good)', className: 'bg-green-50 text-green-600' };
  } else if (totalScore >= 60) {
    return { text: '📊 상위 50% (Average)', className: 'bg-yellow-50 text-yellow-600' };
  } else {
    return { text: '📈 개선 필요', className: 'bg-gray-50 text-gray-600' };
  }
}

export function ProfileCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<BehaviorMetrics | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<BehaviorMetrics | null>(null);

  useEffect(() => {
    console.group('ProfileCard: Mock 데이터 로드 시작');
    setIsLoading(true);
    setError(null);

    try {
      // 공통 Mock 데이터 사용
      setMetrics(mockCurrentMetrics);
      setPreviousMetrics(mockPreviousMetrics);

      console.log('로드된 Mock 현재 지표:', mockCurrentMetrics);
      console.log('로드된 Mock 이전 지표:', mockPreviousMetrics);
    } catch (err) {
      console.error('Mock 데이터 로드 실패:', err);
      setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center text-center">
        <CardHeader className="w-full">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 w-full">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Behavior Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.message || '데이터를 불러올 수 없습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mock 사용자 이름 사용
  const userName = '시연 사용자';
  const userInitials = getInitials(userName);
  const rankBadge = getRankBadge(metrics.totalScore);

  function getChange(current: number, previous: number): { value: number; icon: React.ReactNode } {
    const diff = current - previous;
    if (diff > 0) {
      return { value: diff, icon: <ArrowUp className="h-3 w-3" /> };
    } else if (diff < 0) {
      return { value: Math.abs(diff), icon: <ArrowDown className="h-3 w-3" /> };
    }
    return { value: 0, icon: <Minus className="h-3 w-3" /> };
  }

  const hirChange = previousMetrics ? getChange(metrics.hir, previousMetrics.hir) : { value: 0, icon: null };
  const rtrChange = previousMetrics ? getChange(metrics.rtr, previousMetrics.rtr) : { value: 0, icon: null };
  const bcrChange = previousMetrics ? getChange(metrics.bcr, previousMetrics.bcr) : { value: 0, icon: null };
  const phrChange = previousMetrics ? getChange(metrics.phr, previousMetrics.phr) : { value: 0, icon: null };

  return (
    <Card className="flex flex-col items-center text-center h-full">
      <CardHeader className="w-full pb-2">
        <CardTitle className="text-lg">My Behavior Quality</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2 w-full flex-1 py-2">
        {/* 아바타 */}
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
          {userInitials}
        </div>

        {/* Total Score */}
        <div className="text-4xl font-extrabold text-blue-600 leading-none">
          {metrics.totalScore}
        </div>
        <div className="text-xs text-muted-foreground">Total Score</div>

        {/* 랭크 배지 */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${rankBadge.className}`}>
          {rankBadge.text}
        </span>

        {/* 구분선 */}
        <hr className="w-full border-t my-3" />

        {/* 4개 지표 그리드 */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* HIR */}
          <div className="flex flex-col gap-0.5 p-2 bg-slate-50 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">HIR (정직)</span>
            <span className="text-xl font-bold text-green-600">{metrics.hir}%</span>
            {hirChange.value > 0 && (
              <span className="text-[11px] flex items-center gap-1 text-green-600">
                {hirChange.icon} {hirChange.value}%
              </span>
            )}
            {hirChange.value < 0 && (
              <span className="text-[11px] flex items-center gap-1 text-red-600">
                {hirChange.icon} {hirChange.value}%
              </span>
            )}
            {hirChange.value === 0 && (
              <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                {hirChange.icon} 0%
              </span>
            )}
          </div>

          {/* RTR */}
          <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">RTR (관계)</span>
            <span className="text-xl font-bold text-yellow-600">{metrics.rtr}점</span>
            {rtrChange.value > 0 && (
              <span className="text-[11px] flex items-center gap-1 text-green-600">
                {rtrChange.icon} {rtrChange.value}점
              </span>
            )}
            {rtrChange.value < 0 && (
              <span className="text-[11px] flex items-center gap-1 text-red-600">
                {rtrChange.icon} {rtrChange.value}점
              </span>
            )}
            {rtrChange.value === 0 && (
              <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                {rtrChange.icon} 0점
              </span>
            )}
          </div>

          {/* BCR */}
          <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">BCR (루틴)</span>
            <span className="text-xl font-bold">{metrics.bcr}%</span>
            {bcrChange.value > 0 && (
              <span className="text-[11px] flex items-center gap-1 text-green-600">
                {bcrChange.icon} {bcrChange.value}%
              </span>
            )}
            {bcrChange.value < 0 && (
              <span className="text-[11px] flex items-center gap-1 text-red-600">
                {bcrChange.icon} {bcrChange.value}%
              </span>
            )}
            {bcrChange.value === 0 && (
              <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                {bcrChange.icon} 0%
              </span>
            )}
          </div>

          {/* PHR */}
          <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">PHR (관리)</span>
            <span className="text-xl font-bold">{metrics.phr}%</span>
            {phrChange.value > 0 && (
              <span className="text-[11px] flex items-center gap-1 text-green-600">
                {phrChange.icon} {phrChange.value}%
              </span>
            )}
            {phrChange.value < 0 && (
              <span className="text-[11px] flex items-center gap-1 text-red-600">
                {phrChange.icon} {phrChange.value}%
              </span>
            )}
            {phrChange.value === 0 && (
              <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                {phrChange.icon} 0%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

