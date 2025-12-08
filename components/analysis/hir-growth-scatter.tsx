/**
 * 정직입력률(HIR)과 성장의 상관관계 차트 컴포넌트
 * 
 * X축: HIR (Honest Input Rate) %
 * Y축: YoY 성장률 (%)
 * 
 * "솔직하게 기록할수록 매출은 오릅니다"에 대한 데이터 증명
 */

'use client';

import { useState, useEffect } from 'react';

interface ScatterPoint {
  hir: number; // 40-100
  growth: number; // -20 to 60
}

export function HirGrowthScatter() {
  const [data, setData] = useState<ScatterPoint[]>([]);

  useEffect(() => {
    // Mock 데이터 생성
    const generateMockData = () => {
      const points: ScatterPoint[] = Array.from({ length: 30 }, () => {
        const hir = Math.random() * 60 + 40; // 40~100
        // HIR이 높을수록 성장률이 높아지는 상관관계 + 랜덤성
        const growth = hir * 0.8 - 20 + (Math.random() * 20 - 10);
        return { hir, growth };
      });

      setData(points);
    };

    generateMockData();
  }, []);

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-md">
      {/* Card Header */}
      <div className="mb-5">
        <h3 className="text-lg font-bold">정직입력률(HIR)과 성장의 상관관계</h3>
        <p className="mt-1 text-xs text-slate-500">
          &quot;솔직하게 기록할수록 매출은 오릅니다&quot;에 대한 데이터 증명
        </p>
      </div>

      {/* Scatter Chart Container */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-[250px] w-full border-b-2 border-l-2 border-slate-200 sm:h-[300px]">
          {/* Axes Labels */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 sm:-bottom-6 sm:text-xs">
            HIR (Honest Input Rate) %
          </div>
          <div className="absolute -left-6 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 sm:-left-8 sm:block sm:text-xs">
            YoY 성장률 (%)
          </div>

          {/* Trend Line */}
          <div
            className="absolute bottom-[10%] left-[10%] h-0.5 origin-left rounded-sm bg-blue-500 opacity-50"
            style={{
              width: '90%',
              transform: 'rotate(-35deg)',
              transformOrigin: 'left bottom',
            }}
          />

          {/* Scatter Points */}
          {data.map((point, index) => {
            // HIR을 0-100% 범위로 정규화 (left 위치)
            const leftPercent = point.hir;
            // Growth를 -20~60 범위를 0~100%로 정규화 (bottom 위치)
            const growthNormalized = ((point.growth + 20) / 80) * 100;
            const bottomPercent = Math.max(0, Math.min(100, growthNormalized));

            return (
              <div
                key={index}
                className="absolute h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-slate-500 opacity-60"
                style={{
                  left: `${leftPercent}%`,
                  bottom: `${bottomPercent}%`,
                }}
                title={`HIR: ${point.hir.toFixed(1)}%, Growth: ${point.growth.toFixed(1)}%`}
              />
            );
          })}

          {/* High Performer Highlight */}
          <div
            className="absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500 opacity-100"
            style={{
              left: '90%',
              bottom: '80%',
            }}
            title="Role Model"
          />
        </div>
      </div>

      {/* Insight Box */}
      <div className="mt-5 rounded border-l-4 border-blue-500 bg-slate-50 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          📈 Correlation Check
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          우리 조직 데이터 분석 결과, <strong>HIR이 80% 이상인 그룹</strong>은 그렇지 않은 그룹보다{' '}
          <strong>성장률이 2.5배</strong> 높습니다. 단순 기록이 아니라 &apos;회고&apos;를 하기 때문입니다.
        </p>
      </div>
    </div>
  );
}
