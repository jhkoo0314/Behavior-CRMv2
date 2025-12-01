/**
 * 활동 볼륨 × 품질 Matrix Heatmap 컴포넌트
 * 
 * X축: 활동 볼륨, Y축: 품질
 * PRD 4.2.3 참고: 활동 볼륨 × 품질 Matrix
 */

'use client';

import { useState, useEffect } from 'react';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { getActivities } from '@/actions/activities/get-activities';
import { calculatePeriod } from '@/lib/utils/chart-data';
import type { HeatmapCell } from '@/types/chart.types';

interface HeatmapData {
  cells: HeatmapCell[];
  volumeBins: number[];
  qualityBins: number[];
}

export function VolumeQualityHeatmap() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.group('VolumeQualityHeatmap: 데이터 조회 시작');
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = calculatePeriod(30);
        console.log('기간: 최근 30일');
        console.log('시작일:', start);
        console.log('종료일:', end);

        // 활동 데이터 조회
        const activitiesResult = await getActivities({
          startDate: start,
          endDate: end,
        });

        console.log('조회된 활동 수:', activitiesResult.data.length);

        if (activitiesResult.data.length === 0) {
          setHeatmapData({ cells: [], volumeBins: [], qualityBins: [] });
          return;
        }

        // 활동 볼륨과 품질 점수 추출
        const volumeQualityPairs = activitiesResult.data.map((activity) => ({
          volume: activity.quantity_score || 0,
          quality: activity.quality_score || 0,
        }));

        // 볼륨과 품질의 최소/최대값 계산
        const volumes = volumeQualityPairs.map((p) => p.volume);
        const qualities = volumeQualityPairs.map((p) => p.quality);
        const minVolume = Math.min(...volumes);
        const maxVolume = Math.max(...volumes);
        const minQuality = Math.min(...qualities);
        const maxQuality = Math.max(...qualities);

        // 그리드 크기 (5x5)
        const gridSize = 5;
        const volumeStep = (maxVolume - minVolume) / gridSize;
        const qualityStep = (maxQuality - minQuality) / gridSize;

        // 볼륨과 품질 구간 정의
        const volumeBins: number[] = [];
        const qualityBins: number[] = [];

        for (let i = 0; i <= gridSize; i++) {
          volumeBins.push(minVolume + volumeStep * i);
          qualityBins.push(minQuality + qualityStep * i);
        }

        // 각 셀에 데이터 집계
        const cellMap = new Map<string, number>();

        for (const pair of volumeQualityPairs) {
          const volumeBin = Math.min(
            Math.floor((pair.volume - minVolume) / volumeStep),
            gridSize - 1
          );
          const qualityBin = Math.min(
            Math.floor((pair.quality - minQuality) / qualityStep),
            gridSize - 1
          );
          const key = `${volumeBin}-${qualityBin}`;
          cellMap.set(key, (cellMap.get(key) || 0) + 1);
        }

        // Heatmap 셀 데이터 생성
        const cells: HeatmapCell[] = [];

        for (let v = 0; v < gridSize; v++) {
          for (let q = 0; q < gridSize; q++) {
            const key = `${v}-${q}`;
            const count = cellMap.get(key) || 0;
            const volume = volumeBins[v];
            const quality = qualityBins[q];

            cells.push({
              x: v,
              y: q,
              value: count,
              label: `볼륨: ${Math.round(volume)}, 품질: ${Math.round(quality)}`,
            });
          }
        }

        console.log('Heatmap 데이터:', { cells, volumeBins, qualityBins });
        setHeatmapData({ cells, volumeBins, qualityBins });
      } catch (err) {
        console.error('활동 볼륨 × 품질 Matrix 데이터 조회 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다.'));
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    fetchData();
  }, []);

  const isEmpty = !isLoading && (!heatmapData || heatmapData.cells.length === 0);

  // 색상 강도 계산
  const getColorIntensity = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.min(value / maxValue, 1);
  };

  const maxValue = heatmapData
    ? Math.max(...heatmapData.cells.map((c) => c.value))
    : 0;

  return (
    <ChartWrapper
      title="활동 볼륨 × 품질 Matrix"
      description="행동 프로파일 분류 (많이 하지만 품질 낮음 / 적게 하지만 품질 높음 등)"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="데이터가 없습니다."
    >
      {!isEmpty && heatmapData && (
        <div className="space-y-4">
          {/* 범례 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">활동량:</span>
              <div className="flex gap-2">
                <div className="h-4 w-4 rounded bg-primary/20" />
                <span>낮음</span>
                <div className="h-4 w-4 rounded bg-primary/60" />
                <span>중간</span>
                <div className="h-4 w-4 rounded bg-primary" />
                <span>높음</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="relative">
            <div className="grid grid-cols-6 gap-1">
              {/* Y축 라벨 (품질) */}
              <div className="flex flex-col justify-end pb-2 pr-2 text-right text-xs text-muted-foreground">
                <div>품질 높음</div>
                <div className="flex-1" />
                <div>품질 낮음</div>
              </div>

              {/* 그리드 */}
              <div className="col-span-5 grid grid-cols-5 gap-1">
                {/* X축 라벨 (볼륨) */}
                <div className="col-span-5 flex justify-between text-xs text-muted-foreground">
                  <span>볼륨 낮음</span>
                  <span>볼륨 높음</span>
                </div>

                {/* 셀들 */}
                {heatmapData.cells.map((cell, index) => {
                  const intensity = getColorIntensity(cell.value, maxValue);
                  const opacity = 0.2 + intensity * 0.8;
                  const bgColor = `hsl(var(--primary) / ${opacity})`;

                  return (
                    <div
                      key={index}
                      className="aspect-square cursor-pointer rounded border border-border bg-primary/20 transition-all hover:scale-105 hover:shadow-md"
                      style={{ backgroundColor: bgColor }}
                      title={`${cell.label}, 활동 수: ${cell.value}`}
                    >
                      <div className="flex h-full items-center justify-center text-xs font-medium">
                        {cell.value > 0 && cell.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
