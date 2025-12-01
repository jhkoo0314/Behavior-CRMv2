'use client';

/**
 * Activity 입력 Drawer 컴포넌트
 * 
 * 모바일 최적화된 Bottom Sheet 형태의 Activity 입력 폼입니다.
 * Sheet 컴포넌트를 side="bottom"으로 사용하여 하단에서 올라오는 형태로 구현됩니다.
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ActivityForm } from './activity-form';
import type { Activity } from '@/types/database.types';
import type { Account } from '@/types/database.types';
import type { ActivityFormData } from './activity-form';

interface ActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  accounts: Account[];
  onSubmit: (data: ActivityFormData) => Promise<void>;
}

export function ActivityDrawer({
  open,
  onOpenChange,
  activity,
  accounts,
  onSubmit,
}: ActivityDrawerProps) {
  const handleSubmit = async (data: ActivityFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-2xl pb-safe"
      >
        {/* Handle 바 */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle>{activity ? '활동 수정' : '활동 기록하기'}</SheetTitle>
          <SheetDescription>
            병원 방문, 전화, 메시지 등 모든 활동을 기록하세요.
          </SheetDescription>
        </SheetHeader>

        <div className="px-1">
          <ActivityForm
            activity={activity}
            accounts={accounts}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

