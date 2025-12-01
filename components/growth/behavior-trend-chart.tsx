/**
 * Behavior 트렌드 차트 컴포넌트
 * 
 * 8개 Behavior 지표별 시간에 따른 트렌드 라인 차트
 * PRD 4.3 참고: 행동 품질 트렌드
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
} from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getBehaviorScoresTrend } from '@/actions/behavior-scores/get-behavior-scores-trend';
import { BEHAVIOR_TYPE_LABELS } from '@/constants/behavior-types';
import { calculatePeriod, calculatePreviousPeriod } from '@/lib/utils/chart-data';
import { Button } from '@/components/ui/button';
import type { BehaviorTrendData } from '@/actions/behavior-scores/get-behavior-scores-trend';

const COLORS = [
  'hsl(var(--primary))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#0088fe',
  '#ff00ff',
];

export function BehaviorTrendChart() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [compareMode, setCompareMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<BehaviorTrendData[]>([]);
  const [compareData, setCompareData] = useState<BehaviorTrendData[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('BehaviorTrendChart: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(period);
        console.log('기간:', period, '일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // 현재 기간 데이터 조회
        const currentData = await getBehaviorScoresTrend({
          periodStart: start,
          periodEnd: end,
          groupBy: period <= 30 ? 'day' : 'week',
        });

        console.log('현재 기간 데이터:', currentData.length, '개');

        setChartData(currentData);

        // 비교 모드인 경우 이전 기간 데이터도 조회
        if (compareMode) {
          const { start: prevStart, end: prevEnd } = calculatePreviousPeriod(
            start,
            end
          );
          console.log('이전 기간:', prevStart, '~', prevEnd);

          const previousData = await getBehaviorScoresTrend({
            periodStart: prevStart,
            periodEnd: prevEnd,
            groupBy: period <= 30 ? 'day' : 'week',
          });

          console.log('이전 기간 데이터:', previousData.length, '개');
          setCompareData(previousData);
        } else {
          setCompareData([]);
        }
      } catch (err) {
        console.error('Behavior 트렌드 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, [period, compareMode]);

  const isEmpty = !isLoading && chartData.length === 0;

  // 차트 데이터 준비 (현재 기간 + 비교 기간)
  const combinedData = chartData.map((item, index) => {
    const compareItem = compareData[index];
    return {
      date: item.date,
      approach: item.approach,
      contact: item.contact,
      visit: item.visit,
      presentation: item.presentation,
      question: item.question,
      need_creation: item.need_creation,
      demonstration: item.demonstration,
      follow_up: item.follow_up,
      // 비교 데이터 (접두사에 prev_ 추가)
      ...(compareMode && compareItem
        ? {
            'prev_approach': compareItem.approach,
            'prev_contact': compareItem.contact,
            'prev_visit': compareItem.visit,
            'prev_presentation': compareItem.presentation,
            'prev_question': compareItem.question,
            'prev_need_creation': compareItem.need_creation,
            'prev_demonstration': compareItem.demonstration,
            'prev_follow_up': compareItem.follow_up,
          }
        : {}),
    };
  });

  return (
    <ChartWrapper
      title="행동 품질 트렌드"
      description={`8개 Behavior 지표별 트렌드 (${period}일)`}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다. 활동을 기록하면 트렌드 차트가 표시됩니다."
    >
      <div className="space-y-4">
        {/* 기간 선택 및 비교 모드 */}
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            {compareMode ? '비교 모드 끄기' : '이전 기간과 비교'}
          </Button>
        </div>

        {/* LineChart */}
        {!isEmpty && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('ko-KR');
                }}
              />
              <Legend />
              {/* 현재 기간 라인 */}
              <Line
                type="monotone"
                dataKey="approach"
                stroke={COLORS[0]}
                name={BEHAVIOR_TYPE_LABELS.approach}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="contact"
                stroke={COLORS[1]}
                name={BEHAVIOR_TYPE_LABELS.contact}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="visit"
                stroke={COLORS[2]}
                name={BEHAVIOR_TYPE_LABELS.visit}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="presentation"
                stroke={COLORS[3]}
                name={BEHAVIOR_TYPE_LABELS.presentation}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="question"
                stroke={COLORS[4]}
                name={BEHAVIOR_TYPE_LABELS.question}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="need_creation"
                stroke={COLORS[5]}
                name={BEHAVIOR_TYPE_LABELS.need_creation}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="demonstration"
                stroke={COLORS[6]}
                name={BEHAVIOR_TYPE_LABELS.demonstration}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="follow_up"
                stroke={COLORS[7]}
                name={BEHAVIOR_TYPE_LABELS.follow_up}
                strokeWidth={2}
              />
              {/* 비교 기간 라인 (점선) */}
              {compareMode && (
                <>
                  <Line
                    type="monotone"
                    dataKey="prev_approach"
                    stroke={COLORS[0]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.approach} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_contact"
                    stroke={COLORS[1]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.contact} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_visit"
                    stroke={COLORS[2]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.visit} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_presentation"
                    stroke={COLORS[3]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.presentation} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_question"
                    stroke={COLORS[4]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.question} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_need_creation"
                    stroke={COLORS[5]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.need_creation} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_demonstration"
                    stroke={COLORS[6]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.demonstration} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev_follow_up"
                    stroke={COLORS[7]}
                    strokeDasharray="5 5"
                    name={`${BEHAVIOR_TYPE_LABELS.follow_up} (이전)`}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartWrapper>
  );
}

