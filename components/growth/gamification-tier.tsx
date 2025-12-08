/**
 * Gamification Tier 컴포넌트
 * 
 * 사용자의 레벨, 경험치, 진행률을 표시하는 게이미피케이션 UI
 * PRD 4.3 참고: 성장 맵
 */

'use client';

interface GamificationTierProps {
  level?: number;
  levelName?: string;
  currentXP?: number;
  nextLevelXP?: number;
  percentile?: number;
  description?: string;
}

export function GamificationTier({
  level = 2,
  levelName = 'Professional',
  currentXP = 750,
  nextLevelXP = 1000,
  percentile = 15,
  description = '행동이 습관으로 자리 잡았습니다. 이제 성과를 수확할 때입니다.',
}: GamificationTierProps) {
  console.group('GamificationTier: 렌더링');
  console.log('레벨:', level, levelName);
  console.log('경험치:', currentXP, '/', nextLevelXP);
  console.log('상위 퍼센트:', percentile, '%');

  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);
  const remainingXP = nextLevelXP - currentXP;

  console.log('진행률:', progressPercentage, '%');
  console.log('남은 경험치:', remainingXP);
  console.groupEnd();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-lg">
      {/* 배경 장식 원형 */}
      <div className="absolute -right-12 -top-24 h-[300px] w-[300px] rounded-full bg-white/5" />
      <div className="absolute bottom-[-50px] left-12 h-[150px] w-[150px] rounded-full bg-white/5" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* 레벨 정보 */}
        <div className="flex-1 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80">
            Current Status
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-extrabold">
              Level {level}. {levelName}
            </div>
            <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-semibold">
              상위 {percentile}%
            </span>
          </div>
          <p className="text-sm opacity-80">{description}</p>
        </div>

        {/* 진행률 섹션 */}
        <div className="w-full space-y-2 md:w-1/2">
          <div className="flex justify-between text-sm opacity-90">
            <span>XP (경험치)</span>
            <span>Next: Master</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-0 h-full w-5 bg-white blur-sm opacity-50" />
            </div>
          </div>
          <p className="text-right text-xs opacity-70">
            마스터 레벨까지 {remainingXP}점 남음
          </p>
        </div>
      </div>
    </div>
  );
}




