/**
 * Market Intel 컴포넌트
 *
 * Hot Topics (경쟁사 활동 태그 클라우드)와 Risk Hospitals (위험 병원 테이블) 표시
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
import { getCompetitorSignals } from '@/actions/competitor-signals/get-competitor-signals';
import { getCoachingSignals } from '@/actions/coaching-signals/get-signals';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { CompetitorSignal } from '@/types/database.types';
import type { Account } from '@/types/database.types';

interface HotTopic {
  text: string;
  count: number;
  isHot: boolean;
}

interface RiskHospital {
  account: Account;
  assignedTo: string;
  reason: string;
  riskLevel: 'high' | 'medium';
}

export function MarketIntel() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [riskHospitals, setRiskHospitals] = useState<RiskHospital[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('MarketIntel: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(7); // 최근 7일

        // 경쟁사 신호 조회
        const competitorSignalsResult = await getCompetitorSignals({
          startDate: start,
          endDate: end,
        });
        console.log('조회된 경쟁사 신호 수:', competitorSignalsResult.data.length);

        // 경쟁사별, 태그별로 그룹화
        const topicMap = new Map<string, number>();
        for (const signal of competitorSignalsResult.data) {
          // competitor_name을 기반으로 태그 생성
          const topic = `${signal.competitor_name} ${signal.tag || '활동'}`;
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }

        // Hot Topics 생성 (3건 이상이면 hot)
        const topics: HotTopic[] = Array.from(topicMap.entries())
          .map(([text, count]) => ({
            text,
            count,
            isHot: count >= 5, // 5건 이상이면 hot
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // 상위 10개만

        console.log('Hot Topics:', topics);

        // 위험 병원 조회
        const coachingSignalsResult = await getCoachingSignals({
          isResolved: false,
        });
        console.log('조회된 위험 신호 수:', coachingSignalsResult.data.length);

        // 팀원 목록 조회 (담당자 이름 매핑용)
        const teamMembersResult = await getTeamMembers({});
        const userMap = new Map<string, string>();
        for (const member of teamMembersResult.data) {
          if (member.id) {
            userMap.set(member.id, member.name);
          }
        }

        // 계정 조회
        const accountsResult = await getAccounts({});
        const accountMap = new Map<string, Account>();
        for (const account of accountsResult.data) {
          accountMap.set(account.id, account);
        }

        // 위험 병원 리스트 생성
        const riskHospitalsMap = new Map<string, RiskHospital>();

        for (const signal of coachingSignalsResult.data) {
          if (!signal.account_id) continue;

          const account = accountMap.get(signal.account_id);
          if (!account) continue;

          const existing = riskHospitalsMap.get(signal.account_id);
          if (existing) {
            // 이미 존재하면 위험도 업데이트 (high가 우선)
            if (signal.priority === 'high' && existing.riskLevel !== 'high') {
              existing.riskLevel = 'high';
              existing.reason = signal.message || 'RTR 급락';
            }
          } else {
            // 신규 추가
            const assignedTo = userMap.get(signal.user_id) || '알 수 없음';
            let reason = '접촉 부재';
            if (signal.message) {
              if (signal.message.includes('RTR') || signal.message.includes('관계')) {
                reason = 'RTR 급락';
              } else if (signal.message.includes('PHR') || signal.message.includes('파이프라인')) {
                reason = 'PHR 관리 부실';
              } else {
                reason = signal.message;
              }
            }

            riskHospitalsMap.set(signal.account_id, {
              account,
              assignedTo,
              reason,
              riskLevel: signal.priority === 'high' ? 'high' : 'medium',
            });
          }
        }

        const riskHospitalsList = Array.from(riskHospitalsMap.values())
          .sort((a, b) => {
            // high 우선순위가 먼저
            if (a.riskLevel !== b.riskLevel) {
              return a.riskLevel === 'high' ? -1 : 1;
            }
            return a.account.name.localeCompare(b.account.name);
          })
          .slice(0, 10); // 상위 10개만

        console.log('Risk Hospitals:', riskHospitalsList);

        setHotTopics(topics);
        setRiskHospitals(riskHospitalsList);
      } catch (err) {
        console.error('Market Intel 조회 실패:', err);
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
          <CardTitle className="text-base font-bold">Market Intel</CardTitle>
          <p className="text-xs text-slate-500 mt-1">현장 태그 기반 경쟁사 동향</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Market Intel</CardTitle>
          <p className="text-xs text-slate-500 mt-1">현장 태그 기반 경쟁사 동향</p>
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
        <CardTitle className="text-base font-bold">Market Intel</CardTitle>
        <p className="text-xs text-slate-500 mt-1">현장 태그 기반 경쟁사 동향</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hot Topics */}
        <div>
          <h4 className="text-xs font-semibold mb-2">🔥 Hot Topics (이번 주 급상승)</h4>
          <div className="flex flex-wrap gap-2">
            {hotTopics.length === 0 ? (
              <p className="text-xs text-muted-foreground">Hot Topic이 없습니다.</p>
            ) : (
              hotTopics.map((topic, index) => (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                    topic.isHot
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{topic.text}</span>
                  <span className="bg-black/10 px-1.5 py-0.5 rounded text-[10px]">
                    {topic.count}건
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Hospitals */}
        <div>
          <h4 className="text-xs font-semibold mb-2">🏥 Risk Hospitals (이탈 위험)</h4>
          {riskHospitals.length === 0 ? (
            <p className="text-xs text-muted-foreground">위험 병원이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">병원명</TableHead>
                  <TableHead className="text-xs">담당자</TableHead>
                  <TableHead className="text-xs">원인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskHospitals.map((hospital) => (
                  <TableRow key={hospital.account.id}>
                    <TableCell className="text-xs font-medium">
                      {hospital.account.name}
                    </TableCell>
                    <TableCell className="text-xs">{hospital.assignedTo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={hospital.riskLevel === 'high' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {hospital.reason}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

