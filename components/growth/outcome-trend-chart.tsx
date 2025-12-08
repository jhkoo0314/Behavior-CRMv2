/**
 * Outcome Layer 변화 차트 컴포넌트
 * 
 * HIR, 전환률, 성장률, 처방지수 4개 지표의 트렌드 라인 차트
 * PRD 4.3 참고: Outcome Layer 변화
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getOutcomes } from '@/actions/outcomes/get-outcomes';
import { calculatePeriod } from '@/lib/utils/chart-data';
import { Button } from '@/components/ui/button';
import type { Outcome } from '@/types/database.types';

const OUTCOME_COLORS = {
  hir: 'hsl(var(--primary))',
  conversion_rate: '#8884d8',
  field_growth_rate: '#82ca9d',
  prescription_index: '#ffc658',
};

const OUTCOME_LABELS = {
  hir: 'HIR',
  conversion_rate: '전환률',
  field_growth_rate: '필드 성장률',
  prescription_index: '처방지수',
};

interface OutcomeTrendData {
  date: string;
  hir: number;
  conversion_rate: number;
  field_growth_rate: number;
  prescription_index: number;
}

export function OutcomeTrendChart() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<OutcomeTrendData[]>([]);
  const [targets, setTargets] = useState<{
    hir?: number;
    conversion_rate?: number;
    field_growth_rate?: number;
    prescription_index?: number;
  }>({});

  useEffect(() => {
    async function fetchData() {
      console.group('OutcomeTrendChart: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(period);
        console.log('기간:', period, '일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // Outcome 데이터 조회 (전체 통계만, account_id가 null인 것)
        const { data: outcomes } = await getOutcomes({
          periodStart: start,
          periodEnd: end,
          accountId: null, // 전체 통계만
        });

        console.log('조회된 Outcome 수:', outcomes.length);

        // period_type별로 그룹화하여 트렌드 데이터 생성
        // 일별 데이터가 있으면 일별로, 없으면 주별/월별로
        const trendMap = new Map<string, OutcomeTrendData>();

        for (const outcome of outcomes) {
          const periodStartDate = new Date(outcome.period_start);
          let dateKey: string;

          // period_type에 따라 날짜 키 생성
          if (outcome.period_type === 'daily') {
            dateKey = periodStartDate.toISOString().split('T')[0];
          } else if (outcome.period_type === 'weekly') {
            // 주별: 해당 주의 월요일 날짜
            const dayOfWeek = periodStartDate.getDay();
            const monday = new Date(periodStartDate);
            monday.setDate(periodStartDate.getDate() - dayOfWeek + 1);
            dateKey = monday.toISOString().split('T')[0];
          } else {
            // 월별 이상: 해당 월의 첫째 날
            dateKey = `${periodStartDate.getFullYear()}-${String(periodStartDate.getMonth() + 1).padStart(2, '0')}-01`;
          }

          // 같은 날짜에 여러 데이터가 있으면 평균 계산
          const existing = trendMap.get(dateKey);
          if (existing) {
            trendMap.set(dateKey, {
              date: dateKey,
              hir: (existing.hir + outcome.hir_score) / 2,
              conversion_rate: (existing.conversion_rate + outcome.conversion_rate) / 2,
              field_growth_rate: (existing.field_growth_rate + outcome.field_growth_rate) / 2,
              prescription_index: (existing.prescription_index + outcome.prescription_index) / 2,
            });
          } else {
            trendMap.set(dateKey, {
              date: dateKey,
              hir: outcome.hir_score,
              conversion_rate: outcome.conversion_rate,
              field_growth_rate: outcome.field_growth_rate,
              prescription_index: outcome.prescription_index,
            });
          }
        }

        const trendDataArray = Array.from(trendMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        console.log('트렌드 데이터:', trendDataArray.length, '개');

        // 목표선 계산 (평균값 또는 기준값)
        if (trendDataArray.length > 0) {
          const avgHir =
            trendDataArray.reduce((sum, d) => sum + d.hir, 0) / trendDataArray.length;
          const avgConversion =
            trendDataArray.reduce((sum, d) => sum + d.conversion_rate, 0) /
            trendDataArray.length;
          const avgGrowth =
            trendDataArray.reduce((sum, d) => sum + d.field_growth_rate, 0) /
            trendDataArray.length;
          const avgPrescription =
            trendDataArray.reduce((sum, d) => sum + d.prescription_index, 0) /
            trendDataArray.length;

          setTargets({
            hir: Math.round(avgHir),
            conversion_rate: Math.round(avgConversion),
            field_growth_rate: Math.round(avgGrowth),
            prescription_index: Math.round(avgPrescription),
          });
        }

        setChartData(trendDataArray);
      } catch (err) {
        console.error('Outcome 트렌드 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, [period]);

  const isEmpty = !isLoading && chartData.length === 0;

  return (
    <ChartWrapper
      title="Outcome Layer 변화"
      description={`HIR, 전환률, 성장률, 처방지수 트렌드 (${period}일)`}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다."
    >
      <div className="space-y-4">
        {/* 기간 선택 */}
        <div className="flex gap-2">
          <Button
            variant={period === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(7)}
          >
            7일
          </Button>
          <Button
            variant={period === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(30)}
          >
            30일
          </Button>
          <Button
            variant={period === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(90)}
          >
            90일
          </Button>
        </div>

        {/* LineChart */}
        {!isEmpty && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('ko-KR');
                }}
                formatter={(value: number) => `${value.toFixed(1)}`}
              />
              <Legend />
              {/* 목표선 */}
              {targets.hir && (
                <ReferenceLine
                  y={targets.hir}
                  stroke={OUTCOME_COLORS.hir}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `HIR 목표: ${targets.hir}`, position: 'right' }}
                />
              )}
              {targets.conversion_rate && (
                <ReferenceLine
                  y={targets.conversion_rate}
                  stroke={OUTCOME_COLORS.conversion_rate}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `전환률 목표: ${targets.conversion_rate}`, position: 'right' }}
                />
              )}
              {targets.field_growth_rate && (
                <ReferenceLine
                  y={targets.field_growth_rate}
                  stroke={OUTCOME_COLORS.field_growth_rate}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `성장률 목표: ${targets.field_growth_rate}`, position: 'right' }}
                />
              )}
              {targets.prescription_index && (
                <ReferenceLine
                  y={targets.prescription_index}
                  stroke={OUTCOME_COLORS.prescription_index}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `처방지수 목표: ${targets.prescription_index}`, position: 'right' }}
                />
              )}
              {/* Outcome 지표 라인 */}
              <Line
                type="monotone"
                dataKey="hir"
                stroke={OUTCOME_COLORS.hir}
                name={OUTCOME_LABELS.hir}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="conversion_rate"
                stroke={OUTCOME_COLORS.conversion_rate}
                name={OUTCOME_LABELS.conversion_rate}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="field_growth_rate"
                stroke={OUTCOME_COLORS.field_growth_rate}
                name={OUTCOME_LABELS.field_growth_rate}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="prescription_index"
                stroke={OUTCOME_COLORS.prescription_index}
                name={OUTCOME_LABELS.prescription_index}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartWrapper>
  );
}






