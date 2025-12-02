/**
 * Coaching Cockpit Header 컴포넌트
 *
 * 관리자 대시보드의 헤더 섹션
 * 팀명, 설명, Last Updated 시간 표시
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/get-user-id';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTeamName(teamId: string | null): string {
  if (!teamId) return '전체 팀';
  // 임시로 team_id를 기반으로 표시 (향후 team 테이블 추가 시 수정 필요)
  return `팀 ${teamId.substring(0, 8)}`;
}

export async function CoachingCockpitHeader() {
  console.group('CoachingCockpitHeader: 데이터 조회 시작');

  try {
    const currentUserUuid = await getCurrentUserId();
    if (!currentUserUuid) {
      throw new Error('User not found');
    }

    const supabase = await createClerkSupabaseClient();

    // 현재 사용자의 팀 정보 조회
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('team_id, name')
      .eq('id', currentUserUuid)
      .single();

    if (userError || !currentUser) {
      console.error('사용자 정보 조회 실패:', userError);
      throw new Error('Failed to get user info');
    }

    const teamName = formatTeamName(currentUser.team_id);
    console.log('팀명:', teamName);
    console.groupEnd();

    return (
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2.5 mb-1.5">
            Coaching Cockpit
            <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {teamName}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            팀원들의 행동 품질을 모니터링하고 적시에 개입하세요.
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Last Updated: Just now</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CoachingCockpitHeader 에러:', error);
    console.groupEnd();

    // 에러 발생 시 기본값 표시
    return (
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2.5 mb-1.5">
            Coaching Cockpit
            <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
              전체 팀
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            팀원들의 행동 품질을 모니터링하고 적시에 개입하세요.
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Last Updated: Just now</span>
        </div>
      </div>
    );
  }
}

