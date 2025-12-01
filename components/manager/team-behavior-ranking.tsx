/**
 * 팀원 행동 점수 순위 컴포넌트
 * 
 * 팀원별 Behavior Score 순위표를 표시합니다.
 * PRD 4.3.1 참고: 팀원 행동 점수 순위
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
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamMembers } from '@/actions/users/get-team-members';
import { getBehaviorScoresByUser } from '@/actions/behavior-scores/get-behavior-scores-by-user';
import { calculatePeriod } from '@/lib/utils/chart-data';
import { formatNumber } from '@/lib/utils/chart-data';
import type { User } from '@/types/database.types';
import { BEHAVIOR_TYPE_LIST } from '@/constants/behavior-types';
import Link from 'next/link';

interface TeamMemberScore {
  user: User;
  totalScore: number;
  behaviorScores: Record<string, number>; // behavior -> 평균 quality_score
}

export function TeamBehaviorRanking() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [ranking, setRanking] = useState<TeamMemberScore[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'totalScore'>('totalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchData() {
      console.group('TeamBehaviorRanking: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        // 팀원 목록 조회
        const teamMembersResult = await getTeamMembers({});
        console.log('조회된 팀원 수:', teamMembersResult.data.length);

        const { start, end } = calculatePeriod(30);

        // 각 팀원의 Behavior Score 조회
        const memberScores: TeamMemberScore[] = [];

        for (const member of teamMembersResult.data) {
          // member.id는 이미 UUID입니다 (getTeamMembers가 select('*')로 반환)
          if (!member.id) continue;

          // 각 팀원의 Behavior Score 조회
          const scores = await getBehaviorScoresByUser({
            userId: member.id,
            periodStart: start,
            periodEnd: end,
          });

          // 각 behavior별 평균 quality_score 계산
          const behaviorScoreMap: Record<string, { sum: number; count: number }> = {};

          for (const behaviorType of BEHAVIOR_TYPE_LIST) {
            behaviorScoreMap[behaviorType] = { sum: 0, count: 0 };
          }

          for (const score of scores) {
            const existing = behaviorScoreMap[score.behavior];
            if (existing) {
              existing.sum += score.quality_score;
              existing.count += 1;
            }
          }

          const behaviorScores: Record<string, number> = {};
          let totalScore = 0;

          for (const behaviorType of BEHAVIOR_TYPE_LIST) {
            const stats = behaviorScoreMap[behaviorType];
            const avgScore = stats.count > 0 ? stats.sum / stats.count : 0;
            behaviorScores[behaviorType] = Math.round(avgScore);
            totalScore += avgScore;
          }

          memberScores.push({
            user: member,
            totalScore: Math.round(totalScore / BEHAVIOR_TYPE_LIST.length),
            behaviorScores,
          });
        }

        // 정렬
        const sorted = [...memberScores].sort((a, b) => {
          if (sortBy === 'name') {
            return sortOrder === 'asc'
              ? a.user.name.localeCompare(b.user.name)
              : b.user.name.localeCompare(a.user.name);
          } else {
            return sortOrder === 'asc'
              ? a.totalScore - b.totalScore
              : b.totalScore - a.totalScore;
          }
        });

        console.log('순위 데이터:', sorted);
        setRanking(sorted);
      } catch (err) {
        console.error('팀원 행동 점수 순위 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, [sortBy, sortOrder]);

  const handleSort = (column: 'name' | 'totalScore') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>팀원 행동 점수 순위</CardTitle>
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
          <CardTitle>팀원 행동 점수 순위</CardTitle>
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
        <CardTitle>팀원 행동 점수 순위</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순위</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                이름 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalScore')}
              >
                총점 {sortBy === 'totalScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>상세 보기</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  팀원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              ranking.map((member, index) => (
                <TableRow key={member.user.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{member.user.name}</TableCell>
                  <TableCell>{formatNumber(member.totalScore)}점</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard?userId=${member.user.clerk_id}`}
                      className="text-primary hover:underline"
                    >
                      보기
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
