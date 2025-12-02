'use client';

/**
 * Activity 카드 컴포넌트
 * 
 * 활동 정보를 타임라인 카드 형태로 표시합니다.
 */

import { useState } from 'react';
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { Contact } from '@/types/database.types';
import {
  calculateActivityHIR,
  getRelativeTime,
  formatTime,
  getTemperatureClass,
  getTemperatureIcon,
  getTagType,
} from '@/lib/utils/activity-utils';
import { ACTIVITY_TAG_LABELS } from '@/constants/activity-tags';
import { ActivityLogicView } from './activity-logic-view';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  account: Account;
  contact?: Contact | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ActivityCard({
  activity,
  account,
  contact,
  isExpanded,
  onToggleExpand,
}: ActivityCardProps) {
  const hirScore = calculateActivityHIR(activity);
  const temperature = activity.sentiment_score;
  const temperatureClass = getTemperatureClass(temperature);
  const temperatureIcon = getTemperatureIcon(temperature);

  // Outcome에 따른 dot 색상
  const getDotClass = () => {
    if (activity.outcome === 'won') {
      return 'border-green-600';
    } else if (activity.outcome === 'lost') {
      return 'border-red-600';
    } else {
      return 'border-blue-600';
    }
  };

  // HIR 배지 스타일
  const getHIRBadgeClass = () => {
    if (hirScore >= 80) {
      return 'bg-blue-50 text-blue-600';
    } else if (hirScore >= 60) {
      return 'bg-gray-50 text-gray-600';
    } else {
      return 'bg-red-50 text-red-600';
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl p-5 mb-4 shadow-sm border border-border',
        'transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
        isExpanded && 'border-primary'
      )}
      onClick={onToggleExpand}
    >
      {/* 타임라인 dot */}
      <div
        className={cn(
          'absolute -left-6 top-6 size-3 rounded-full bg-white border-[3px]',
          getDotClass()
        )}
      />

      {/* 카드 내용 */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        {/* 메인 정보 */}
        <div>
          {/* 헤더: 병원명, 시간 */}
          <div className="flex justify-between items-start mb-2">
            <span className="text-base font-bold text-foreground">
              {account.name}
            </span>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {formatTime(activity.performed_at)} ({getRelativeTime(activity.performed_at)})
            </span>
          </div>

          {/* 연락처 정보 */}
          {contact && (
            <div className="text-[13px] text-muted-foreground flex items-center gap-1.5 mb-3">
              <span>👤</span>
              <span>
                {contact.name}
                {contact.role && ` (${contact.role})`}
                {contact.specialty && ` - ${contact.specialty}`}
              </span>
            </div>
          )}

          {/* 태그 */}
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activity.tags.map((tagId) => {
                const tagType = getTagType(tagId);
                const tagLabel = ACTIVITY_TAG_LABELS[tagId as keyof typeof ACTIVITY_TAG_LABELS] || tagId;

                return (
                  <span
                    key={tagId}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded-md font-semibold',
                      tagType === 'pos'
                        ? 'bg-green-100 text-green-800'
                        : tagType === 'neg'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {tagLabel}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 메트릭스 (오른쪽) */}
        <div className="text-right flex flex-col items-end gap-2">
          {/* HIR 배지 */}
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1',
              getHIRBadgeClass()
            )}
          >
            <span>⚡</span>
            HIR {hirScore}
          </span>

          {/* 온도 표시 */}
          <span className={cn('text-sm font-bold flex items-center gap-1', temperatureClass)}>
            <span>{temperatureIcon}</span>
            {temperature !== null ? `${temperature}도` : 'N/A'}
          </span>
        </div>
      </div>

      {/* 로직 뷰 (확장 시 표시) */}
      <ActivityLogicView activityId={activity.id} isExpanded={isExpanded} />
    </div>
  );
}

