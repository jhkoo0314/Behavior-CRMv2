/**
 * Account 관리 페이지
 *
 * 병원 정보를 조회, 생성, 수정, 삭제할 수 있는 페이지입니다.
 */

import { Suspense } from "react";
import { AccountsClient } from "@/components/accounts/accounts-client";
import { getAccounts } from "@/actions/accounts/get-accounts";

async function AccountsPageContent() {
  const { data: accounts } = await getAccounts();

  return (
    <div className="min-w-0 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">병원 관리</h1>
          <p className="text-muted-foreground">
            병원 정보를 관리하고 활동 기록 시 사용할 수 있습니다.
          </p>
        </div>
      </div>

      <AccountsClient initialAccounts={accounts} />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AccountsPageContent />
    </Suspense>
  );
}
