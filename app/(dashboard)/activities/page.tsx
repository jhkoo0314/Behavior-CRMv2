/**
 * Activity 기록 페이지
 * 
 * 영업사원의 행동 데이터를 기록하고 조회하는 페이지입니다.
 */

import { Suspense } from 'react';
import { ActivitiesClient } from '@/components/activities/activities-client';
import { getActivities } from '@/actions/activities/get-activities';
import { getAccounts } from '@/actions/accounts/get-accounts';

async function ActivitiesPageContent() {
  const { data: activities } = await getActivities({ limit: 50 });
  const { data: accounts } = await getAccounts();

  return (
    <div className="min-w-0 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">활동 기록</h1>
          <p className="text-muted-foreground">
            병원 방문, 전화, 메시지 등 모든 활동을 기록하세요.
          </p>
        </div>
      </div>

      <ActivitiesClient
        initialActivities={activities}
        accounts={accounts}
      />
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ActivitiesPageContent />
    </Suspense>
  );
}
