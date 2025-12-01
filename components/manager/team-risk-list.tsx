/**
 * 팀원 위험도 리스트 컴포넌트
 * 
 * Coaching Signals 기반 위험도를 표시합니다.
 * PRD 4.3.2 참고: 팀원 위험도 리스트
 * 
 * 참고: coaching_signals 테이블은 있으나, 신호 생성 로직은 스프린트 5에서 구현 예정
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCoachingSignals } from '@/actions/coaching-signals/get-signals';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { getUserIdByClerkId } from '@/lib/supabase/get-user-id';
import type { CoachingSignal } from '@/types/database.types';

interface RiskItem {
  id: string;
  userId: string;
  userName: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  recommendedAction: string;
  isResolved: boolean;
}

export function TeamRiskList() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    async function fetchData() {
      console.group('TeamRiskList: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 팀원 목록 조회 (사용자 이름 매핑용)
        const teamMembersResult = await getTeamMembers({});
        const userMap = new Map<string, string>();
        for (const member of teamMembersResult.data) {
          const userUuid = await getUserIdByClerkId(member.clerk_id);
          if (userUuid) {
            userMap.set(userUuid, member.name);
          }
        }

        // coaching_signals 조회 (미해결 신호만)
        // TODO: 스프린트 5에서 신호 생성 로직 구현 후 실제 데이터 사용
        const signalsResult = await getCoachingSignals({
          isResolved: false,
        });

        const riskItems: RiskItem[] = signalsResult.data.map((signal) => ({
          id: signal.id,
          userId: signal.user_id,
          userName: userMap.get(signal.user_id) || '알 수 없음',
          type: signal.type || '',
          priority: signal.priority || 'medium',
          message: signal.message || '',
          recommendedAction: signal.recommended_action || '',
          isResolved: signal.is_resolved || false,
        }));

        console.log('위험도 리스트:', riskItems);
        setRisks(riskItems);
      } catch (err) {
        console.error('팀원 위험도 리스트 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const filteredRisks = priorityFilter === 'all'
    ? risks
    : risks.filter((risk) => risk.priority === priorityFilter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>팀원 위험도 리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
      <Card>
        <CardHeader>
          <CardTitle>팀원 위험도 리스트</CardTitle>
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
        <CardTitle>팀원 위험도 리스트</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 우선순위 필터 */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setPriorityFilter('all')}
            className={`rounded-md px-3 py-1 text-sm ${
              priorityFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`rounded-md px-3 py-1 text-sm ${
              priorityFilter === 'high'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            높음
          </button>
          <button
            onClick={() => setPriorityFilter('medium')}
            className={`rounded-md px-3 py-1 text-sm ${
              priorityFilter === 'medium'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            보통
          </button>
          <button
            onClick={() => setPriorityFilter('low')}
            className={`rounded-md px-3 py-1 text-sm ${
              priorityFilter === 'low'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            낮음
          </button>
        </div>

        {/* 위험도 리스트 */}
        {filteredRisks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {priorityFilter === 'all'
              ? '위험 신호가 없습니다.'
              : `${getPriorityLabel(priorityFilter)} 우선순위 신호가 없습니다.`}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredRisks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{risk.userName}</span>
                    <Badge variant={getPriorityColor(risk.priority) as any}>
                      {getPriorityLabel(risk.priority)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{risk.message}</p>
                {risk.recommendedAction && (
                  <div className="rounded bg-muted p-2 text-sm">
                    <span className="font-medium">추천 액션: </span>
                    {risk.recommendedAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
