/**
 * 팀원 스캐터 차트 데이터 조회 Server Action
 * 
 * 현재 사용자와 팀원들의 행동 품질 점수(Total Score)와 매출 달성률(conversion_rate)을 조회합니다.
 * 스캐터 차트에서 사용할 데이터를 제공합니다.
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';
import { calculateHIR } from '@/lib/analytics/calculate-hir';
import { calculateRTR } from '@/lib/analytics/calculate-rtr';
import { calculateBCR } from '@/lib/analytics/calculate-bcr';
import { calculatePHR } from '@/lib/analytics/calculate-phr';

export interface ScatterDataPoint {
  userId: string;
  userName: string;
  totalScore: number; // HIR, RTR, BCR, PHR의 평균
  conversionRate: number; // 매출 달성률 (Outcome의 conversion_rate)
  isCurrentUser: boolean;
}

export interface GetTeamScatterDataInput {
  periodStart?: Date | string;
  periodEnd?: Date | string;
}

/**
 * 팀원 스캐터 차트 데이터를 조회합니다.
 * 
 * @param input 기간 설정 (선택사항)
 * @returns 스캐터 차트 데이터 포인트 배열
 */
export async function getTeamScatterData(
  input: GetTeamScatterDataInput = {}
): Promise<ScatterDataPoint[]> {
  console.group('getTeamScatterData: 시작');

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const currentUserUuid = await getCurrentUserId();
    if (!currentUserUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    // 현재 사용자의 역할과 team_id 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', currentUserUuid)
      .single();

    if (currentUserError || !currentUser) {
      throw new Error('Failed to get current user');
    }

    // 기간 설정
    const endDate = input.periodEnd 
      ? (typeof input.periodEnd === 'string' ? new Date(input.periodEnd) : input.periodEnd)
      : new Date();
    const startDate = input.periodStart
      ? (typeof input.periodStart === 'string' ? new Date(input.periodStart) : input.periodStart)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('기간:', startDate, '~', endDate);

    // 팀원 목록 조회
    let teamMembersQuery = supabase
      .from('users')
      .select('id, name, clerk_id');

    // manager는 같은 team_id를 가진 사용자만 조회
    if (currentUser.role === 'manager' && currentUser.team_id) {
      teamMembersQuery = teamMembersQuery.eq('team_id', currentUser.team_id);
    }

    // 영업사원만 조회 (관리자 제외)
    teamMembersQuery = teamMembersQuery.eq('role', 'salesperson');

    const { data: teamMembers, error: teamError } = await teamMembersQuery;

    if (teamError) {
      console.error('팀원 조회 실패:', teamError);
      throw new Error(`Failed to get team members: ${teamError.message}`);
    }

    // 현재 사용자도 포함
    const { data: currentUserData } = await supabase
      .from('users')
      .select('id, name, clerk_id')
      .eq('id', currentUserUuid)
      .single();

    const allUsers = currentUserData 
      ? [...(teamMembers || []), currentUserData]
      : (teamMembers || []);

    console.log('조회된 사용자 수:', allUsers.length);

    // 각 사용자별로 Total Score와 conversion_rate 계산
    const scatterData: ScatterDataPoint[] = [];

    for (const user of allUsers) {
      try {
        // Total Score 계산 (HIR, RTR, BCR, PHR의 평균)
        const [hir, rtr, bcr, phr] = await Promise.all([
          calculateHIR(user.id, startDate, endDate),
          calculateRTR(user.id, startDate, endDate),
          calculateBCR(user.id, startDate, endDate),
          calculatePHR(user.id, startDate, endDate),
        ]);

        const totalScore = Math.round((hir + rtr + bcr + phr) / 4);

        // conversion_rate 조회 (해당 사용자의 최신 Outcome 데이터)
        const { data: userOutcomes } = await supabase
          .from('outcomes')
          .select('conversion_rate')
          .eq('user_id', user.id)
          .is('account_id', null) // 전체 통계만 사용
          .gte('period_start', startDate.toISOString())
          .lte('period_end', endDate.toISOString())
          .order('period_start', { ascending: false })
          .limit(1);

        // 가장 최신 Outcome의 conversion_rate 사용
        const conversionRate = userOutcomes && userOutcomes.length > 0 
          ? userOutcomes[0].conversion_rate 
          : 0;

        scatterData.push({
          userId: user.id,
          userName: user.name || 'Unknown',
          totalScore,
          conversionRate,
          isCurrentUser: user.id === currentUserUuid,
        });

        console.log(`사용자 ${user.name}: Total Score=${totalScore}, Conversion Rate=${conversionRate}`);
      } catch (error) {
        console.error(`사용자 ${user.name} 데이터 계산 실패:`, error);
        // 에러가 발생해도 다른 사용자 데이터는 계속 처리
      }
    }

    console.log('생성된 스캐터 데이터 포인트 수:', scatterData.length);
    console.groupEnd();

    return scatterData;
  } catch (error) {
    console.error('getTeamScatterData 에러:', error);
    console.groupEnd();
    throw error;
  }
}

