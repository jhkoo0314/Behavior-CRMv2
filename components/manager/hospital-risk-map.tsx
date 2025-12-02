/**
 * 병원 위험 지도 컴포넌트
 * 
 * 위험 병원을 리스트 형태로 표시합니다.
 * PRD 4.3.3 참고: 병원 위험 지도
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCoachingSignals } from '@/actions/coaching-signals/get-signals';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { Account } from '@/types/database.types';

interface HospitalRisk {
  account: Account;
  riskCount: number;
  highPriorityCount: number;
  latestRiskDate: string | null;
}

export function HospitalRiskMap() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [risks, setRisks] = useState<HospitalRisk[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('HospitalRiskMap: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 최근 30일 데이터
        const { start, end } = calculatePeriod(30);

        // 모든 계정 조회
        const accountsResult = await getAccounts({});
        console.log('조회된 계정 수:', accountsResult.data.length);

        // 모든 위험 신호 조회 (한 번만)
        const signalsResult = await getCoachingSignals({
          isResolved: false,
        });
        console.log('조회된 위험 신호 수:', signalsResult.data.length);

        // 각 계정별 위험 신호 집계
        const hospitalRisks: HospitalRisk[] = [];

        for (const account of accountsResult.data) {
          // 해당 계정과 관련된 신호만 필터링
          const accountSignals = signalsResult.data.filter(
            (signal) => signal.account_id === account.id
          );

          if (accountSignals.length > 0) {
            const highPriorityCount = accountSignals.filter(
              (signal) => signal.priority === 'high'
            ).length;

            const latestRisk = accountSignals
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            hospitalRisks.push({
              account,
              riskCount: accountSignals.length,
              highPriorityCount,
              latestRiskDate: latestRisk?.created_at || null,
            });
          }
        }

        // 위험도가 높은 순으로 정렬 (high priority 개수, 전체 위험 개수)
        const sorted = hospitalRisks.sort((a, b) => {
          if (b.highPriorityCount !== a.highPriorityCount) {
            return b.highPriorityCount - a.highPriorityCount;
          }
          return b.riskCount - a.riskCount;
        });

        console.log('병원 위험도 리스트:', sorted);
        setRisks(sorted);
      } catch (err) {
        console.error('병원 위험 지도 데이터 조회 실패:', err);
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
          <CardTitle>병원 위험 지도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle>병원 위험 지도</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>병원 위험 지도</CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            위험 병원이 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>병원명</TableHead>
                <TableHead>위험 신호</TableHead>
                <TableHead>높은 우선순위</TableHead>
                <TableHead>최근 위험일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((risk) => (
                <TableRow key={risk.account.id}>
                  <TableCell className="font-medium">{risk.account.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{risk.riskCount}건</Badge>
                  </TableCell>
                  <TableCell>
                    {risk.highPriorityCount > 0 && (
                      <Badge variant="destructive">{risk.highPriorityCount}건</Badge>
                    )}
                    {risk.highPriorityCount === 0 && (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {risk.latestRiskDate
                      ? new Date(risk.latestRiskDate).toLocaleDateString('ko-KR')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

