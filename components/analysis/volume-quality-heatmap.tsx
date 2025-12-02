/**
 * 활동량(Volume) × 행동품질(Quality) 매트릭스 컴포넌트
 * 
 * 4분면 매트릭스로 팀원들의 활동 패턴을 시각화합니다.
 * - Q1 (우상단): Role Model (이상적) - High Quality, High Volume
 * - Q2 (좌상단): Sniper (고효율) - High Quality, Low Volume
 * - Q3 (좌하단): Low Performer (저성과) - Low Quality, Low Volume
 * - Q4 (우하단): Busy Fool (비효율) - Low Quality, High Volume
 */

'use client';

import { useState, useEffect } from 'react';

interface MatrixPoint {
  q: number; // Quality (0-100)
  v: number; // Volume (0-100)
  isMe: boolean;
}

export function VolumeQualityHeatmap() {
  const [teamData, setTeamData] = useState<MatrixPoint[]>([]);
  const [myData, setMyData] = useState<MatrixPoint | null>(null);

  useEffect(() => {
    // Mock 데이터 생성
    const generateMockData = () => {
      // 팀원 15명 데이터
      const team: MatrixPoint[] = Array.from({ length: 15 }, () => ({
        q: Math.random() * 100,
        v: Math.random() * 100,
        isMe: false,
      }));

      // 현재 사용자 데이터 (Busy Fool 시나리오)
      const me: MatrixPoint = {
        q: 35,
        v: 85,
        isMe: true,
      };

      setTeamData(team);
      setMyData(me);
    };

    generateMockData();
  }, []);

  const allData = myData ? [...teamData, myData] : teamData;

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-md">
      {/* Card Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">활동량(Volume) × 행동품질(Quality) 매트릭스</h3>
          <p className="mt-1 text-xs text-slate-500">
            나는 &apos;열심히만 하는 바보(Busy Fool)&apos; 인가, &apos;스나이퍼&apos;인가?
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
          팀원 비교 분석
        </div>
      </div>

      {/* Quadrant Container */}
      <div className="relative h-64 w-full border border-slate-200 bg-white sm:h-80">
        {/* Background Zones */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Q2: Sniper (좌상단) */}
          <div className="flex items-center justify-center border-b border-dashed border-r border-dashed border-slate-200 bg-blue-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-300 sm:text-xs">
            Sniper
            <br />
            (고효율)
          </div>
          
          {/* Q1: Role Model (우상단) */}
          <div className="flex items-center justify-center border-b border-dashed border-slate-200 bg-emerald-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-300 sm:text-xs">
            Role Model
            <br />
            (이상적)
          </div>
          
          {/* Q3: Low Performer (좌하단) */}
          <div className="flex items-center justify-center border-r border-dashed border-slate-200 bg-red-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-300 sm:text-xs">
            Low Performer
            <br />
            (저성과)
          </div>
          
          {/* Q4: Busy Fool (우하단) */}
          <div className="flex items-center justify-center bg-amber-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-300 sm:text-xs">
            Busy Fool
            <br />
            (비효율)
          </div>
        </div>

        {/* Axis Labels */}
        <div className="absolute -left-6 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-slate-500 sm:-left-8 sm:block sm:text-xs">
          행동 품질 (Quality Score)
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[10px] font-semibold text-slate-500 sm:translate-y-6 sm:text-xs">
          활동 빈도 (Visit Volume)
        </div>

        {/* Data Points */}
        {allData.map((point, index) => (
          <div
            key={index}
            className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full transition-all hover:scale-150 hover:opacity-100 ${
              point.isMe
                ? 'z-10 h-3.5 w-3.5 border-2 border-white bg-blue-500 shadow-[0_0_0_2px_rgb(59,130,246)]'
                : 'h-2.5 w-2.5 bg-slate-900 opacity-70'
            }`}
            style={{
              bottom: `${point.q}%`,
              left: `${point.v}%`,
            }}
            title={point.isMe ? '나 (현재 위치)' : `팀원 ${index + 1}`}
          />
        ))}
      </div>

      {/* Insight Box */}
      <div className="mt-5 rounded border-l-4 border-blue-500 bg-slate-50 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          💡 Analysis Insight
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          현재 <strong>&apos;Busy Fool&apos; (Q4)</strong> 영역에 위치해 있습니다. 방문 횟수는 상위 10%이나,{' '}
          <strong>HIR(정직성) 및 태그 다양성</strong>이 부족합니다. 무의미한 단순 방문을 줄이고, 관계 온도(RTR)를 높이는 미팅에 집중하세요.
        </p>
      </div>
    </div>
  );
}
