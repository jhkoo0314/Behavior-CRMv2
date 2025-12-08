/**
 * Skill Tree (로드맵) 컴포넌트
 * 
 * 3단계 성장 로드맵을 표시하는 컴포넌트
 * PRD 4.3 참고: 성장 추천 액션
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  badge: {
    text: string;
    variant: 'completed' | 'active' | 'locked';
  };
  checklist: ChecklistItem[];
  status: 'completed' | 'active' | 'locked';
}

const defaultRoadmapSteps: RoadmapStep[] = [
  {
    id: 1,
    title: '기초 체력 다지기 (HIR)',
    description: '정직한 입력 습관이 형성되었습니다. 데이터 신뢰도가 90% 이상입니다.',
    badge: {
      text: 'Step 1. 완료',
      variant: 'completed',
    },
    status: 'completed',
    checklist: [
      { id: '1-1', text: '골든타임 입력률 80% 달성', completed: true },
      { id: '1-2', text: '미팅 직후 3분 내 기록', completed: true },
    ],
  },
  {
    id: 2,
    title: '관계 심화 (RTR)',
    description: '단순 방문을 넘어, 고객의 긍정 반응(태그)을 이끌어내야 할 단계입니다.',
    badge: {
      text: 'Step 2. 진행 중 (Focus)',
      variant: 'active',
    },
    status: 'active',
    checklist: [
      { id: '2-1', text: '긍정 태그(결정권자 등) 비중 30% ↑', completed: false },
      { id: '2-2', text: '관계 온도 70도 고객 5명 확보', completed: false },
    ],
  },
  {
    id: 3,
    title: '성과 수확 (Outcome)',
    description: '관계가 무르익은 고객에게 제안을 던져 매출을 실현하는 단계입니다.',
    badge: {
      text: 'Step 3. 잠김',
      variant: 'locked',
    },
    status: 'locked',
    checklist: [
      { id: '3-1', text: '제안 단계 리드 3건 생성', completed: false },
      { id: '3-2', text: '월 목표 매출 80% 조기 달성', completed: false },
    ],
  },
];

export function SkillTree() {
  const [steps, setSteps] = useState<RoadmapStep[]>(defaultRoadmapSteps);
  const router = useRouter();

  console.group('SkillTree: 렌더링');
  console.log('로드맵 단계 수:', steps.length);
  console.log('활성 단계:', steps.find((s) => s.status === 'active')?.id);
  console.groupEnd();

  const handleViewRecommendations = () => {
    console.log('추천 활동 보기 클릭');
    router.push('/activities');
  };

  const getBadgeStyles = (variant: 'completed' | 'active' | 'locked') => {
    switch (variant) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-indigo-100 text-indigo-800';
      case 'locked':
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">🚀 다음 단계 성장 미션 (Next Steps)</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <Card
            key={step.id}
            className={`relative transition-all ${
              step.status === 'active'
                ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.1)]'
                : ''
            } ${
              step.status === 'locked'
                ? 'cursor-not-allowed opacity-60 bg-slate-50'
                : ''
            }`}
          >
            <div className="p-6">
              {/* 잠금 아이콘 */}
              {step.status === 'locked' && (
                <div className="absolute right-5 top-5">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              {/* 배지 */}
              <Badge
                className={`mb-3 text-xs font-bold uppercase ${getBadgeStyles(step.badge.variant)}`}
              >
                {step.badge.text}
              </Badge>

              {/* 제목 */}
              <h4 className="mb-2 flex items-center gap-2 text-lg font-bold">
                {step.title}
                {step.status === 'completed' && (
                  <span className="text-green-600">✅</span>
                )}
                {step.status === 'active' && (
                  <span className="text-indigo-600">🔥</span>
                )}
              </h4>

              {/* 설명 */}
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* 체크리스트 */}
              <ul className="mb-5 space-y-2">
                {step.checklist.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-center gap-2 text-sm ${
                      item.completed
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                        item.completed
                          ? 'border-primary bg-primary text-white'
                          : 'border-border'
                      }`}
                    >
                      {item.completed && <Check className="h-3 w-3" />}
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              {/* 추천 활동 보기 버튼 (활성 단계만) */}
              {step.status === 'active' && (
                <Button
                  onClick={handleViewRecommendations}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  추천 활동 보기
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}




