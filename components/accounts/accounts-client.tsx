'use client';

/**
 * Account 관리 페이지 클라이언트 컴포넌트
 * 
 * 상태 관리 및 상호작용을 처리합니다.
 */

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
import { AccountList } from '@/components/accounts/account-list';
import { PlusIcon } from 'lucide-react';
import { createAccount } from '@/actions/accounts/create-account';
import { updateAccount } from '@/actions/accounts/update-account';
import { deleteAccount } from '@/actions/accounts/delete-account';
import type { Account } from '@/types/database.types';
import type { AccountFormData } from '@/components/accounts/account-form';

interface AccountsClientProps {
  initialAccounts: Account[];
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const handleCreate = async (data: AccountFormData) => {
    console.group('AccountsPage: Account 생성');
    // AccountFormData는 Zod 스키마에서 name과 type이 required이므로 타입 안전
    const newAccount = await createAccount({
      name: data.name,
      type: data.type,
      address: data.address,
      phone: data.phone,
      specialty: data.specialty,
      patient_count: data.patient_count,
      revenue: data.revenue,
      notes: data.notes,
    });
    setAccounts((prev) => [newAccount, ...prev]);
    setIsDialogOpen(false);
    console.groupEnd();
  };

  const handleUpdate = async (data: AccountFormData) => {
    if (!editingAccount) return;

    console.group('AccountsPage: Account 수정');
    const updatedAccount = await updateAccount({
      id: editingAccount.id,
      ...data,
    });
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
    );
    setIsDialogOpen(false);
    setEditingAccount(undefined);
    console.groupEnd();
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) {
      return;
    }

    console.group('AccountsPage: Account 삭제');
    await deleteAccount(accountId);
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    console.groupEnd();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAccount(undefined);
  };

  // 검색 및 필터링
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.name.toLowerCase().includes(searchLower) ||
          (acc.address && acc.address.toLowerCase().includes(searchLower))
      );
    }

    if (filterType) {
      filtered = filtered.filter((acc) => acc.type === filterType);
    }

    return filtered;
  }, [accounts, search, filterType]);

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              병원 추가
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

      <AccountList
        accounts={filteredAccounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={setSearch}
        onFilterType={setFilterType}
      />
    </>
  );
}

