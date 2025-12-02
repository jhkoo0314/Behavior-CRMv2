/**
 * 고객 세분화 컴포넌트
 * 
 * 관계 온도(RTR) 기준 분포를 도넛 차트로 시각화
 * - Loyal (30%)
 * - Potential (40%)
 * - Risk (20%)
 * - Dead (10%)
 */

'use client';

import { useState, useEffect } from 'react';

interface Segment {
  name: string;
  percentage: number;
  color: string;
  label: string;
}

export function CustomerSegmentation() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    // Mock 데이터 생성
    const generateMockData = () => {
      const mockSegments: Segment[] = [
        {
          name: 'Loyal',
          percentage: 30,
          color: '#10b981', // emerald-500
          label: 'Loyal (30%)',
        },
        {
          name: 'Potential',
          percentage: 40,
          color: '#3b82f6', // blue-500
          label: 'Potential (40%)',
        },
        {
          name: 'Risk',
          percentage: 20,
          color: '#f59e0b', // amber-500
          label: 'Risk (20%)',
        },
        {
          name: 'Dead',
          percentage: 10,
          color: '#ef4444', // red-500
          label: 'Dead (10%)',
        },
      ];

      setSegments(mockSegments);
      setTotalCustomers(124);
    };

    generateMockData();
  }, []);

  // conic-gradient 계산
  const getConicGradient = () => {
    let currentPercent = 0;
    const stops = segments.map((segment) => {
      const start = currentPercent;
      const end = currentPercent + segment.percentage;
      currentPercent = end;
      return `${segment.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  };

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-md">
      {/* Card Header */}
      <div className="mb-5">
        <h3 className="text-lg font-bold">고객 세분화</h3>
        <p className="mt-1 text-xs text-slate-500">관계 온도(RTR) 기준 분포</p>
      </div>

      {/* Donut Chart */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-32 w-32 sm:h-40 sm:w-40">
          {/* Donut Chart */}
          <div
            className="h-full w-full rounded-full"
            style={{
              background: getConicGradient(),
            }}
          >
            {/* Donut Hole */}
            <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white sm:h-24 sm:w-24">
              <span className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {totalCustomers}
              </span>
              <span className="text-[9px] text-slate-500 sm:text-[11px]">Total Customers</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {segments.map((segment) => (
            <div key={segment.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}</span>
            </div>
          ))}
        </div>

        {/* Risk Customer Button */}
        <div className="mt-5 text-center">
          <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs transition-colors hover:bg-slate-50">
            Risk 고객 목록 보기 &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
