'use client';

/**
 * Activity 타임라인 컴포넌트
 * 
 * 날짜별로 그룹핑된 활동을 타임라인 형태로 표시합니다.
 */

import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';
import { groupActivitiesByDate } from '@/lib/utils/activity-utils';
import { ActivityCard } from './activity-card';

interface ActivityTimelineProps {
  activities: Activity[];
  accounts: Account[];
  contacts: Contact[];
  expandedActivityIds: Set<string>;
  onToggleExpand: (activityId: string) => void;
}

export function ActivityTimeline({
  activities,
  accounts,
  contacts,
  expandedActivityIds,
  onToggleExpand,
}: ActivityTimelineProps) {
  // 날짜별 그룹핑
  const groupedActivities = groupActivitiesByDate(activities);

  // Account 맵 생성
  const accountMap = new Map<string, Account>();
  for (const account of accounts) {
    accountMap.set(account.id, account);
  }

  // Contact 맵 생성
  const contactMap = new Map<string, Contact>();
  for (const contact of contacts) {
    contactMap.set(contact.id, contact);
  }

  return (
    <div className="relative pl-5">
      {/* 타임라인 라인 */}
      <div className="absolute left-0 top-2.5 bottom-0 w-0.5 bg-border z-0" />

      {/* 날짜별 그룹 */}
      {Array.from(groupedActivities.entries()).map(([dateKey, dateActivities]) => (
        <div key={dateKey} className="relative z-10">
          {/* 날짜 구분선 */}
          <div className="relative z-10 text-xs font-bold text-muted-foreground bg-background px-2 py-1 -ml-2.5 inline-block mb-3">
            {dateKey === '오늘' && '오늘 (Today)'}
            {dateKey === '어제' && '어제 (Yesterday)'}
            {dateKey.includes('일 전') && dateKey}
            {!dateKey.includes('일 전') && dateKey !== '오늘' && dateKey !== '어제' && dateKey}
          </div>

          {/* 활동 카드들 */}
          {dateActivities.map((activity) => {
            const account = accountMap.get(activity.account_id);
            const contact = activity.contact_id
              ? contactMap.get(activity.contact_id) || null
              : null;

            if (!account) {
              return null;
            }

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                account={account}
                contact={contact}
                isExpanded={expandedActivityIds.has(activity.id)}
                onToggleExpand={() => onToggleExpand(activity.id)}
              />
            );
          })}
        </div>
      ))}

      {/* 활동이 없을 때 */}
      {groupedActivities.size === 0 && (
        <div className="text-center text-muted-foreground py-8">
          활동이 없습니다.
        </div>
      )}
    </div>
  );
}

