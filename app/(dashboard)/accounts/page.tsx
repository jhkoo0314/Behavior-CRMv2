/**
 * Account 관리 페이지
 *
 * Strategic Account Manager - 전략적 중요도(Tier)와 관계 건강도(RTR) 기반 관리
 * Mock 데이터를 사용하여 UI를 구현합니다.
 */

import { AccountsClient } from "@/components/accounts/accounts-client";

export default function AccountsPage() {
  return (
    <div className="min-w-0 w-full">
      <AccountsClient />
    </div>
  );
}
