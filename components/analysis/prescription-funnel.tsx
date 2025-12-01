/**
 * 처방 기반 성과 Funnel Chart 컴포넌트
 * 
 * 행동 → 고객 반응 → 처방량 변화 → 성과
 * PRD 4.2.4 참고: 처방 기반 성과 Funnel Chart
 */

'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getActivities } from '@/actions/activities/get-activities';
import { getPrescriptions } from '@/actions/prescriptions/get-prescriptions';
import { getOutcomes } from '@/actions/outcomes/get-outcomes';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { FunnelStep } from '@/types/chart.types';
import { formatPercent } from '@/lib/utils/chart-data';

export function PrescriptionFunnel() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('PrescriptionFunnel: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // 1. 행동: activities count
        const activitiesResult = await getActivities({
          startDate: start,
          endDate: end,
        });
        const activityCount = activitiesResult.totalCount;
        console.log('활동 수:', activityCount);

        // 2. 고객 반응: activities with positive quality_score
        const positiveActivities = activitiesResult.data.filter(
          (activity) => (activity.quality_score || 0) > 50
        ).length;
        console.log('긍정적 반응 활동 수:', positiveActivities);

        // 3. 처방량 변화: prescriptions count
        const prescriptionsResult = await getPrescriptions({
          startDate: start,
          endDate: end,
        });
        const prescriptionCount = prescriptionsResult.totalCount;
        console.log('처방 수:', prescriptionCount);

        // 4. 성과: outcomes의 prescription_index (평균)
        const outcomesResult = await getOutcomes({
          periodStart: start,
          periodEnd: end,
          periodType: 'daily',
        });
        const avgPrescriptionIndex = outcomesResult.data.length > 0
          ? outcomesResult.data
              .filter((o) => o.account_id === null)
              .reduce((sum, o) => sum + o.prescription_index, 0) / outcomesResult.data.filter((o) => o.account_id === null).length
          : 0;
        console.log('평균 처방지수:', avgPrescriptionIndex);

        // Funnel 데이터 생성
        const steps: FunnelStep[] = [
          {
            name: '행동',
            value: activityCount,
          },
          {
            name: '고객 반응',
            value: positiveActivities,
            conversionRate: activityCount > 0
              ? (positiveActivities / activityCount) * 100
              : 0,
          },
          {
            name: '처방량 변화',
            value: prescriptionCount,
            conversionRate: positiveActivities > 0
              ? (prescriptionCount / positiveActivities) * 100
              : 0,
          },
          {
            name: '성과',
            value: Math.round(avgPrescriptionIndex * 100), // 0-100 스케일로 변환
            conversionRate: prescriptionCount > 0
              ? (avgPrescriptionIndex / prescriptionCount) * 100
              : 0,
          },
        ];

        console.log('Funnel 데이터:', steps);
        setFunnelData(steps);
      } catch (err) {
        console.error('처방 기반 성과 Funnel 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const isEmpty = !isLoading && funnelData.length === 0;

  return (
    <ChartWrapper
      title="처방 기반 성과 Funnel"
      description="행동 → 고객 반응 → 처방량 변화 → 성과"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다."
    >
      {!isEmpty && (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as FunnelStep;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          값: {data.value.toLocaleString()}
                        </p>
                        {data.conversionRate !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            전환율: {formatPercent(data.conversionRate)}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" name="값">
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 전환율 표시 */}
          <div className="space-y-2 text-sm">
            {funnelData.map((step, index) => {
              if (index === 0 || step.conversionRate === undefined) return null;
              const prevStep = funnelData[index - 1];
              return (
                <div key={step.name} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {prevStep.name} → {step.name}
                  </span>
                  <span className="font-medium">
                    {formatPercent(step.conversionRate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
