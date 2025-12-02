/**
 * 처방 전환 퍼널 (Prescription Funnel) 컴포넌트
 * 
 * 활동(Visit)이 실제 처방(Outcome)으로 이어지는 단계별 누수 분석
 * - 방문 (Visit) → 제안 (Proposal) → 처방 (Action)
 */

'use client';

import { useState, useEffect } from 'react';

interface FunnelStep {
  name: string;
  value: number;
  conversionRate?: number; // 이전 단계 대비 전환율 (%)
}

export function PrescriptionFunnel() {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);

  useEffect(() => {
    // Mock 데이터 생성
    const generateMockData = () => {
      const visit = 1240;
      const proposal = 744; // 60% 전환
      const action = 112; // 15% 전환 (위험)

      const steps: FunnelStep[] = [
        {
          name: '방문 (Visit)',
          value: visit,
        },
        {
          name: '제안 (Proposal)',
          value: proposal,
          conversionRate: (proposal / visit) * 100, // 60%
        },
        {
          name: '처방 (Action)',
          value: action,
          conversionRate: (action / proposal) * 100, // 15%
        },
      ];

      setFunnelData(steps);
    };

    generateMockData();
  }, []);

  const maxValue = funnelData.length > 0 ? Math.max(...funnelData.map((s) => s.value)) : 1;

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-md">
      {/* Card Header */}
      <div className="mb-5">
        <h3 className="text-lg font-bold">처방 전환 퍼널 (Prescription Funnel)</h3>
        <p className="mt-1 text-xs text-slate-500">
          활동(Visit)이 실제 처방(Outcome)으로 이어지는 단계별 누수 분석
        </p>
      </div>

      {/* Funnel Chart */}
      <div className="space-y-3 py-5">
        {funnelData.map((step, index) => {
          const widthPercent = (step.value / maxValue) * 100;
          const isDanger = step.conversionRate !== undefined && step.conversionRate < 20;

          return (
            <div key={step.name} className="relative flex items-center">
              {/* Label */}
              <div className="w-20 shrink-0 text-right text-[10px] font-semibold text-slate-500 sm:w-24 sm:text-xs">
                {step.name}
              </div>

              {/* Bar Container */}
              <div className="relative ml-4 flex-1">
                <div className="h-9 rounded-md bg-slate-100">
                  {/* Bar */}
                  <div
                    className={`flex h-full items-center justify-end rounded-md pr-3 text-xs font-semibold text-white transition-all duration-1000 ${
                      index === 0
                        ? 'bg-slate-400'
                        : index === 1
                          ? 'bg-blue-400'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  >
                    {step.value.toLocaleString()}건
                  </div>
                </div>

                {/* Conversion Badge */}
                {step.conversionRate !== undefined && (
                  <div className="absolute -right-10 top-1/2 hidden -translate-y-1/2 text-[10px] font-bold text-slate-500 sm:-right-12 sm:block sm:text-xs">
                    {step.conversionRate.toFixed(0)}%
                  </div>
                )}

                {/* Leakage Indicator */}
                {step.conversionRate !== undefined && index > 0 && (
                  <div
                    className={`absolute right-2 top-9 flex items-center gap-1 text-[10px] sm:top-10 sm:text-xs ${
                      isDanger ? 'font-bold text-red-500' : 'text-slate-500'
                    }`}
                  >
                    <span>▼</span>
                    {isDanger ? (
                      <span>{step.conversionRate.toFixed(0)}% (위험)</span>
                    ) : (
                      <span>{step.conversionRate.toFixed(0)}% 전환</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Box */}
      <div className="mt-5 rounded border-l-4 border-red-500 bg-slate-50 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          🚨 Bottleneck Alert
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          <strong>제안 → 처방</strong> 단계의 전환율이 15%로, 팀 평균(35%)보다 현저히 낮습니다.{' '}
          <strong>[결정권자 미팅]</strong> 태그가 포함된 활동 비중을 늘려야 합니다.
        </p>
      </div>
    </div>
  );
}
