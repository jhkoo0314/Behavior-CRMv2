/**
 * @file error-boundary.tsx
 * @description React Error Boundary 컴포넌트
 *
 * 전역 에러 처리를 위한 Error Boundary 구현
 * - 사용자 친화적 에러 메시지 표시
 * - 개발 환경에서만 상세 에러 정보 표시
 * - 향후 모니터링 도구 연동 준비
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (향후 모니터링 도구 연동)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 개발 환경에서 상세 정보 로깅
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Boundary - 상세 정보');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // 커스텀 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>문제가 발생했습니다</CardTitle>
              </div>
              <CardDescription>
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 사용자 친화적 메시지 */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  죄송합니다. 작업을 처리하는 중 문제가 발생했습니다.
                  <br />
                  문제가 계속되면 관리자에게 문의해주세요.
                </p>
              </div>

              {/* 개발 환경에서만 상세 정보 표시 */}
              {isDevelopment && this.state.error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-destructive">
                    개발 환경 - 에러 상세 정보
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">에러 메시지:</p>
                      <p className="text-sm font-mono text-destructive">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">스택 트레이스:</p>
                        <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          컴포넌트 스택:
                        </p>
                        <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  페이지 새로고침
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  홈으로 이동
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 차트 컴포넌트용 간단한 Error Boundary
 */
export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">차트를 불러올 수 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            차트 데이터를 로드하는 중 오류가 발생했습니다.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

