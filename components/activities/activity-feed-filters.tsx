'use client';

/**
 * Activity Feed 필터 컴포넌트
 * 
 * 검색 및 필터 기능을 제공합니다.
 */

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ActivityFilter = 'all' | 'won' | 'risk' | 'hir-excellent';

interface ActivityFeedFiltersProps {
  search: string;
  filter: ActivityFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function ActivityFeedFilters({
  search,
  filter,
  onSearchChange,
  onFilterChange,
}: ActivityFeedFiltersProps) {
  const filters: Array<{ id: ActivityFilter; label: string; icon?: string }> = [
    { id: 'all', label: '전체' },
    { id: 'won', label: '성공(Won)', icon: '🟢' },
    { id: 'risk', label: '위험(Risk)', icon: '🔴' },
    { id: 'hir-excellent', label: 'HIR 우수', icon: '⚡' },
  ];

  return (
    <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
      {/* 검색 입력 */}
      <Input
        type="text"
        placeholder="병원명, 태그 검색..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-[200px] rounded-full border-border bg-white px-4 py-2.5 text-sm"
      />

      {/* 필터 칩 */}
      {filters.map((filterOption) => (
        <button
          key={filterOption.id}
          onClick={() => onFilterChange(filterOption.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
            'border border-border bg-white',
            filter === filterOption.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {filterOption.icon && <span className="mr-1">{filterOption.icon}</span>}
          {filterOption.label}
        </button>
      ))}
    </div>
  );
}

