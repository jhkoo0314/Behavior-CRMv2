'use client';

/**
 * Activity Feed 클라이언트 컴포넌트
 * 
 * 상태 관리 및 상호작용을 처리합니다.
 */

import { useState, useMemo } from 'react';
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';
import { ActivityFeedFilters, type ActivityFilter } from './activity-feed-filters';
import { ActivityTimeline } from './activity-timeline';
import { ActivityDrawer } from './activity-drawer';
import { PlusIcon } from 'lucide-react';
import { createActivity } from '@/actions/activities/create-activity';
import { updateActivity } from '@/actions/activities/update-activity';
import { deleteActivity } from '@/actions/activities/delete-activity';
import type { ActivityFormData } from './activity-form';
import { calculateActivityHIR } from '@/lib/utils/activity-utils';
import { getPositiveTags, getNegativeTags } from '@/constants/activity-tags';

interface ActivityFeedClientProps {
  initialActivities: Activity[];
  accounts: Account[];
  contacts: Contact[];
}

export function ActivityFeedClient({
  initialActivities,
  accounts,
  contacts,
}: ActivityFeedClientProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');

  // 필터링 로직
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((act) => {
        const account = accounts.find((acc) => acc.id === act.account_id);
        const accountName = account?.name.toLowerCase() || '';
        const description = act.description?.toLowerCase() || '';
        const tags = act.tags?.join(' ').toLowerCase() || '';

        return (
          accountName.includes(searchLower) ||
          description.includes(searchLower) ||
          tags.includes(searchLower)
        );
      });
    }

    // 필터 옵션
    if (filter === 'won') {
      filtered = filtered.filter((act) => act.outcome === 'won');
    } else if (filter === 'risk') {
      // 위험: 부정 태그 2개 이상 또는 outcome이 lost
      const negativeTagIds = getNegativeTags().map((tag) => tag.id);
      filtered = filtered.filter((act) => {
        const negativeTagCount =
          act.tags?.filter((tag) => negativeTagIds.includes(tag as any)).length || 0;
        return act.outcome === 'lost' || negativeTagCount >= 2;
      });
    } else if (filter === 'hir-excellent') {
      // HIR 우수: HIR 점수 80 이상
      filtered = filtered.filter((act) => {
        const hirScore = calculateActivityHIR(act);
        return hirScore >= 80;
      });
    }

    return filtered;
  }, [activities, search, filter, accounts]);

  // 활동 카드 확장/축소
  const handleToggleExpand = (activityId: string) => {
    setExpandedActivityIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // 활동 생성
  const handleCreate = async (
    data: ActivityFormData & { dwell_time_seconds: number }
  ) => {
    console.group('ActivityFeedClient: Activity 생성');
    console.log('폼 데이터:', data);

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const tempActivity: Activity = {
      id: tempId,
      user_id: '',
      account_id: data.account_id,
      contact_id: null,
      type: 'visit',
      behavior: 'visit',
      description: data.description || '',
      quality_score: 0,
      quantity_score: 0,
      duration_minutes: 0,
      performed_at: new Date(data.performed_at).toISOString(),
      outcome: data.outcome,
      tags: data.tags,
      sentiment_score: data.sentiment_score,
      next_action_date: data.next_action_date || null,
      dwell_time_seconds: data.dwell_time_seconds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActivities((prev) => [tempActivity, ...prev]);
    setIsDrawerOpen(false);

    try {
      const newActivity = await createActivity({
        account_id: data.account_id,
        outcome: data.outcome,
        performed_at: new Date(data.performed_at).toISOString(),
        tags: data.tags,
        sentiment_score: data.sentiment_score,
        next_action_date: data.next_action_date,
        description: data.description,
        dwell_time_seconds: data.dwell_time_seconds,
      });

      setActivities((prev) =>
        prev.map((act) => (act.id === tempId ? newActivity : act))
      );
    } catch (error) {
      console.error('Activity 생성 실패:', error);
      setActivities((prev) => prev.filter((act) => act.id !== tempId));
      setIsDrawerOpen(true);
      throw error;
    }

    console.groupEnd();
  };

  // 활동 수정
  const handleUpdate = async (
    data: ActivityFormData & { dwell_time_seconds: number }
  ) => {
    if (!editingActivity) return;

    console.group('ActivityFeedClient: Activity 수정');
    console.log('폼 데이터:', data);

    const updatedActivity = await updateActivity({
      id: editingActivity.id,
      account_id: data.account_id,
      outcome: data.outcome,
      performed_at: new Date(data.performed_at).toISOString(),
      tags: data.tags,
      sentiment_score: data.sentiment_score,
      next_action_date: data.next_action_date,
      description: data.description,
      dwell_time_seconds: data.dwell_time_seconds,
    });

    setActivities((prev) =>
      prev.map((act) => (act.id === updatedActivity.id ? updatedActivity : act))
    );
    setIsDrawerOpen(false);
    setEditingActivity(undefined);
    console.groupEnd();
  };

  // 활동 삭제
  const handleDelete = async (activityId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    console.group('ActivityFeedClient: Activity 삭제');
    await deleteActivity(activityId);
    setActivities((prev) => prev.filter((act) => act.id !== activityId));
    setExpandedActivityIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(activityId);
      return newSet;
    });
    console.groupEnd();
  };

  // 편집 시작
  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsDrawerOpen(true);
  };

  // Drawer 닫기
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingActivity(undefined);
  };

  return (
    <>
      {/* 필터 */}
      <ActivityFeedFilters
        search={search}
        filter={filter}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
      />

      {/* 타임라인 */}
      <ActivityTimeline
        activities={filteredActivities}
        accounts={accounts}
        contacts={contacts}
        expandedActivityIds={expandedActivityIds}
        onToggleExpand={handleToggleExpand}
      />

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-8 right-8 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-50"
        aria-label="활동 추가"
      >
        <PlusIcon className="size-6" />
      </button>

      {/* Activity Drawer */}
      <ActivityDrawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setEditingActivity(undefined);
          }
        }}
        activity={editingActivity}
        accounts={accounts}
        onSubmit={editingActivity ? handleUpdate : handleCreate}
      />
    </>
  );
}

