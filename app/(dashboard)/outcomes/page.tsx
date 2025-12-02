/**
 * 성과 리포트 페이지
 * 
 * Outcome Layer 지표를 조회하는 페이지
 * 실제 기능은 스프린트 3에서 구현
 */

export default function OutcomesPage() {
  return (
    <div className="min-w-0 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">성과 리포트</h1>
        <p className="text-muted-foreground">
          행동 데이터를 기반으로 계산된 성과 지표를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          성과 리포트 기능은 스프린트 3에서 구현됩니다.
        </p>
      </div>
    </div>
  );
}



