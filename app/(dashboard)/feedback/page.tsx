/**
 * 피드백 페이지
 *
 * 사용자 피드백을 수집하는 페이지입니다.
 */

import { FeedbackForm } from '@/components/feedback/feedback-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeedbackPage() {
  return (
    <div className="min-w-0 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">피드백</h1>
        <p className="text-muted-foreground">
          버그 리포트, 기능 제안, 사용법 문의 등을 남겨주세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>피드백 제출</CardTitle>
          <CardDescription>
            소중한 의견을 남겨주시면 서비스 개선에 큰 도움이 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
}

