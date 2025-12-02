/**
 * Activity 기록 페이지
 *
 * 영업사원의 행동 데이터를 타임라인 피드 형태로 표시하는 페이지입니다.
 */

import { Suspense } from "react";
import { ActivityFeedClient } from "@/components/activities/activity-feed-client";
import { ActivityFeedStats } from "@/components/activities/activity-feed-stats";
import { getActivities } from "@/actions/activities/get-activities";
import { getAccounts } from "@/actions/accounts/get-accounts";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/get-user-id";
import type { Contact } from "@/types/database.types";

async function ActivitiesPageContent() {
  // 병렬로 데이터 조회
  const [activitiesResult, accountsResult] = await Promise.all([
    getActivities({ limit: 100 }),
    getAccounts(),
  ]);

  // 모든 Contacts 조회 (활동에 사용된 account_id들)
  const accountIds = new Set(
    activitiesResult.data.map((act) => act.account_id),
  );
  const userUuid = await getCurrentUserId();

  let contacts: Contact[] = [];
  if (accountIds.size > 0 && userUuid) {
    const supabase = await createClerkSupabaseClient();
    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .in("account_id", Array.from(accountIds));

    if (!contactsError && contactsData) {
      contacts = contactsData as Contact[];
    }
  }

  return (
    <div className="min-w-0 w-full max-w-3xl mx-auto px-4 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">활동 피드 (Activity Feed)</h1>
          <p className="text-muted-foreground">
            서버 로직에 의해 분석된 활동 내역입니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <ActivityFeedStats />

      {/* 피드 클라이언트 */}
      <ActivityFeedClient
        initialActivities={activitiesResult.data}
        accounts={accountsResult.data}
        contacts={contacts}
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
