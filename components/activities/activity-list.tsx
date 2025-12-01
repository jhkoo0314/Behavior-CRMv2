'use client';

/**
 * Activity 목록 컴포넌트
 * 
 * 활동 목록을 표시하고 필터링, 정렬 기능을 제공합니다.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { Activity } from '@/types/database.types';
import { ACTIVITY_TYPE_LABELS } from '@/constants/activity-types';
import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';

interface ActivityListProps {
  activities: Activity[];
  accounts: Array<{ id: string; name: string }>;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
}

export function ActivityList({
  activities,
  accounts,
  onEdit,
  onDelete,
}: ActivityListProps) {
  const getAccountName = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId)?.name || accountId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>수행 일시</TableHead>
            <TableHead>병원</TableHead>
            <TableHead>활동 타입</TableHead>
            <TableHead>행동 타입</TableHead>
            <TableHead>설명</TableHead>
            <TableHead>품질</TableHead>
            <TableHead>양</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                활동이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{formatDate(activity.performed_at)}</TableCell>
                <TableCell className="font-medium">
                  {getAccountName(activity.account_id)}
                </TableCell>
                <TableCell>{ACTIVITY_TYPE_LABELS[activity.type]}</TableCell>
                <TableCell>
                  {BEHAVIOR_TYPE_LABELS[activity.behavior]}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {activity.description}
                </TableCell>
                <TableCell>{activity.quality_score}</TableCell>
                <TableCell>{activity.quantity_score}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(activity)}>
                        <PencilIcon className="mr-2 size-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(activity.id)}
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
  );
}

