'use client';

/**
 * Account 목록 컴포넌트
 * 
 * 병원 목록을 표시하고 검색, 필터링 기능을 제공합니다.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { Account } from '@/types/database.types';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onSearch?: (search: string) => void;
  onFilterType?: (type: string | null) => void;
}

const ACCOUNT_TYPE_LABELS: Record<
  'general_hospital' | 'hospital' | 'clinic' | 'pharmacy',
  string
> = {
  general_hospital: '종합병원',
  hospital: '병원',
  clinic: '의원',
  pharmacy: '약국',
};

export function AccountList({
  accounts,
  onEdit,
  onDelete,
  onSearch,
  onFilterType,
}: AccountListProps) {
  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    onFilterType?.(value === 'all' ? null : value);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="병원명 또는 주소로 검색..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="타입 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>병원명</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>주소</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>환자 수</TableHead>
              <TableHead>매출</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  병원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    {ACCOUNT_TYPE_LABELS[account.type]}
                  </TableCell>
                  <TableCell>{account.address || '-'}</TableCell>
                  <TableCell>{account.phone || '-'}</TableCell>
                  <TableCell>
                    {account.patient_count.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {account.revenue.toLocaleString()}원
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(account)}>
                          <PencilIcon className="mr-2 size-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(account.id)}
                          className="text-destructive"
                        >
                          <TrashIcon className="mr-2 size-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

