/**
 * Account 관리 페이지 클라이언트 컴포넌트
 * 
 * Strategic Account Manager - 카드 기반 레이아웃
 * Mock 데이터를 사용하여 UI를 구현합니다.
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AccountForm } from '@/components/accounts/account-form';
import { StatsOverview } from '@/components/accounts/stats-overview';
import { RiskAlertBanner } from '@/components/accounts/risk-alert-banner';
import { AccountFilterBar, type TierFilter } from '@/components/accounts/account-filter-bar';
import { AccountCard } from '@/components/accounts/account-card';
import { PlusIcon } from 'lucide-react';
import { createAccount } from '@/actions/accounts/create-account';
import { updateAccount } from '@/actions/accounts/update-account';
import { deleteAccount } from '@/actions/accounts/delete-account';
import type { AccountWithMetrics, AccountStats, RiskAlert } from '@/types/database.types';
import type { AccountFormData } from '@/components/accounts/account-form';
import { mockAccountStats, mockAccountsWithMetrics, mockRiskAlerts } from '@/lib/mock/account-mock-data';
import { useRouter } from 'next/navigation';

interface AccountsClientProps {
  initialAccounts?: AccountWithMetrics[];
  initialStats?: AccountStats;
  initialRiskAlerts?: RiskAlert[];
}

export function AccountsClient({
  initialAccounts = mockAccountsWithMetrics,
  initialStats = mockAccountStats,
  initialRiskAlerts = mockRiskAlerts,
}: AccountsClientProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithMetrics[]>(initialAccounts);
  const [stats] = useState<AccountStats>(initialStats);
  const [riskAlerts] = useState<RiskAlert[]>(initialRiskAlerts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithMetrics | undefined>();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const handleCreate = async (data: AccountFormData) => {
    console.group('AccountsPage: Account 생성');
    try {
      const newAccount = await createAccount({
        name: data.name,
        type: data.type,
        address: data.address,
        phone: data.phone,
        specialty: data.specialty,
        notes: data.notes,
        tier: data.tier === 'C' ? 'RISK' : data.tier, // C를 RISK로 변환 (DB 호환성)
      });

      // Mock 데이터 형식으로 변환 (실제로는 Server Action에서 반환)
      const newAccountWithMetrics: AccountWithMetrics = {
        ...newAccount,
        rtr: 50,
        lastVisitDate: null,
        daysSinceLastVisit: null,
        pipelineStatus: null,
        region: null,
        contacts: null,
      };

      setAccounts((prev) => [newAccountWithMetrics, ...prev]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Account 생성 실패:', error);
    }
    console.groupEnd();
  };

  const handleUpdate = async (data: AccountFormData) => {
    if (!editingAccount) return;

    console.group('AccountsPage: Account 수정');
    try {
      const updatedAccount = await updateAccount({
        id: editingAccount.id,
        ...data,
        tier: data.tier === 'C' ? 'RISK' : data.tier, // C를 RISK로 변환 (DB 호환성)
      });

      // Mock 데이터 형식으로 변환
      const updatedAccountWithMetrics: AccountWithMetrics = {
        ...updatedAccount,
        ...editingAccount, // 기존 메트릭 유지
      };

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === updatedAccountWithMetrics.id ? updatedAccountWithMetrics : acc))
      );
      setIsDialogOpen(false);
      setEditingAccount(undefined);
    } catch (error) {
      console.error('Account 수정 실패:', error);
    }
    console.groupEnd();
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) {
      return;
    }

    console.group('AccountsPage: Account 삭제');
    try {
      await deleteAccount(accountId);
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    } catch (error) {
      console.error('Account 삭제 실패:', error);
    }
    console.groupEnd();
  };

  const handleEdit = (account: AccountWithMetrics) => {
    setEditingAccount(account);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAccount(undefined);
  };

  const handleCall = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (account?.phone) {
      window.location.href = `tel:${account.phone}`;
    }
  };

  const handleLogActivity = (accountId: string) => {
    // 활동 기록 페이지로 이동 (accountId를 쿼리 파라미터로 전달)
    router.push(`/activities?accountId=${accountId}`);
  };

  const handleViewRisk = () => {
    setTierFilter('RISK');
  };

  // 검색 및 필터링
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.name.toLowerCase().includes(searchLower) ||
          (acc.address && acc.address.toLowerCase().includes(searchLower)) ||
          (acc.contacts && acc.contacts.toLowerCase().includes(searchLower)) ||
          (acc.region && acc.region.toLowerCase().includes(searchLower))
      );
    }

    // Tier 필터
    if (tierFilter !== 'all') {
      filtered = filtered.filter((acc) => acc.tier === tierFilter);
    }

    return filtered;
  }, [accounts, search, tierFilter]);

  const riskCount = accounts.filter(
    (acc) => acc.tier === 'RISK' || (acc.daysSinceLastVisit !== null && acc.daysSinceLastVisit >= 14)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">병원 관리 (Accounts)</h1>
          <p className="text-muted-foreground mt-1.5">
            전략적 중요도(Tier)와 관계 건강도(RTR) 기반 관리
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <PlusIcon className="mr-2 size-4" />
              신규 병원 등록
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? '병원 수정' : '병원 추가'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm
              account={editingAccount}
              onSubmit={editingAccount ? handleUpdate : handleCreate}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Risk Alert Banner */}
      {riskAlerts.length > 0 && (
        <RiskAlertBanner alerts={riskAlerts} onViewRisk={handleViewRisk} />
      )}

      {/* Filter & Search Bar */}
      <AccountFilterBar
        search={search}
        onSearchChange={setSearch}
        tierFilter={tierFilter}
        onTierFilterChange={setTierFilter}
        riskCount={riskCount}
      />

      {/* Account List (Cards) */}
      <div className="flex flex-col gap-3">
        {filteredAccounts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onCall={handleCall}
              onLogActivity={handleLogActivity}
            />
          ))
        )}
      </div>
    </div>
  );
}
