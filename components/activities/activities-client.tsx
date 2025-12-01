'use client';

/**
 * Activity 기록 페이지 클라이언트 컴포넌트
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityForm } from '@/components/activities/activity-form';
import { ActivityList } from '@/components/activities/activity-list';
import { PlusIcon } from 'lucide-react';
import { createActivity } from '@/actions/activities/create-activity';
import { updateActivity } from '@/actions/activities/update-activity';
import { deleteActivity } from '@/actions/activities/delete-activity';
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { ActivityFormData } from '@/components/activities/activity-form';
import { ACTIVITY_TYPE_LIST, ACTIVITY_TYPE_LABELS } from '@/constants/activity-types';
import { BEHAVIOR_TYPE_LIST, BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';

interface ActivitiesClientProps {
  initialActivities: Activity[];
  accounts: Account[];
}

export function ActivitiesClient({
  initialActivities,
  accounts,
}: ActivitiesClientProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [filters, setFilters] = useState({
    search: '',
    activityType: 'all',
    behaviorType: 'all',
    accountId: 'all',
  });

  const handleCreate = async (data: ActivityFormData) => {
    console.group('ActivitiesPage: Activity 생성');
    // ActivityFormData는 Zod 스키마에서 필수 필드들이 required이므로 타입 안전
    const newActivity = await createActivity({
      account_id: data.account_id,
      contact_id: data.contact_id ?? null,
      type: data.type,
      behavior: data.behavior,
      description: data.description,
      quality_score: data.quality_score,
      quantity_score: data.quantity_score,
      duration_minutes: data.duration_minutes,
      performed_at: new Date(data.performed_at).toISOString(),
    });
    setActivities((prev) => [newActivity, ...prev]);
    setIsDialogOpen(false);
    console.groupEnd();
  };

  const handleUpdate = async (data: ActivityFormData) => {
    if (!editingActivity) return;

    console.group('ActivitiesPage: Activity 수정');
    const updatedActivity = await updateActivity({
      id: editingActivity.id,
      account_id: data.account_id,
      contact_id: data.contact_id ?? null,
      type: data.type,
      behavior: data.behavior,
      description: data.description,
      quality_score: data.quality_score,
      quantity_score: data.quantity_score,
      duration_minutes: data.duration_minutes,
      performed_at: new Date(data.performed_at).toISOString(),
    });
    setActivities((prev) =>
      prev.map((act) =>
        act.id === updatedActivity.id ? updatedActivity : act
      )
    );
    setIsDialogOpen(false);
    setEditingActivity(undefined);
    console.groupEnd();
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    console.group('ActivitiesPage: Activity 삭제');
    await deleteActivity(activityId);
    setActivities((prev) => prev.filter((act) => act.id !== activityId));
    console.groupEnd();
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingActivity(undefined);
  };

  // 필터링
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (act) =>
          act.description.toLowerCase().includes(searchLower) ||
          accounts
            .find((acc) => acc.id === act.account_id)
            ?.name.toLowerCase()
            .includes(searchLower)
      );
    }

    if (filters.activityType !== 'all') {
      filtered = filtered.filter((act) => act.type === filters.activityType);
    }

    if (filters.behaviorType !== 'all') {
      filtered = filtered.filter(
        (act) => act.behavior === filters.behaviorType
      );
    }

    if (filters.accountId !== 'all') {
      filtered = filtered.filter((act) => act.account_id === filters.accountId);
    }

    return filtered;
  }, [activities, filters, accounts]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="설명 또는 병원명으로 검색..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="max-w-sm"
          />
          <Select
            value={filters.activityType}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, activityType: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="활동 타입" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {ACTIVITY_TYPE_LIST.map((type) => (
                <SelectItem key={type} value={type}>
                  {ACTIVITY_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.behaviorType}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, behaviorType: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="행동 타입" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {BEHAVIOR_TYPE_LIST.map((behavior) => (
                <SelectItem key={behavior} value={behavior}>
                  {BEHAVIOR_TYPE_LABELS[behavior]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.accountId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, accountId: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="병원" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              활동 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? '활동 수정' : '활동 추가'}
              </DialogTitle>
            </DialogHeader>
            <ActivityForm
              activity={editingActivity}
              accounts={accounts}
              onSubmit={editingActivity ? handleUpdate : handleCreate}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ActivityList
        activities={filteredActivities}
        accounts={accounts.map((acc) => ({ id: acc.id, name: acc.name }))}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

