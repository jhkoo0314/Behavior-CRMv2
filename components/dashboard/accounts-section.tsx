/**
 * 대시보드 병원 관리 섹션 컴포넌트
 * 
 * 병원 관리 요약 정보와 빠른 액션을 제공합니다.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { mockAccountStats, mockAccountsWithMetrics } from '@/lib/mock/account-mock-data';
import { AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AccountWithMetrics, AccountStats } from '@/types/database.types';

export function AccountsSection() {
  const router = useRouter();
  const [isLoading] = useState(false);
  const [stats] = useState<AccountStats>(mockAccountStats);
  const [accounts] = useState<AccountWithMetrics[]>(mockAccountsWithMetrics);

  // Risk Accounts (14일 이상 미방문 또는 RISK tier)
  const riskAccounts = accounts.filter(
    (acc) => acc.tier === 'RISK' || (acc.daysSinceLastVisit !== null && acc.daysSinceLastVisit >= 14)
  ).slice(0, 3); // 최대 3개만 표시

  if (isLoading) {
    return (
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">병원 관리</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            전략적 중요도(Tier)와 관계 건강도(RTR) 기반 관리
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/accounts')}
          >
            전체 보기
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/accounts')}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="mr-2 size-4" />
            병원 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Total Accounts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total Accounts
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.totalAccounts}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {stats.activeAccounts} Active
            </div>
          </div>

          {/* Coverage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Coverage
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.coverage}%
            </div>
            <div className="text-xs text-green-600 mt-1">
              이번 달 방문율
            </div>
          </div>

          {/* S-Tier 집중도 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              S-Tier 집중도
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.sTierFocus}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              핵심 고객 관리
            </div>
          </div>

          {/* Risk Accounts */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
              Risk Accounts
            </div>
            <div className="text-2xl font-extrabold text-red-600">
              {stats.riskAccounts}
            </div>
            <div className="text-xs text-red-600 mt-1">
              14일 이상 미방문
            </div>
          </div>
        </div>

        {/* Risk Accounts 목록 */}
        {riskAccounts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-gray-900">주의 필요 병원</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/accounts?filter=RISK')}
                className="text-xs"
              >
                모두 보기
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {riskAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/accounts`)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="text-xs">
                      {account.tier === 'RISK' ? 'RISK' : '!'}
                    </Badge>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {account.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.daysSinceLastVisit !== null
                          ? `${account.daysSinceLastVisit}일 전 방문`
                          : '방문 기록 없음'}
                        {account.rtr < 50 && ` • RTR ${account.rtr}℃`}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




