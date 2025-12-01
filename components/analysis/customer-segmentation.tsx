/**
 * 고객 세분화 및 HIR 비교 차트 컴포넌트
 * 
 * PieChart: 고객군 비율 분포
 * BarChart: 고객군별 HIR 비교
 * PRD 4.2.2 참고: 고객 세분화 및 HIR 비교
 */

'use client';

import { useState, useEffect } from 'react';
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getAccounts } from '@/actions/accounts/get-accounts';
import { getOutcomes } from '@/actions/outcomes/get-outcomes';
import { calculatePeriod } from '@/lib/utils/chart-data';

interface CustomerSegmentData {
  type: string;
  typeLabel: string;
  count: number;
  avgHir: number;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  general_hospital: '대학병원',
  hospital: '병원',
  clinic: '의원',
  pharmacy: '약국',
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary))',
  'hsl(var(--primary))',
  'hsl(var(--primary))',
];

export function CustomerSegmentation() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([]);
  const [barData, setBarData] = useState<CustomerSegmentData[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.group('CustomerSegmentation: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // 모든 계정 조회
        const accountsResult = await getAccounts({});
        console.log('조회된 계정 수:', accountsResult.data.length);

        // 타입별로 그룹화
        const typeMap = new Map<string, { count: number; hirScores: number[] }>();

        for (const account of accountsResult.data) {
          const type = account.type || 'clinic';
          if (!typeMap.has(type)) {
            typeMap.set(type, { count: 0, hirScores: [] });
          }
          typeMap.get(type)!.count += 1;
        }

        // 각 타입별 HIR 계산 (account_id별 Outcome 조회)
        const outcomesResult = await getOutcomes({
          periodStart: start,
          periodEnd: end,
          periodType: 'daily',
        });

        console.log('조회된 Outcome 수:', outcomesResult.data.length);

        // account_id별로 HIR 집계
        for (const outcome of outcomesResult.data) {
          if (outcome.account_id) {
            // account_id로 account 찾기
            const account = accountsResult.data.find((a) => a.id === outcome.account_id);
            if (account) {
              const type = account.type || 'clinic';
              const typeData = typeMap.get(type);
              if (typeData) {
                typeData.hirScores.push(outcome.hir_score);
              }
            }
          }
        }

        // PieChart 데이터 생성 (고객군 비율)
        const pieDataArray = Array.from(typeMap.entries()).map(([type, data]) => ({
          name: ACCOUNT_TYPE_LABELS[type] || type,
          value: data.count,
        }));

        // BarChart 데이터 생성 (고객군별 평균 HIR)
        const barDataArray: CustomerSegmentData[] = Array.from(typeMap.entries()).map(([type, data]) => {
          const avgHir = data.hirScores.length > 0
            ? data.hirScores.reduce((sum, val) => sum + val, 0) / data.hirScores.length
            : 0;

          return {
            type,
            typeLabel: ACCOUNT_TYPE_LABELS[type] || type,
            count: data.count,
            avgHir: Math.round(avgHir * 10) / 10,
          };
        });

        console.log('PieChart 데이터:', pieDataArray);
        console.log('BarChart 데이터:', barDataArray);

        setPieData(pieDataArray);
        setBarData(barDataArray);
      } catch (err) {
        console.error('고객 세분화 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const isEmpty = !isLoading && (pieData.length === 0 || barData.length === 0);

  return (
    <ChartWrapper
      title="고객 세분화 및 HIR 비교"
      description="고객군별 행동 품질(HIR) 비교"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다."
    >
      {!isEmpty && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* PieChart: 고객군 비율 분포 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">고객군 비율 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BarChart: 고객군별 HIR 비교 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">고객군별 HIR 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="typeLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgHir" fill="hsl(var(--primary))" name="평균 HIR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
