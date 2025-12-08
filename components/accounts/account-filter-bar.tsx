/**
 * Filter & Search Bar 컴포넌트
 * 
 * 검색 입력 및 Tier 탭 필터를 제공합니다.
 */

'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export type TierFilter = 'all' | 'S' | 'A' | 'B' | 'RISK';

interface AccountFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  tierFilter: TierFilter;
  onTierFilterChange: (tier: TierFilter) => void;
  riskCount?: number;
}

export function AccountFilterBar({
  search,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  riskCount = 0,
}: AccountFilterBarProps) {
  return (
    <div className="flex gap-4 items-center mb-5 bg-white p-2 rounded-xl border border-gray-200">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 ml-3 size-4" />
        <Input
          type="text"
          placeholder="병원명, 담당자, 지역 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-none bg-transparent focus-visible:ring-0"
        />
      </div>

      {/* Tier Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onTierFilterChange('all')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            tierFilter === 'all'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => onTierFilterChange('S')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            tierFilter === 'S'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          S-Tier (핵심)
        </button>
        <button
          onClick={() => onTierFilterChange('A')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            tierFilter === 'A'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          A-Tier
        </button>
        <button
          onClick={() => onTierFilterChange('B')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            tierFilter === 'B'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          B-Tier
        </button>
        <div className="w-px h-5 bg-gray-200 mx-2" />
        <button
          onClick={() => onTierFilterChange('RISK')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            tierFilter === 'RISK'
              ? 'bg-red-50 text-red-600'
              : 'text-red-500 hover:bg-red-50'
          }`}
        >
          ⚠️ Risk {riskCount > 0 && `(${riskCount})`}
        </button>
      </div>
    </div>
  );
}




