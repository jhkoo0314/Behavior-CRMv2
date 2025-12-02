/**
 * Coaching Priority List 컴포넌트
 *
 * 위험 멤버(Coaching Priority)와 Top Performers(Role Model)를 표시
 * 각 멤버의 HIR, RTR, BCR, PHR 점수와 액션 버튼 제공
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { getCoachingSignals } from '@/actions/coaching-signals/get-signals';
import { getBehaviorScoresByUser } from '@/actions/behavior-scores/get-behavior-scores-by-user';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { calculateRTR } from '@/lib/analytics/calculate-rtr';
import { calculateBCR } from '@/lib/analytics/calculate-bcr';
import { calculatePHR } from '@/lib/analytics/calculate-phr';
import { calculatePeriod } from '@/lib/utils/chart-data';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';
import type { User } from '@/types/database.types';

interface MemberMetrics {
  user: User;
  hir: number;
  rtr: number;
  bcr: number;
  phr: number;
  totalScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskReason?: string;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function MemberItem({
  member,
  isRisk,
}: {
  member: MemberMetrics;
  isRisk: boolean;
}) {
  const initials = getInitials(member.user.name);
  const hasLowScore = member.rtr < 60 || member.bcr < 60 || member.phr < 60;

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
        isRisk && hasLowScore
          ? 'bg-red-50 border-red-200'
          : isRisk
            ? 'bg-white border-slate-200'
            : 'bg-white border-slate-200'
      } hover:bg-slate-50 hover:border-indigo-500`}
    >
      <div className="flex items-center gap-3 flex-[2]">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            isRisk && hasLowScore
              ? 'bg-pink-200 text-pink-900'
              : isRisk
                ? 'bg-slate-200 text-slate-600'
                : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {initials}
        </div>
        <div>
          <h4
            className={`text-sm font-bold ${
              isRisk && hasLowScore ? 'text-pink-900' : 'text-slate-800'
            }`}
          >
            {member.user.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {member.riskReason || '전체 지표 밸런스 우수'}
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-center flex-[3]">
        <div className="text-center">
          <span className="text-[10px] text-slate-500 font-semibold block">HIR</span>
          <span className="text-sm font-bold">{member.hir}</span>
        </div>
        <div className="text-center">
          <span
            className={`text-[10px] font-semibold block ${
              member.rtr < 60 ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            RTR
          </span>
          <span className={`text-sm font-bold ${member.rtr < 60 ? 'text-red-500' : ''}`}>
            {member.rtr}
          </span>
        </div>
        <div className="text-center">
          <span
            className={`text-[10px] font-semibold block ${
              member.bcr < 60 ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            BCR
          </span>
          <span className={`text-sm font-bold ${member.bcr < 60 ? 'text-red-500' : ''}`}>
            {member.bcr}%
          </span>
        </div>
        <div className="text-center">
          <span
            className={`text-[10px] font-semibold block ${
              member.phr < 60 ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            PHR
          </span>
          <span className={`text-sm font-bold ${member.phr < 60 ? 'text-red-500' : ''}`}>
            {member.phr}%
          </span>
        </div>
      </div>

      <div className="flex-[1] text-right">
        {isRisk ? (
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              hasLowScore
                ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white'
                : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-800 hover:text-white hover:border-slate-800'
            }`}
          >
            {hasLowScore ? '면담 요청' : '리마인더 전송'}
          </button>
        ) : (
          <button className="px-3 py-1.5 text-xs font-semibold rounded-md border border-emerald-500 text-emerald-500 bg-white hover:bg-emerald-500 hover:text-white transition-all">
            👏 칭찬하기
          </button>
        )}
      </div>
    </div>
  );
}

export function CoachingPriorityList() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [riskMembers, setRiskMembers] = useState<MemberMetrics[]>([]);
  const [topPerformers, setTopPerformers] = useState<MemberMetrics[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('CoachingPriorityList: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 팀원 목록 조회
        const teamMembersResult = await getTeamMembers({});
        console.log('조회된 팀원 수:', teamMembersResult.data.length);

        // 위험 신호 조회
        const signalsResult = await getCoachingSignals({
          isResolved: false,
        });
        console.log('조회된 위험 신호 수:', signalsResult.data.length);

        // 위험 신호를 사용자별로 그룹화
        const riskSignalsByUser = new Map<string, typeof signalsResult.data>();
        for (const signal of signalsResult.data) {
          if (!riskSignalsByUser.has(signal.user_id)) {
            riskSignalsByUser.set(signal.user_id, []);
          }
          riskSignalsByUser.get(signal.user_id)!.push(signal);
        }

        const { start, end } = calculatePeriod(30);

        // 각 팀원의 지표 계산
        const memberMetrics: MemberMetrics[] = [];

        for (const member of teamMembersResult.data) {
          if (!member.id) continue;

          try {
            // 각 지표 계산
            const [hir, rtr, bcr, phr] = await Promise.all([
              calculateHIR(member.id, start, end),
              calculateRTR(member.id, start, end),
              calculateBCR(member.id, start, end),
              calculatePHR(member.id, start, end),
            ]);

            const totalScore = Math.round((hir + rtr + bcr + phr) / 4);

            // 위험도 판단
            const userSignals = riskSignalsByUser.get(member.id) || [];
            const highPrioritySignals = userSignals.filter((s) => s.priority === 'high');
            const hasLowScore = rtr < 60 || bcr < 60 || phr < 60;

            let riskLevel: 'high' | 'medium' | 'low' = 'low';
            let riskReason: string | undefined;

            if (highPrioritySignals.length > 0 || hasLowScore) {
              riskLevel = highPrioritySignals.length > 0 ? 'high' : 'medium';
              if (rtr < 60) {
                riskReason = 'RTR 급락 / 방문량 저조';
              } else if (phr < 60) {
                riskReason = 'PHR 관리 부실 (Dead Lead)';
              } else if (bcr < 60) {
                riskReason = 'BCR 저조 / 루틴 부재';
              } else if (userSignals.length > 0) {
                riskReason = userSignals[0].message || '위험 신호 발생';
              }
            }

            memberMetrics.push({
              user: member,
              hir,
              rtr,
              bcr,
              phr,
              totalScore,
              riskLevel,
              riskReason,
            });
          } catch (err) {
            console.error(`팀원 ${member.name} 지표 계산 실패:`, err);
            // 개별 팀원 오류는 무시하고 계속 진행
          }
        }

        // 위험 멤버 필터링 및 정렬 (위험도 높은 순, 점수 낮은 순)
        const risks = memberMetrics
          .filter((m) => m.riskLevel !== 'low')
          .sort((a, b) => {
            if (a.riskLevel !== b.riskLevel) {
              return a.riskLevel === 'high' ? -1 : 1;
            }
            return a.totalScore - b.totalScore;
          });

        // Top Performers 필터링 및 정렬 (점수 높은 순)
        const top = memberMetrics
          .filter((m) => m.riskLevel === 'low' && m.totalScore >= 80)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 5); // 상위 5명만

        console.log('위험 멤버:', risks);
        console.log('Top Performers:', top);

        setRiskMembers(risks);
        setTopPerformers(top);
      } catch (err) {
        console.error('Coaching Priority List 조회 실패:', err);
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
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Coaching Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Coaching Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 row-span-2">
      <CardHeader>
        <div>
          <CardTitle className="text-base font-bold">🚨 Coaching Priority (집중 관리 대상)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            지표 하락세가 뚜렷하거나 루틴이 깨진 팀원입니다.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-8">
          {riskMembers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              집중 관리 대상이 없습니다.
            </p>
          ) : (
            riskMembers.map((member) => (
              <MemberItem key={member.user.id} member={member} isRisk={true} />
            ))
          )}
        </div>

        <div className="mt-8">
          <div className="mb-4">
            <CardTitle className="text-base font-bold">🏆 Top Performers (Role Model)</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              행동 품질이 우수한 팀원입니다.
            </p>
          </div>
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Top Performer가 없습니다.
              </p>
            ) : (
              topPerformers.map((member) => (
                <MemberItem key={member.user.id} member={member} isRisk={false} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

