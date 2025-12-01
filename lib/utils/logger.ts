/**
 * @file logger.ts
 * @description 구조화된 로깅 유틸리티
 *
 * 클라이언트/서버 환경 구분
 * 로그 레벨 관리 (info, warn, error)
 * 구조화된 로그 포맷
 * 개발 환경에서는 console 사용, 프로덕션에서는 구조화된 로그
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 환경 변수 확인
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

/**
 * 로그 레벨에 따른 색상 (개발 환경)
 */
const logColors: Record<LogLevel, string> = {
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[90m', // Gray
};

const resetColor = '\x1b[0m';

/**
 * 구조화된 로그 엔트리 생성
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * 개발 환경에서 콘솔에 로그 출력
 */
function logToConsole(entry: LogEntry) {
  const { level, message, context, error } = entry;
  const color = logColors[level] || resetColor;
  const prefix = isServer ? '[SERVER]' : '[CLIENT]';
  const levelUpper = level.toUpperCase().padEnd(5);

  // 그룹 시작
  console.group(`${color}${prefix} [${levelUpper}]${resetColor} ${message}`);

  // 컨텍스트 출력
  if (context && Object.keys(context).length > 0) {
    console.log('📋 Context:', context);
  }

  // 에러 정보 출력
  if (error) {
    console.error('❌ Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  // 타임스탬프
  console.log('⏰ Timestamp:', entry.timestamp);

  console.groupEnd();
}

/**
 * 프로덕션 환경에서 구조화된 로그 출력
 */
function logStructured(entry: LogEntry) {
  // 향후 모니터링 도구 연동 시 여기에 추가
  // 예: Sentry, LogRocket, DataDog 등
  if (isServer) {
    // 서버 사이드: JSON 형태로 출력 (로그 수집 시스템에서 파싱)
    console.log(JSON.stringify(entry));
  } else {
    // 클라이언트 사이드: 구조화된 로그 (향후 외부 서비스로 전송)
    console.log(JSON.stringify(entry));
  }
}

/**
 * 로그 출력 함수
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const entry = createLogEntry(level, message, context, error);

  if (isDevelopment) {
    logToConsole(entry);
  } else {
    logStructured(entry);
  }

  // 에러 레벨인 경우 추가 처리
  if (level === 'error' && error) {
    // 향후 에러 모니터링 도구 연동
    // 예: Sentry.captureException(error, { extra: context })
  }
}

/**
 * 로깅 유틸리티 API
 */
export const logger = {
  /**
   * 정보 로그
   */
  info: (message: string, context?: LogContext) => {
    log('info', message, context);
  },

  /**
   * 경고 로그
   */
  warn: (message: string, context?: LogContext) => {
    log('warn', message, context);
  },

  /**
   * 에러 로그
   */
  error: (message: string, error?: Error, context?: LogContext) => {
    log('error', message, context, error);
  },

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      log('debug', message, context);
    }
  },

  /**
   * Server Action 실행 로그
   */
  action: {
    start: (actionName: string, params?: LogContext) => {
      logger.info(`[Action] ${actionName} 시작`, { action: actionName, ...params });
    },
    end: (actionName: string, duration: number, result?: LogContext) => {
      logger.info(`[Action] ${actionName} 완료`, {
        action: actionName,
        duration: `${duration}ms`,
        ...result,
      });
    },
    error: (actionName: string, error: Error, params?: LogContext) => {
      logger.error(`[Action] ${actionName} 실패`, error, {
        action: actionName,
        ...params,
      });
    },
  },

  /**
   * 데이터베이스 쿼리 로그
   */
  db: {
    query: (query: string, params?: LogContext) => {
      logger.debug('[DB] 쿼리 실행', { query, ...params });
    },
    error: (query: string, error: Error, params?: LogContext) => {
      logger.error('[DB] 쿼리 실패', error, { query, ...params });
    },
  },
};

