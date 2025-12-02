/**
 * 행동 균형 분석 레이더 차트 컴포넌트
 * 
 * 4개 지표(HIR, RTR, BCR, PHR)의 밸런스를 SVG 레이더 차트로 시각화합니다.
 * 중간 영역에 배치됩니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBehaviorMetrics } from '@/actions/analytics/get-behavior-metrics';

interface BehaviorMetrics {
  hir: number;
  rtr: number;
  bcr: number;
  phr: number;
}

interface RadarPoint {
  x: number;
  y: number;
}

function calculateRadarPoint(score: number, angleDeg: number, center: number, maxR: number): RadarPoint {
  const r = (score / 100) * maxR;
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: center + r * Math.cos(angleRad),
    y: center + r * Math.sin(angleRad),
  };
}

export function BehaviorRadarChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<BehaviorMetrics | null>(null);
  const [radarPoints, setRadarPoints] = useState<{
    hir: RadarPoint;
    rtr: RadarPoint;
    bcr: RadarPoint;
    phr: RadarPoint;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('BehaviorRadarChart: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const data = await getBehaviorMetrics({
          periodStart: startDate,
          periodEnd: endDate,
        });

        setMetrics({
          hir: data.hir,
          rtr: data.rtr,
          bcr: data.bcr,
          phr: data.phr,
        });

        console.log('지표 데이터:', data);
      } catch (err) {
        console.error('지표 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!metrics) return;

    const center = 100;
    const maxR = 80;

    const hirPoint = calculateRadarPoint(metrics.hir, 0, center, maxR); // Top
    const rtrPoint = calculateRadarPoint(metrics.rtr, 90, center, maxR); // Right
    const bcrPoint = calculateRadarPoint(metrics.bcr, 180, center, maxR); // Bottom
    const phrPoint = calculateRadarPoint(metrics.phr, 270, center, maxR); // Left

    setRadarPoints({
      hir: hirPoint,
      rtr: rtrPoint,
      bcr: bcrPoint,
      phr: phrPoint,
    });
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <CardHeader className="w-full">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="flex items-center justify-center w-full">
          <Skeleton className="h-[240px] w-[240px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics || !radarPoints) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>행동 균형 분석</CardTitle>
          <CardDescription>4대 지표의 밸런스를 시각화합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.message || '데이터를 불러올 수 없습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 폴리곤 포인트 문자열 생성
  const polygonPoints = `${radarPoints.hir.x},${radarPoints.hir.y} ${radarPoints.rtr.x},${radarPoints.rtr.y} ${radarPoints.bcr.x},${radarPoints.bcr.y} ${radarPoints.phr.x},${radarPoints.phr.y}`;

  // 가장 낮은 지표 찾기 (팁 메시지용)
  const lowestMetric = Math.min(metrics.hir, metrics.rtr, metrics.bcr, metrics.phr);
  const lowestMetricName =
    lowestMetric === metrics.rtr
      ? 'RTR(관계온도)'
      : lowestMetric === metrics.hir
        ? 'HIR(정직입력)'
        : lowestMetric === metrics.bcr
          ? 'BCR(루틴)'
          : 'PHR(관리)';

  return (
    <Card className="flex flex-col items-center justify-center h-full">
      <CardHeader className="w-full">
        <CardTitle>행동 균형 분석</CardTitle>
        <CardDescription>4대 지표의 밸런스를 시각화합니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center w-full">
        {/* SVG 레이더 차트 */}
        <svg width="240" height="240" viewBox="0 0 200 200" className="mb-4">
          {/* 배경 원 */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#e2e8f0" />

          {/* 축 */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="#e2e8f0" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#e2e8f0" />

          {/* 레이블 */}
          <text
            x="100"
            y="15"
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            fontWeight="bold"
          >
            HIR (정직)
          </text>
          <text
            x="190"
            y="105"
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            fontWeight="bold"
          >
            RTR (관계)
          </text>
          <text
            x="100"
            y="195"
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            fontWeight="bold"
          >
            BCR (루틴)
          </text>
          <text
            x="10"
            y="105"
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            fontWeight="bold"
          >
            PHR (관리)
          </text>

          {/* 데이터 폴리곤 */}
          <polygon
            points={polygonPoints}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* 포인트 */}
          <circle cx={radarPoints.hir.x} cy={radarPoints.hir.y} r="3" fill="#3b82f6" />
          <circle cx={radarPoints.rtr.x} cy={radarPoints.rtr.y} r="3" fill="#3b82f6" />
          <circle cx={radarPoints.bcr.x} cy={radarPoints.bcr.y} r="3" fill="#3b82f6" />
          <circle cx={radarPoints.phr.x} cy={radarPoints.phr.y} r="3" fill="#3b82f6" />
        </svg>

        {/* 팁 메시지 */}
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          💡 <strong>Tip:</strong> {lowestMetricName}가 다른 지표에 비해 낮습니다.
          <br />
          {lowestMetricName === 'RTR(관계온도)'
            ? '단순 방문보다 태그 기반의 긍정 활동을 늘려보세요.'
            : lowestMetricName === 'HIR(정직입력)'
              ? '활동 기록 시 정확한 정보를 입력해보세요.'
              : lowestMetricName === 'BCR(루틴)'
                ? '규칙적인 활동 패턴을 유지해보세요.'
                : '다음 활동 예정일을 설정하여 관리해보세요.'}
        </p>
      </CardContent>
    </Card>
  );
}

