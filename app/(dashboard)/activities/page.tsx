/**
 * 활동 기록 페이지
 * 
 * 영업사원의 행동 데이터를 기록하고 조회하는 페이지
 * 실제 기능은 스프린트 2에서 구현
 */

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">활동 기록</h1>
        <p className="text-muted-foreground">
          병원 방문, 전화, 메시지 등 모든 활동을 기록하세요.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          활동 기록 기능은 스프린트 2에서 구현됩니다.
        </p>
      </div>
    </div>
  );
}

